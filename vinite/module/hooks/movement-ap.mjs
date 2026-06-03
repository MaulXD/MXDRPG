import { clamp } from "../data/formulas.mjs";
import { getActorHexMovement } from "../automation/hex-utils.mjs";

const FLAG_SCOPE = "vinite";
const FLAG_TURN_DISTANCE = "turnDistance";
const FLAG_RUN_AP_CHARGED = "runApCharged";

const pendingPositions = new Map();

/**
 * Rastreia distância por turno e consome PA ao ultrapassar caminhada (faixa amarela).
 */
export function registerMovementApHooks() {
  Hooks.on("preUpdateToken", (doc, update) => {
    if (update.x === undefined && update.y === undefined) return;
    pendingPositions.set(doc.id, { x: doc._source.x, y: doc._source.y });
  });

  Hooks.on("updateToken", async (doc, update) => {
    if (update.x === undefined && update.y === undefined) return;
    if (!doc.actor) return;

    const from = pendingPositions.get(doc.id);
    pendingPositions.delete(doc.id);
    if (!from) return;

    const segment = canvas.grid.measureDistance(
      { x: from.x, y: from.y },
      { x: doc.x, y: doc.y },
      { gridSpaces: true }
    );

    if (!segment || segment <= 0) return;

    const prevTotal = doc.getFlag(FLAG_SCOPE, FLAG_TURN_DISTANCE) ?? 0;
    const totalDistance = prevTotal + segment;
    await doc.setFlag(FLAG_SCOPE, FLAG_TURN_DISTANCE, totalDistance);

    await maybeConsumeRunActionPoints(doc, totalDistance);
  });

  Hooks.on("deleteCombat", resetAllTurnFlags);
  Hooks.on("updateCombat", (combat, changed) => {
    if (changed.round !== undefined || changed.turn !== undefined) {
      resetAllTurnFlags();
    }
  });
}

/**
 * @param {TokenDocument} tokenDoc
 * @param {number} totalDistance
 */
async function maybeConsumeRunActionPoints(tokenDoc, totalDistance) {
  const actor = tokenDoc.actor;
  const { walk, runApCost } = getActorHexMovement(actor);

  if (totalDistance <= walk) return;

  if (tokenDoc.getFlag(FLAG_SCOPE, FLAG_RUN_AP_CHARGED)) return;

  const pa = actor.system.resources?.pontosAcao;
  if (!pa) return;

  const cost = runApCost;
  if (pa.value < cost) {
    ui.notifications.warn(game.i18n.format("ELDARIN.Movement.notEnoughPAForRun", { cost }));
    return;
  }

  const payload = {
    actorId: actor.id,
    newValue: clamp(pa.value - cost, pa.min ?? 0, pa.max ?? pa.value),
    tokenId: tokenDoc.id,
  };

  if (game.user.isGM) {
    await applyActionPointConsumption(payload);
  } else if (game.socket) {
    game.socket.emit("system.vinite", "consumeActionPoints", payload);
  }

  await tokenDoc.setFlag(FLAG_SCOPE, FLAG_RUN_AP_CHARGED, true);
  ui.notifications.info(game.i18n.format("ELDARIN.Movement.runApSpent", { cost }));
}

/**
 * @param {{ actorId: string, newValue: number }} payload
 */
export async function applyActionPointConsumption(payload) {
  const actor = game.actors.get(payload.actorId);
  if (!actor) return;
  if (!game.user.isGM && !actor.isOwner) return;
  await actor.update({ "system.resources.pontosAcao.value": payload.newValue });
}

function resetAllTurnFlags() {
  for (const token of canvas.tokens?.placeables ?? []) {
    token.document.unsetFlag(FLAG_SCOPE, FLAG_TURN_DISTANCE);
    token.document.unsetFlag(FLAG_SCOPE, FLAG_RUN_AP_CHARGED);
  }
  pendingPositions.clear();
}
