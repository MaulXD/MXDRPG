"use client";



import { useMemo, useState } from "react";

import type { BattleToken } from "@/lib/vtt/types";

import type { RoomActor } from "@/lib/room/types";

import type { CombatTrack } from "@/lib/room/combat";

import {

  listTokenCombatActions,

  resolveCombatAction,

  canAttackTarget,

  warriorAttackCount,

} from "@/lib/combat/attack";

import { canAbilityTarget, canUseAbility } from "@/lib/combat/ability";

import type { CombatActionOption } from "@/lib/combat/types";
import { areaNeedsDirection } from "@/lib/combat/area-spell";

import {

  describeMovementPaBands,

  formatMovementLabel,

  hexToMeters,

  movementPaBandsForToken,

  movementSpent,

  movementWalkMax,

  walkRemaining,

  runRemaining,

} from "@/lib/vtt/movement";

import {

  ACTION_MODE_LABEL,

  type TokenActionMode,

  isMoveMode,

  isTargetMode,

} from "@/lib/vtt/action-mode";

import { listSubclassCombatActions } from "@/lib/character/subclass-vtt";
import { patchRoomActor, postRoomAttack, postRoomAbility } from "@/hooks/useRoomSync";
import { SpellChannelControl } from "@/components/vtt/SpellChannelControl";

import { useCombatTurn } from "@/hooks/useCombatActions";

import type { ChatMessage } from "@/lib/room/chat";

import { axialDistance } from "@/lib/vtt/hex-math";



type Props = {

  roomId: string;

  token: BattleToken;

  tokens: BattleToken[];

  actor: RoomActor | null;

  combat: CombatTrack | null | undefined;

  canBypassTurn: boolean;

  actionMode: TokenActionMode;

  onActionModeChange: (mode: TokenActionMode) => void;

  selectedAction: CombatActionOption | null;

  onSelectedActionChange: (action: CombatActionOption | null) => void;

  channelExtraPa?: number;

  onChannelExtraPaChange?: (extra: number) => void;

  onAttackResult: (msg: ChatMessage) => void;

  onRoomSync: (snap?: import("@/lib/room/types").RoomSnapshot) => void;

};



