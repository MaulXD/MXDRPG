import { applyActionPointConsumption } from "./movement-ap.mjs";

/**
 * Handlers socketlib / game.socket para sincronizar PA entre clientes.
 */
export function registerSocketHandlers() {
  game.socket?.on("system.vinite", async (message, data) => {
    if (message === "consumeActionPoints") {
      await applyActionPointConsumption(data);
    }
  });

  if (game.modules.get("socketlib")?.active && globalThis.socketlib) {
    socketlib.registerSystem("vinite", {
      consumeActionPoints: applyActionPointConsumption,
    });
  }
}
