"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel } from "@/lib/vtt/hex-math";
import { canvasCenter, worldToScreen, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import type { ChatMessage } from "@/lib/room/chat";
import { DiceMiniature } from "@/components/vtt/DiceMiniature";
import {
  resolveCastFxFromCombat,
  type TokenCastFxKind,
} from "@/lib/vtt/token-cast-fx";

export type TokenCombatFlash = "hit" | "miss" | "crit" | null;

export type CombatFxState = {
  id: string;
  phase: "slash" | "roll" | "result" | "damage" | "done";
  attackerAxial: Axial;
  defenderAxial: Axial;
  defenderTokenId?: string;
  actionKind: "weapon" | "spell" | "unarmed" | "ability";
  attackNatural?: number;
  attackTotal?: number;
  defenderAc?: number;
  hit?: boolean;
  critical?: boolean;
  criticalFail?: boolean;
  saveTotal?: number;
  saveDc?: number;
  saveSuccess?: boolean;
  damageTotal: number | null;
  isHeal?: boolean;
  castFxKind?: TokenCastFxKind | null;
  castFxTargetId?: string | null;
};

type Props = {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  hexSize: number;
  fx: CombatFxState | null;
  onDone: () => void;
  onTokenFlash?: (tokenId: string | null, flash: TokenCombatFlash) => void;
  onTokenCastFx?: (tokenId: string, kind: TokenCastFxKind) => void;
  view?: BattlefieldView;
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function combatFxFromMessage(
  msg: ChatMessage,
  attackerAxial: Axial,
  defenderAxial: Axial
): CombatFxState | null {
  if (msg.kind !== "combat" || !msg.combat) return null;
  const c = msg.combat;
  const isHeal =
    c.actionKind === "ability" &&
    (c.weaponName.toLowerCase().includes("cura") || c.detail.toLowerCase().includes("cura"));
  const castResolved = resolveCastFxFromCombat(msg);
  const castFxKind = castResolved?.kind ?? null;
  if (c.resolution === "save") {
    return {
      id: msg.id,
      phase: "slash",
      attackerAxial,
      defenderAxial,
      defenderTokenId: c.defenderTokenId,
      actionKind: "spell",
      saveTotal: c.saveTotal,
      saveDc: c.saveDc,
      saveSuccess: c.saveSuccess,
      damageTotal: c.damageTotal,
      isHeal,
      castFxKind,
      castFxTargetId: castResolved?.tokenId ?? c.defenderTokenId,
    };
  }
  const actionKind: CombatFxState["actionKind"] =
    c.actionKind === "ability" ? "ability" : c.actionKind;
  return {
    id: msg.id,
    phase: "slash",
    attackerAxial,
    defenderAxial,
    defenderTokenId: c.defenderTokenId,
    actionKind,
    ...(c.attackNatural != null ? { attackNatural: c.attackNatural } : {}),
    ...(c.attackTotal != null ? { attackTotal: c.attackTotal } : {}),
    ...(c.defenderAc != null ? { defenderAc: c.defenderAc } : {}),
    ...(c.hit != null ? { hit: c.hit } : {}),
    ...(c.critical != null ? { critical: c.critical } : {}),
    ...(c.criticalFail != null ? { criticalFail: c.criticalFail } : {}),
    damageTotal: c.damageTotal,
    isHeal,
    castFxKind,
    castFxTargetId: castResolved?.tokenId ?? c.defenderTokenId,
  };
}

export function CombatFxLayer({
  wrapRef,
  hexSize,
  fx,
  onDone,
  onTokenFlash,
  onTokenCastFx,
  view = { scale: 1, panX: 0, panY: 0 },
}: Props) {
  const reducedMotion = useReducedMotion();
  const [displayRoll, setDisplayRoll] = useState(1);
  const [phase, setPhase] = useState<CombatFxState["phase"]>("slash");
  const [slashProgress, setSlashProgress] = useState(0);
  const fxRef = useRef(fx);
  const onDoneRef = useRef(onDone);
  const onTokenFlashRef = useRef(onTokenFlash);
  const onTokenCastFxRef = useRef(onTokenCastFx);
  const castFxTriggeredRef = useRef(false);
  fxRef.current = fx;
  onDoneRef.current = onDone;
  onTokenFlashRef.current = onTokenFlash;
  onTokenCastFxRef.current = onTokenCastFx;

  const timings = useMemo(
    () =>
      reducedMotion
        ? { slash: 80, roll: 200, resultDelay: 120, damageDelay: 280, doneHit: 900, doneMiss: 600 }
        : { slash: 420, roll: 900, resultDelay: 900, damageDelay: 700, doneHit: 4600, doneMiss: 2200 },
    [reducedMotion]
  );

  const fxId = fx?.id ?? null;

  useEffect(() => {
    const data = fxRef.current;
    if (!fxId || !data) return;

    setPhase("slash");
    setSlashProgress(reducedMotion ? 1 : 0);
    castFxTriggeredRef.current = false;
    onTokenFlashRef.current?.(null, null);
    let rollTick: ReturnType<typeof setInterval> | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const slashAnim = reducedMotion
      ? null
      : setInterval(() => {
          setSlashProgress((p) => Math.min(1, p + 0.12));
        }, 40);

    const t0 = setTimeout(() => {
      if (slashAnim) clearInterval(slashAnim);
      setSlashProgress(1);
      setPhase("roll");
      setDisplayRoll(Math.floor(Math.random() * 20) + 1);

      if (!reducedMotion) {
        rollTick = setInterval(() => {
          setDisplayRoll(Math.floor(Math.random() * 20) + 1);
        }, 70);
      }

      timeouts.push(
        setTimeout(() => {
          if (rollTick) clearInterval(rollTick);
          setDisplayRoll(data.attackNatural ?? data.saveTotal ?? 1);
          setPhase("result");
          if (data.defenderTokenId) {
            const flash: TokenCombatFlash = data.critical
              ? "crit"
              : data.hit === false && data.saveTotal == null
                ? "miss"
                : data.hit || data.saveTotal != null
                  ? "hit"
                  : "miss";
            onTokenFlashRef.current?.(data.defenderTokenId, flash);
          }
          if (
            !castFxTriggeredRef.current &&
            data.castFxKind &&
            data.castFxTargetId
          ) {
            const shouldPlay =
              data.castFxKind === "slash"
                ? Boolean(data.hit)
                : data.castFxKind === "buff"
                  ? true
                  : data.castFxKind === "heal"
                    ? data.isHeal || (data.damageTotal != null && data.damageTotal > 0)
                    : data.castFxKind === "fire"
                      ? data.hit !== false || data.saveTotal != null
                      : false;
            if (shouldPlay) {
              castFxTriggeredRef.current = true;
              onTokenCastFxRef.current?.(data.castFxTargetId, data.castFxKind);
            }
          }
        }, timings.roll)
      );

      timeouts.push(
        setTimeout(() => {
          const showDamage =
            data.damageTotal != null &&
            (data.isHeal || data.hit !== false || data.saveTotal != null);
          if (showDamage) setPhase("damage");
        }, timings.roll + timings.damageDelay)
      );

      timeouts.push(
        setTimeout(() => {
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, data.hit || data.isHeal ? timings.doneHit : timings.doneMiss)
      );
    }, timings.slash);
    timeouts.push(t0);

    return () => {
      if (slashAnim) clearInterval(slashAnim);
      if (rollTick) clearInterval(rollTick);
      for (const id of timeouts) clearTimeout(id);
    };
  }, [fxId, reducedMotion, timings]);

  if (!fx || phase === "done") return null;

  const wrap = wrapRef.current;
  const w = wrap?.clientWidth ?? 800;
  const h = wrap?.clientHeight ?? 640;
  const { ox, oy } = canvasCenter(w, h);

  const fromWorld = axialToPixel(fx.attackerAxial.q, fx.attackerAxial.r, hexSize, ox, oy);
  const toWorld = axialToPixel(fx.defenderAxial.q, fx.defenderAxial.r, hexSize, ox, oy);
  const from = worldToScreen(fromWorld.x, fromWorld.y, w, h, view);
  const to = worldToScreen(toWorld.x, toWorld.y, w, h, view);

  const resultLabel = fx.saveTotal != null
    ? fx.saveSuccess
      ? "TESTE OK"
      : "TESTE FALHOU"
    : fx.criticalFail
      ? "FALHA CRÍTICA"
      : fx.hit
        ? fx.critical
          ? "CRÍTICO!"
          : "ACERTO"
        : "ERROU";

  const slashColor =
    fx.castFxKind === "heal"
      ? "rgba(100, 220, 140, 0.9)"
      : fx.castFxKind === "fire"
        ? "rgba(255, 120, 40, 0.95)"
        : fx.castFxKind === "buff"
          ? "rgba(201, 169, 98, 0.9)"
          : fx.actionKind === "spell"
            ? "rgba(120,180,255,0.9)"
            : fx.actionKind === "ability"
              ? "rgba(184,255,60,0.85)"
              : fx.critical
                ? "rgba(232,160,32,0.95)"
                : "rgba(200,80,60,0.9)";

  const isChargeLike =
    fx.actionKind === "ability" && phase === "slash" && slashProgress > 0.2;

  return (
    <div className={`combat-fx-layer ${reducedMotion ? "combat-fx-reduced" : ""}`} aria-live="polite">
      {(phase === "slash" || phase === "roll" || phase === "result") && (
        <svg className="combat-fx-slash-svg" width={w} height={h}>
          <line
            x1={from.x}
            y1={from.y}
            x2={from.x + (to.x - from.x) * slashProgress}
            y2={from.y + (to.y - from.y) * slashProgress}
            stroke={slashColor}
            strokeWidth={fx.actionKind === "spell" ? 3 : isChargeLike ? 5 : 4}
            strokeLinecap="round"
            strokeDasharray={isChargeLike ? "8 6" : undefined}
            className="combat-fx-slash-line"
          />
          {phase === "slash" && slashProgress > 0.85 ? (
            <circle
              cx={to.x}
              cy={to.y}
              r={fx.critical ? 16 : 12}
              fill="none"
              stroke={slashColor}
              strokeWidth={2}
              className="combat-fx-impact"
            />
          ) : null}
        </svg>
      )}

      {(phase === "roll" || phase === "result") && (
        <div
          className="combat-fx-dice"
          style={{
            left: to.x,
            top: to.y,
          }}
        >
          <DiceMiniature
            formula="1d20"
            value={
              phase === "roll"
                ? null
                : (fx.attackNatural ?? fx.saveTotal ?? null)
            }
            rolling={phase === "roll"}
            size="lg"
          />
          {phase === "result" ? (
            <p
              className={`combat-fx-result ${
                fx.saveSuccess !== false && (fx.hit || fx.saveTotal != null) ? "hit" : "miss"
              }`}
            >
              {fx.saveTotal != null
                ? `${resultLabel} · ${fx.saveTotal} vs CD ${fx.saveDc}`
                : `${resultLabel} · ${fx.attackTotal} vs CA ${fx.defenderAc}`}
            </p>
          ) : (
            <p className="combat-fx-rolling">Rolando ataque…</p>
          )}
        </div>
      )}

      {phase === "damage" && fx.damageTotal != null ? (
        <div
          className={`combat-fx-damage ${fx.critical ? "crit" : ""} ${fx.isHeal ? "heal" : ""}`}
          style={{ left: to.x, top: to.y }}
        >
          {fx.isHeal ? `+${fx.damageTotal}` : `−${fx.damageTotal}`}
        </div>
      ) : null}

      {phase === "result" && fx.hit === false && !fx.criticalFail && fx.saveTotal == null ? (
        <div className="combat-fx-miss" style={{ left: to.x, top: to.y }}>
          Errou
        </div>
      ) : null}
    </div>
  );
}