export function TokenActionPanel({

  roomId,

  token,

  tokens,

  actor,

  combat,

  canBypassTurn,

  actionMode,

  onActionModeChange,

  selectedAction,

  onSelectedActionChange,

  channelExtraPa = 0,

  onChannelExtraPaChange,

  onAttackResult,

  onRoomSync,

}: Props) {

  const [busy, setBusy] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  const turn = useCombatTurn({ combat, canBypassTurn });



  const weapons = useMemo(

    () => listTokenCombatActions(token, actor, "weapon"),

    [token, actor]

  );

  const spells = useMemo(

    () => listTokenCombatActions(token, actor, "spell"),

    [token, actor]

  );

  const abilities = useMemo(

    () => listTokenCombatActions(token, actor, "ability"),

    [token, actor]

  );

  const trackAbilities = useMemo(

    () => (actor ? listSubclassCombatActions(actor) : []),

    [actor]

  );



  const activeAction = useMemo(() => {

    if (selectedAction) return selectedAction;

    if (actor) return resolveCombatAction(actor);

    return weapons[0] ?? null;

  }, [selectedAction, actor, weapons]);



  const extraAttacks = useMemo(() => {

    if (!actor || !activeAction || activeAction.kind !== "weapon") return 0;

    return warriorAttackCount(actor, activeAction);

  }, [actor, activeAction]);



  const spent = movementSpent(token);

  const walkMax = movementWalkMax(token);

  const moveLabel = formatMovementLabel(spent, walkMax);
  const movePaHint = describeMovementPaBands(movementPaBandsForToken(token));



  const turnBlocked =

    turn.activeTokenId && turn.activeTokenId !== token.id && !turn.bypassTurn;



  const attackTargets = useMemo(() => {

    if (!activeAction || activeAction.selfTarget) return [];

    return tokens

      .filter((t) => t.id !== token.id)

      .map((t) => {

        const check =

          activeAction.kind === "ability"

            ? canAbilityTarget(token, t, activeAction, {

                activeTokenId: turn.activeTokenId,

                bypassTurn: turn.bypassTurn,

              }, actor)

            : canAttackTarget(token, t, activeAction, {

                activeTokenId: turn.activeTokenId,

                bypassTurn: turn.bypassTurn,

              }, { actor });

        return {

          token: t,

          dist: axialDistance(token.axial, t.axial),

          ...check,

        };

      })

      .filter((x) => x.dist <= activeAction.rangeHex);

  }, [token, tokens, activeAction, turn, actor]);



  const selfAbilityOk = useMemo(() => {

    if (!activeAction?.selfTarget) return false;

    return canUseAbility(token, activeAction, {

      activeTokenId: turn.activeTokenId,

      bypassTurn: turn.bypassTurn,

    }, actor).ok;

  }, [token, activeAction, turn, actor]);



  async function saveLoadout(packId: "armas" | "magias" | "habilidades", entryId: string) {

    if (!actor || !token.actorId) return;

    await patchRoomActor(roomId, token.actorId, { combatLoadout: { packId, entryId } });

    onRoomSync();

  }



  async function executeAttack(defenderId: string) {

    if (!activeAction || busy) return;

    setBusy(true);

    setErr(null);

    try {

      let snapshot: import("@/lib/room/types").RoomSnapshot;

      if (activeAction.kind === "ability") {

        snapshot = await postRoomAbility(roomId, token.id, defenderId, {

          actionEntryId: activeAction.entryId,

          bypassTurn: turn.bypassTurn,

        });

      } else {

        const packId =

          activeAction.packId === "armas" || activeAction.packId === "magias"

            ? activeAction.packId

            : undefined;

        snapshot = await postRoomAttack(roomId, token.id, defenderId, {

          actionPack: packId,

          actionEntryId: packId ? activeAction.entryId : undefined,

          bypassTurn: turn.bypassTurn,

          channelExtraPa: activeAction.channelMaxExtraPa ? channelExtraPa : undefined,

        });

      }

      const combatMsgs = snapshot.chat.filter((m) => m.kind === "combat");

      const last = combatMsgs[combatMsgs.length - 1];

      if (last?.kind === "combat") onAttackResult(last);

      onActionModeChange("idle");

      onRoomSync(snapshot);

    } catch (e) {

      setErr(e instanceof Error ? e.message : "Falha na ação");

    } finally {

      setBusy(false);

    }

  }



  async function executeSelfAbility() {

    if (!activeAction?.selfTarget || busy) return;

    setBusy(true);

    setErr(null);

    try {

      const snapshot = await postRoomAbility(roomId, token.id, null, {

        actionEntryId: activeAction.entryId,

        bypassTurn: turn.bypassTurn,

      });

      const combatMsgs = snapshot.chat.filter((m) => m.kind === "combat");

      const last = combatMsgs[combatMsgs.length - 1];

      if (last?.kind === "combat") onAttackResult(last);

      onActionModeChange("idle");

      onRoomSync(snapshot);

    } catch (e) {

      setErr(e instanceof Error ? e.message : "Falha na habilidade");

    } finally {

      setBusy(false);

    }

  }



  function onModePick(mode: TokenActionMode) {

    setErr(null);

    onActionModeChange(mode);

    if (mode === "attack" && weapons[0]) {

      onSelectedActionChange(weapons[0]);

      if (actor && weapons[0].packId !== "unarmed") {

        void saveLoadout(weapons[0].packId as "armas", weapons[0].entryId);

      }

    }

    if (mode === "spell" && spells[0]) {

      onSelectedActionChange(spells[0]);

      if (actor) void saveLoadout("magias", spells[0].entryId);

    }

    if (mode === "ability" && abilities[0]) {

      onSelectedActionChange(abilities[0]);

      if (actor) void saveLoadout("habilidades", abilities[0].entryId);

    }

    if (mode === "idle") onSelectedActionChange(null);

  }



  const isSaveSpell = activeAction?.resolution === "save";



  return (

    <div className="vtt-action-panel">

      <p className="vtt-eyebrow">Ações</p>



      {turnBlocked ? (

        <p className="vtt-combat-turn-hint">Aguarde seu turno na iniciativa.</p>

      ) : null}

      {trackAbilities.length > 0 ? (
        <p className="vtt-combat-hint">
          Trilha ({actor?.identity.subclasse}):{" "}
          {trackAbilities.map((a) => a.name).join(", ")} — modo Habilidade.
        </p>
      ) : actor?.identity.subclasse ? (
        <p className="vtt-combat-hint">
          Trilha {actor.identity.subclasse}: talentos aparecem ao subir nv 4+ na ficha.
        </p>
      ) : null}



      <p className="vtt-movement-budget">

        Movimento: {moveLabel}

        <span className="vtt-movement-sub">

          Caminhada {walkRemaining(token)} hex ({hexToMeters(walkRemaining(token))} m) · Corrida{" "}

          {runRemaining(token)} hex restantes · {movePaHint}

        </span>

      </p>



      {token.defesaBonus ? (

        <p className="vtt-combat-hint">

          {token.defesaBuffSource ?? "Buff"}: +{token.defesaBonus} defesa

        </p>

      ) : null}



      <label className="vtt-combat-select">

        O que fazer?

        <select

          value={actionMode}

          onChange={(e) => onModePick(e.target.value as TokenActionMode)}

          disabled={busy || Boolean(turnBlocked)}

        >

          {(Object.keys(ACTION_MODE_LABEL) as TokenActionMode[]).map((m) => (

            <option

              key={m}

              value={m}

              disabled={

                (m === "spell" && !spells.length) ||

                (m === "ability" && !abilities.length) ||

                (m === "attack" && !weapons.length)

              }

            >

              {ACTION_MODE_LABEL[m]}

              {m === "spell" && !spells.length ? " (sem magias)" : ""}

              {m === "ability" && !abilities.length ? " (sem habilidades)" : ""}

            </option>

          ))}

        </select>

      </label>



      {actionMode === "attack" && weapons.length > 1 ? (

        <label className="vtt-combat-select">

          Arma

          <select

            value={activeAction ? `${activeAction.packId}:${activeAction.entryId}` : ""}

            onChange={(e) => {

              const [packId, entryId] = e.target.value.split(":");

              const found = weapons.find((w) => w.packId === packId && w.entryId === entryId);

              if (found) {

                onSelectedActionChange(found);

                if (actor && packId === "armas") void saveLoadout("armas", entryId);

              }

            }}

          >

            {weapons.map((w) => (

              <option key={`${w.packId}:${w.entryId}`} value={`${w.packId}:${w.entryId}`}>

                {w.label}

                {actor && w.kind === "weapon" && warriorAttackCount(actor, w) > 1

                  ? ` · ${warriorAttackCount(actor, w)} ataques`

                  : ""}

              </option>

            ))}

          </select>

        </label>

      ) : null}



      {actionMode === "attack" && extraAttacks > 1 ? (

        <p className="vtt-combat-hint">Ataque Extra — {extraAttacks} rolagens (1 PA)</p>

      ) : null}



      {actionMode === "spell" && spells.length > 0 ? (

        <label className="vtt-combat-select">

          Magia

          <select

            value={activeAction ? `${activeAction.packId}:${activeAction.entryId}` : ""}

            onChange={(e) => {

              const [, entryId] = e.target.value.split(":");

              const found = spells.find((s) => s.entryId === entryId);

              if (found) {

                onSelectedActionChange(found);

                if (actor) void saveLoadout("magias", entryId);

              }

            }}

          >

            {spells.map((s) => (

              <option key={s.entryId} value={`${s.packId}:${s.entryId}`}>

                {s.label}

              </option>

            ))}

          </select>

        </label>

      ) : null}

      {actionMode === "spell" && activeAction?.channelMaxExtraPa && onChannelExtraPaChange ? (
        <SpellChannelControl
          action={activeAction}
          token={token}
          actor={actor}
          value={channelExtraPa}
          onChange={onChannelExtraPaChange}
        />
      ) : null}

      {actionMode === "ability" && abilities.length > 0 ? (

        <label className="vtt-combat-select">

          Habilidade

          <select

            value={activeAction ? `${activeAction.packId}:${activeAction.entryId}` : ""}

            onChange={(e) => {

              const [, entryId] = e.target.value.split(":");

              const found = abilities.find((a) => a.entryId === entryId);

              if (found) {

                onSelectedActionChange(found);

                if (actor) void saveLoadout("habilidades", entryId);

              }

            }}

          >

            {abilities.map((a) => (

              <option key={a.entryId} value={`${a.packId}:${a.entryId}`}>

                {a.label}

              </option>

            ))}

          </select>

        </label>

      ) : null}



      {isSaveSpell ? (
        <p className="vtt-combat-hint">Teste de resistência vs CD — metade do dano se passar.</p>
      ) : null}

      {actionMode === "spell" && activeAction?.areaShape && activeAction.areaShape !== "single" ? (
        <p className="vtt-combat-hint">
          Área {activeAction.areaShape}
          {activeAction.areaRadiusHex != null ? ` · ${activeAction.areaRadiusHex} hex` : ""}
          {activeAction.areaHexCount != null ? ` · ${activeAction.areaHexCount} hex` : ""} — alcance{" "}
          {activeAction.rangeHex} hex no mapa.
          {areaNeedsDirection(activeAction.areaShape)
            ? " 1º clique = centro · 2º = hex vizinho (direção)."
            : " Clique o centro da área."}
        </p>
      ) : null}



      {isMoveMode(actionMode) ? (

        <p className="vtt-combat-hint">

          Clique hex verde/ambar no mapa. Distância mostrada no hover.

        </p>

      ) : null}



      {isTargetMode(actionMode) && activeAction?.selfTarget ? (

        <button

          type="button"

          className="btn btn-ghost vtt-attack-btn"

          disabled={!selfAbilityOk || busy}

          onClick={executeSelfAbility}

        >

          ◆ Usar {activeAction.name}

        </button>

      ) : null}



      {isTargetMode(actionMode) && activeAction && !activeAction.selfTarget ? (

        <>

          <p className="vtt-combat-weapon">{activeAction.label}</p>

          <ul className="vtt-combat-targets">

            {attackTargets.map(({ token: t, ok, reason }) => (

              <li key={t.id}>

                <button

                  type="button"

                  className="btn btn-ghost vtt-attack-btn"

                  disabled={!ok || busy}

                  onClick={() => executeAttack(t.id)}

                >

                  {actionMode === "spell" ? "✦" : actionMode === "ability" ? "◆" : "⚔"} {t.name}

                  {t.defesa != null

                    ? ` (CA ${t.defesa}${t.defesaBonus ? `+${t.defesaBonus}` : ""})`

                    : ""}

                </button>

                {!ok && reason ? <small className="vtt-combat-reason">{reason}</small> : null}

              </li>

            ))}

          </ul>

          <p className="vtt-combat-click-hint">
            {activeAction.allyTarget
              ? "Ou clique no aliado destacado no mapa."
              : "Ou clique no inimigo destacado no mapa."}
          </p>

        </>

      ) : null}



      {err ? <p className="dice-err">{err}</p> : null}

    </div>

  );

}


