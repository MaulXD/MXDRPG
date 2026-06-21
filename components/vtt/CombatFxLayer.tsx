"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/grid-math";
import { axialToPixel, cellCorners, cellDrawRadius } from "@/lib/vtt/grid-math";
import { canvasCenter, worldToScreen, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import type {
  CombatFxPhase,
  CombatFxState,
  CombatFxTargetBurst,
} from "@/lib/vtt/combat-fx-types";
import { DiceCombatPanel } from "@/components/vtt/DiceCombatPanel";
import type { BattleToken } from "@/lib/vtt/types";
import {
  combatFxToDiceSequence,
  COMBAT_ATTACK_MIN_SPIN_MS,
  COMBAT_ATTACK_MIN_SPIN_MS_REDUCED,
  resolveCombatDiceTimings,
} from "@/lib/vtt/combat-dice-model";
import { isPendingCombatFx } from "@/lib/vtt/combat-fx-sequence";
import {
  COMBAT_FX_TIMINGS,
  COMBAT_FX_TIMINGS_REDUCED,
} from "@/lib/vtt/combat-fx-timings";
import { splitCombatChatDetail } from "@/lib/combat/chat-display";
import type { TokenCastFxKind } from "@/lib/vtt/token-cast-fx";

export type { CombatFxState, CombatFxTargetBurst } from "@/lib/vtt/combat-fx-types";

export type TokenCombatFlash = "hit" | "miss" | "crit" | "heal" | null;

type Props = {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  cellSize: number;
  gridOx?: number;
  gridOy?: number;
  fx: CombatFxState | null;
  tokens?: BattleToken[];
  onDone: () => void;
  onApplyState?: () => void;
  onTokenFlash?: (tokenId: string | null, flash: TokenCombatFlash) => void;
  onTokenCastFx?: (tokenId: string, kind: TokenCastFxKind) => void;
  onChatReveal?: (messageIds: string[], phase: "roll" | "damage" | "done") => void;
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

function cellPathPoints(
  axial: Axial,
  cellSize: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
  view: BattlefieldView
): string {
  const local = axialToPixel(axial.q, axial.r, cellSize, ox, oy);
  const screen = worldToScreen(local.x, local.y, w, h, view);
  const r = cellDrawRadius(cellSize) * (view.scale ?? 1);
  const corners = cellCorners(screen.x, screen.y, r);
  return corners.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
}

function resultLabelFor(fx: CombatFxState): string {
  if (fx.isHeal) return "CURA";
  if (fx.saveTotal != null) {
    if (fx.saveDc == null || fx.saveSuccess === undefined) return String(fx.saveTotal);
    return fx.saveSuccess ? "TESTE OK" : "TESTE FALHOU";
  }
  if (fx.criticalFail) return "FALHA CRÍTICA";
  if (fx.hit) return fx.critical ? "CRÍTICO!" : "ACERTO";
  return "ERROU";
}

function isPureHealCast(fx: CombatFxState): boolean {
  return Boolean(fx.isHeal && fx.attackTotal === 0 && fx.attackNatural === 20);
}

function isHealCastWithoutRoll(fx: CombatFxState): boolean {
  if (!fx.isHeal) return false;
  if (isPureHealCast(fx)) return true;
  return fx.attackNatural == null && fx.attackTotal == null && fx.saveTotal == null;
}

function flashForTarget(t: CombatFxTargetBurst): TokenCombatFlash {
  if (t.isHeal) return "heal";
  if (t.critical) return "crit";
  if (t.hit === false && t.saveTotal == null) return "miss";
  if (t.hit || t.saveTotal != null) return "hit";
  return "miss";
}

function tokenFlashForFx(fx: CombatFxState): TokenCombatFlash {
  if (fx.isHeal) return "heal";
  if (fx.critical) return "crit";
  if (fx.hit === false && fx.saveTotal == null) return "miss";
  if (fx.hit || fx.saveTotal != null) return "hit";
  return "miss";
}

function fxResultKnown(fx: CombatFxState | null | undefined): boolean {
  return Boolean(
    fx &&
      (fx.hit === true ||
        fx.hit === false ||
        fx.attackNatural != null ||
        fx.saveTotal != null ||
        fx.criticalFail)
  );
}

function fxHasDamage(fx: CombatFxState | null | undefined): boolean {
  return Boolean(
    fx &&
      fx.damageTotal != null &&
      fx.damageTotal > 0 &&
      (fx.isHeal || fx.hit !== false || fx.saveTotal != null)
  );
}

// ─── Animações de projétil SVG ────────────────────────────────────

type ScreenPt = { x: number; y: number };

type ProjectileProps = {
  from: ScreenPt;
  to: ScreenPt;
  kind: TokenCastFxKind | null | undefined;
  phase: CombatFxPhase;
  hit: boolean | undefined;
  isHeal: boolean | undefined;
  actionKind: CombatFxState["actionKind"];
};

function ProjectileAnim({ from, to, kind, phase, hit, isHeal, actionKind }: ProjectileProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 20) return null;
  if (phase !== "mark" && phase !== "roll") return null;

  const animClass = phase === "mark" ? "proj-anim--entering" : "proj-anim--traveling";

  if (kind === "arrow") {
    const ux = dx / dist;
    const uy = dy / dist;
    const arrowLen = 28;
    const ax1 = to.x - ux * arrowLen;
    const ay1 = to.y - uy * arrowLen;
    const perpX = -uy * 6;
    const perpY = ux * 6;

    const missOffX = hit === false ? perpX * 4 + ux * 20 : 0;
    const missOffY = hit === false ? perpY * 4 + uy * 20 : 0;
    const finalX = to.x + missOffX;
    const finalY = to.y + missOffY;

    const pathD = `M${from.x},${from.y} Q${(from.x + finalX) / 2 - perpX * 2},${(from.y + finalY) / 2 - perpY * 2} ${finalX},${finalY}`;
    const totalLen = dist * 1.1;

    return (
      <g className={`proj-anim proj-anim--arrow ${animClass}`}>
        <path
          d={pathD}
          fill="none"
          stroke="rgba(220,190,130,0.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="proj-arrow-path"
          style={{ "--proj-len": `${totalLen}px` } as React.CSSProperties}
        />
        <polygon
          points={`${finalX},${finalY} ${ax1 + perpX},${ay1 + perpY} ${ax1 - perpX},${ay1 - perpY}`}
          fill="rgba(220,190,130,0.9)"
          className="proj-arrow-head"
        />
        {hit === false ? (
          <text x={finalX} y={finalY - 14} className="proj-miss-text">ERROU!</text>
        ) : null}
      </g>
    );
  }

  if (kind === "lightning") {
    const segs = 8;
    const points: string[] = [];
    const ux = dx / dist;
    const uy = dy / dist;
    const perpX = -uy;
    const perpY = ux;

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const bx = from.x + dx * t;
      const by = from.y + dy * t;
      const jitter = i === 0 || i === segs ? 0 : (Math.sin(i * 2.3) * 18 + Math.cos(i * 5.1) * 10);
      points.push(`${bx + perpX * jitter},${by + perpY * jitter}`);
    }

    return (
      <g className={`proj-anim proj-anim--lightning ${animClass}`}>
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="rgba(130,180,255,0.35)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="proj-lightning-glow"
        />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="rgba(200,230,255,0.95)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="proj-lightning-core"
        />
        {hit === false ? (
          <text x={to.x} y={to.y - 16} className="proj-miss-text">ERROU!</text>
        ) : null}
      </g>
    );
  }

  if (kind === "fire" || kind === "heal" || (actionKind === "spell" && kind !== "slash")) {
    const color =
      isHeal
        ? "rgba(80,220,140,0.9)"
        : kind === "fire"
          ? "rgba(255,100,30,0.9)"
          : "rgba(140,160,255,0.9)";
    const glowColor =
      isHeal
        ? "rgba(40,180,90,0.4)"
        : kind === "fire"
          ? "rgba(255,60,0,0.35)"
          : "rgba(100,120,255,0.3)";

    const missOffset = hit === false ? 0.35 : 0;
    const endX = to.x + dx * missOffset;
    const endY = to.y + dy * missOffset;

    return (
      <g className={`proj-anim proj-anim--orb ${animClass}`}>
        <circle cx={from.x} cy={from.y} r="16" fill={glowColor} className="proj-orb-glow" />
        <circle cx={from.x} cy={from.y} r="7" fill={color} className="proj-orb-core" />
        <line
          x1={from.x} y1={from.y}
          x2={endX} y2={endY}
          stroke={glowColor}
          strokeWidth="8"
          strokeLinecap="round"
          className="proj-orb-trail"
        />
        {hit === false ? (
          <text x={endX} y={endY - 14} className="proj-miss-text">ERROU!</text>
        ) : null}
      </g>
    );
  }

  if (kind === "slash" && phase === "roll") {
    const r = 28;
    return (
      <g className="proj-anim proj-anim--slash proj-anim--traveling">
        <line
          x1={to.x - r} y1={to.y - r}
          x2={to.x + r} y2={to.y + r}
          stroke="rgba(255,248,240,0.9)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="proj-slash-line"
        />
        <line
          x1={to.x + r * 0.4} y1={to.y - r}
          x2={to.x - r * 0.4} y2={to.y + r}
          stroke="rgba(220,60,50,0.7)"
          strokeWidth="2"
          strokeLinecap="round"
          className="proj-slash-line-2"
        />
        {hit === false ? (
          <text x={to.x} y={to.y - 18} className="proj-miss-text">ERROU!</text>
        ) : null}
      </g>
    );
  }

  return null;
}

// ─── AoE Explosion ───────────────────────────────────────────────

function AoeExplosion({
  center,
  phase,
  kind,
}: {
  center: ScreenPt;
  phase: CombatFxPhase;
  kind: TokenCastFxKind | null | undefined;
}) {
  if (phase !== "result" && phase !== "damage") return null;

  const color =
    kind === "fire"
      ? "rgba(255,100,30,"
      : kind === "lightning"
        ? "rgba(160,200,255,"
        : kind === "heal"
          ? "rgba(80,220,140,"
          : "rgba(140,160,255,";

  return (
    <g className="proj-aoe-explosion">
      <circle
        cx={center.x} cy={center.y} r="8"
        fill={`${color}0.25)`}
        stroke={`${color}0.7)`}
        strokeWidth="2"
        className="proj-aoe-ring proj-aoe-ring--1"
      />
      <circle
        cx={center.x} cy={center.y} r="8"
        fill="none"
        stroke={`${color}0.45)`}
        strokeWidth="1.5"
        className="proj-aoe-ring proj-aoe-ring--2"
      />
    </g>
  );
}

// ─── Componente principal ─────────────────────────────────────────

export function CombatFxLayer({
  wrapRef,
  cellSize,
  gridOx,
  gridOy,
  fx,
  tokens = [],
  onDone,
  onApplyState,
  onTokenFlash,
  onTokenCastFx,
  onChatReveal,
  view = { scale: 1, panX: 0, panY: 0 },
}: Props) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<CombatFxPhase>("mark");
  const [panelVisible, setPanelVisible] = useState(true);
  const [showDamageRoll, setShowDamageRoll] = useState(false);
  const [attackRolling, setAttackRolling] = useState(true);
  const [damageDieRolling, setDamageDieRolling] = useState(true);
  const [showDamage, setShowDamage] = useState(false);
  const [diceEvicting, setDiceEvicting] = useState(false);

  const fxRef = useRef(fx);
  const onDoneRef = useRef(onDone);
  const onApplyStateRef = useRef(onApplyState);
  const onTokenFlashRef = useRef(onTokenFlash);
  const onTokenCastFxRef = useRef(onTokenCastFx);
  const onChatRevealRef = useRef(onChatReveal);
  const castFxTriggeredRef = useRef(false);
  const applyStateCalledRef = useRef(false);
  const seqStartedAtRef = useRef(0);
  const resultPhaseDoneRef = useRef(false);
  const triggerResultPhaseRef = useRef<(() => void) | null>(null);

  fxRef.current = fx;
  onDoneRef.current = onDone;
  onApplyStateRef.current = onApplyState;
  onTokenFlashRef.current = onTokenFlash;
  onTokenCastFxRef.current = onTokenCastFx;
  onChatRevealRef.current = onChatReveal;

  const timings = useMemo(
    () => (reducedMotion ? COMBAT_FX_TIMINGS_REDUCED : COMBAT_FX_TIMINGS),
    [reducedMotion]
  );

  const diceSequence = useMemo(
    () => (fx ? combatFxToDiceSequence(fx, tokens, reducedMotion) : null),
    [fx, tokens, reducedMotion]
  );

  const diceEvictMs = useMemo(
    () => resolveCombatDiceTimings(reducedMotion).evictMs,
    [reducedMotion]
  );

  const fxId = fx?.id ?? null;

  const revealChat = (p: "roll" | "damage" | "done") => {
    const ids = fxRef.current?.chatMessageIds;
    if (!ids?.length) return;
    onChatRevealRef.current?.(ids, p);
  };

  useEffect(() => {
    const data = fxRef.current;
    if (!fxId || !data) return;

    resultPhaseDoneRef.current = false;
    triggerResultPhaseRef.current = null;
    seqStartedAtRef.current = Date.now();

    setPhase("mark");
    setPanelVisible(true);
    setShowDamage(false);
    setShowDamageRoll(false);
    setAttackRolling(true);
    setDamageDieRolling(true);
    setDiceEvicting(false);
    castFxTriggeredRef.current = false;
    applyStateCalledRef.current = false;
    onTokenFlashRef.current?.(null, null);

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const applyStateNow = () => {
      if (applyStateCalledRef.current) return;
      applyStateCalledRef.current = true;
      onApplyStateRef.current?.();
    };

    const playTokenFx = () => {
      if (data.defenderTokenId) {
        onTokenFlashRef.current?.(data.defenderTokenId, tokenFlashForFx(data));
      }
      if (!castFxTriggeredRef.current && data.castFxKind && data.castFxTargetId) {
        const shouldPlay =
          data.castFxKind === "slash" || data.castFxKind === "arrow"
            ? Boolean(data.hit)
            : data.castFxKind === "buff"
              ? true
              : data.castFxKind === "heal"
                ? data.isHeal || (data.damageTotal != null && data.damageTotal > 0)
                : data.castFxKind === "fire" || data.castFxKind === "lightning"
                  ? data.hit !== false || data.saveTotal != null
                  : false;
        if (shouldPlay) {
          castFxTriggeredRef.current = true;
          onTokenCastFxRef.current?.(data.castFxTargetId, data.castFxKind);
        }
      }
    };

    const hasDamage =
      data.damageTotal != null &&
      data.damageTotal > 0 &&
      (data.isHeal || data.hit !== false || data.saveTotal != null);

    // ── area-intro: rápido, sem dado ──
    if (data.mode === "area-intro") {
      timeouts.push(setTimeout(() => setPhase("mark"), 0));
      timeouts.push(
        setTimeout(() => {
          setPhase("done");
          onDoneRef.current();
        }, timings.mark + timings.areaSimulResult)
      );
      return () => { for (const id of timeouts) clearTimeout(id); };
    }

    // ── area-simultaneous: burst em todos os alvos ──
    if (data.mode === "area-simultaneous") {
      const targets = data.areaTargets ?? [];
      timeouts.push(setTimeout(() => {
        revealChat("roll");
        setPhase("roll");
      }, timings.mark));
      timeouts.push(
        setTimeout(() => {
          setPhase("result");
        }, timings.mark + timings.attackRoll)
      );
      timeouts.push(
        setTimeout(() => {
          applyStateNow();
          revealChat("damage");
          for (const t of targets) {
            onTokenFlashRef.current?.(t.tokenId, flashForTarget(t));
            if (data.castFxKind) onTokenCastFxRef.current?.(t.tokenId, data.castFxKind);
          }
          setShowDamage(true);
          setPhase("damage");
        }, timings.mark + timings.attackRoll + timings.damageRoll)
      );
      timeouts.push(
        setTimeout(() => {
          revealChat("done");
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, timings.mark + timings.areaSimulResult + timings.areaSimulCleanup)
      );
      return () => { for (const id of timeouts) clearTimeout(id); };
    }

    // ── single / area-target ──
    // ~1s D20 → (se acertou) +0,8s dano → expulsão + token + chat
    const startMarkMs = data.mode === "area-target" ? timings.areaTargetMark : 0;
    const tRollStart = timings.mark;
    const tAttackEnd = tRollStart + timings.attackRoll;
    const tResolveHit = tAttackEnd + timings.damageRoll;
    const tResolveMiss = tAttackEnd + timings.missHold;

    const healWithoutRoll = isHealCastWithoutRoll(data);

    if (healWithoutRoll) {
      timeouts.push(
        setTimeout(() => {
          revealChat("roll");
          setPhase("result");
          applyStateNow();
          playTokenFx();
          revealChat("damage");
          if (hasDamage) setShowDamage(true);
          setPhase("damage");
        }, startMarkMs)
      );
      timeouts.push(
        setTimeout(() => {
          setPanelVisible(false);
        }, startMarkMs + timings.healHold)
      );
      timeouts.push(
        setTimeout(() => {
          revealChat("done");
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, startMarkMs + timings.healHold + timings.afterResolve)
      );
      return () => { for (const id of timeouts) clearTimeout(id); };
    }

    const finishResolve = () => {
      setDiceEvicting(true);
      applyStateNow();
      playTokenFx();
      if (fxHasDamage(fxRef.current)) revealChat("damage");
      timeouts.push(
        setTimeout(() => {
          setDiceEvicting(false);
          setPanelVisible(false);
          setShowDamageRoll(false);
        }, diceEvictMs)
      );
    };

    timeouts.push(setTimeout(() => {
      revealChat("roll");
      setPhase("roll");
      setAttackRolling(true);
    }, tRollStart + startMarkMs));

    const scheduleAfterResult = (hd: boolean) => {
      if (hd) {
        timeouts.push(setTimeout(() => {
          setDamageDieRolling(false);
        }, timings.damageLandAt));

        timeouts.push(setTimeout(() => {
          finishResolve();
          setPhase("damage");
        }, timings.damageRoll));

        timeouts.push(setTimeout(() => {
          revealChat("done");
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, timings.damageRoll + timings.afterResolve));
      } else {
        timeouts.push(setTimeout(() => {
          finishResolve();
        }, timings.missHold));

        timeouts.push(setTimeout(() => {
          revealChat("done");
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, timings.missHold + timings.afterResolve));
      }
    };

    const triggerResultPhase = () => {
      if (resultPhaseDoneRef.current) return;
      resultPhaseDoneRef.current = true;
      setPhase("result");
      setAttackRolling(false);

      const tryResult = (attempt = 0) => {
        const live = fxRef.current;
        if (!live) return;
        if (!fxResultKnown(live) && isPendingCombatFx(live) && attempt < 24) {
          timeouts.push(setTimeout(() => tryResult(attempt + 1), 50));
          return;
        }
        const hd = fxHasDamage(live);
        if (hd) {
          setShowDamageRoll(true);
          setDamageDieRolling(true);
        }
        scheduleAfterResult(hd);
      };
      tryResult();
    };

    triggerResultPhaseRef.current = triggerResultPhase;

    timeouts.push(setTimeout(() => {
      triggerResultPhase();
    }, tAttackEnd + startMarkMs));

    return () => {
      triggerResultPhaseRef.current = null;
      for (const id of timeouts) clearTimeout(id);
    };
  }, [fxId, reducedMotion, timings, diceEvictMs]);

  const minSpinMs = reducedMotion ? COMBAT_ATTACK_MIN_SPIN_MS_REDUCED : COMBAT_ATTACK_MIN_SPIN_MS;

  useEffect(() => {
    if (!fx || phase === "done" || phase === "result" || phase === "damage") return;
    if (!fxResultKnown(fx)) return;
    if (resultPhaseDoneRef.current) return;

    const elapsed = Date.now() - seqStartedAtRef.current;
    const delay = Math.max(0, minSpinMs - elapsed);
    const id = setTimeout(() => triggerResultPhaseRef.current?.(), delay);
    return () => clearTimeout(id);
  }, [
    fx?.attackNatural,
    fx?.hit,
    fx?.saveTotal,
    fx?.criticalFail,
    fx?.damageTotal,
    fxId,
    minSpinMs,
    phase,
  ]);

  if (!fx || phase === "done") return null;

  const wrap = wrapRef.current;
  const w = wrap?.clientWidth ?? 800;
  const h = wrap?.clientHeight ?? 640;
  const center = canvasCenter(w, h);
  const ox = gridOx ?? center.ox;
  const oy = gridOy ?? center.oy;

  const markScreen = (axial: Axial) => {
    const local = axialToPixel(axial.q, axial.r, cellSize, ox, oy);
    return worldToScreen(local.x, local.y, w, h, view);
  };

  const to = markScreen(fx.markAxial);
  const panelAt = markScreen(fx.defenderAxial);
  const fromPt = fx.attackerAxial ? markScreen(fx.attackerAxial) : null;

  const accent =
    fx.castFxKind === "heal"
      ? "rgba(100, 220, 140, 0.95)"
      : fx.castFxKind === "fire"
        ? "rgba(255, 120, 40, 0.95)"
        : fx.castFxKind === "lightning"
          ? "rgba(160, 200, 255, 0.95)"
          : fx.actionKind === "spell"
            ? "rgba(120,180,255,0.95)"
            : fx.critical
              ? "rgba(232,160,32,0.95)"
              : "rgba(200,80,60,0.95)";

  const areaFill = accent.replace(/[\d.]+\)$/, "0.2)");

  const resultLabel = resultLabelFor(fx);
  const healCastWithoutRoll = isHealCastWithoutRoll(fx);

  const showDicePanel =
    !healCastWithoutRoll && (fx.mode === "single" || fx.mode === "area-target");

  const showAttackPanel =
    showDicePanel &&
    panelVisible &&
    (phase === "roll" || phase === "result" || phase === "damage");

  const showResultText =
    showDicePanel && panelVisible && (phase === "result" || phase === "damage");

  const showRoll = showDicePanel && attackRolling;

  const detailParts = fx.resolveDetail
    ? splitCombatChatDetail(fx.resolveDetail, fx.saveTotal != null ? "save" : "attack")
    : { roll: "", damage: null };

  const showRollDetail =
    showDicePanel &&
    phase === "result" &&
    Boolean(detailParts.roll) &&
    !healCastWithoutRoll &&
    (fx.hit === true || fx.hit === false || fx.saveTotal != null);

  const areaGridPaths =
    fx.areaCells?.map((cell) => cellPathPoints(cell, cellSize, ox, oy, w, h, view)) ?? [];

  const showProjectile =
    fromPt != null &&
    fx.mode === "single" &&
    !healCastWithoutRoll &&
    (phase === "mark" || phase === "roll");

  const showAoeExplosion =
    fx.mode === "area-intro" &&
    (phase === "result" || phase === "damage");

  // Resultado da área sem dado
  const showAreaIntroPanel =
    fx.mode === "area-intro" &&
    (phase === "mark" || phase === "roll" || phase === "result");

  // Cura sem rolagem
  const showHealPanel =
    healCastWithoutRoll && panelVisible && (phase === "result" || phase === "damage");

  const resultTone =
    fx.isHeal
      ? "heal"
      : fx.saveSuccess !== false && (fx.hit || fx.saveTotal != null)
        ? "hit"
        : "miss";

  return (
    <div
      className={`combat-fx-layer ${reducedMotion ? "combat-fx-reduced" : ""}`}
      aria-live="polite"
    >

      {/* SVG: hex cells + projéteis */}
      <svg className="combat-fx-cell-svg" width={w} height={h}>
        {areaGridPaths.map((d, i) => (
          <path
            key={`area-${i}`}
            d={d}
            className="combat-fx-area-cell"
            fill={areaFill}
            stroke={accent}
            strokeWidth={fx.mode === "area-intro" ? 2.5 : 1.5}
          />
        ))}
        <path
          d={cellPathPoints(fx.markAxial, cellSize, ox, oy, w, h, view)}
          className={`combat-fx-mark-cell${phase === "damage" ? " combat-fx-mark-cell--pulse" : ""}`}
          fill="none"
          stroke={accent}
          strokeWidth={3}
        />
        {fx.mode === "area-simultaneous" &&
          fx.areaTargets?.map((t) => (
            <path
              key={t.tokenId}
              d={cellPathPoints(t.axial, cellSize, ox, oy, w, h, view)}
              className="combat-fx-mark-cell combat-fx-mark-cell--target"
              fill="none"
              stroke={accent}
              strokeWidth={2}
            />
          ))}

        {showProjectile && fromPt ? (
          <ProjectileAnim
            from={fromPt}
            to={to}
            kind={fx.castFxKind}
            phase={phase}
            hit={fx.hit}
            isHeal={fx.isHeal}
            actionKind={fx.actionKind}
          />
        ) : null}

        {showAoeExplosion ? (
          <AoeExplosion center={to} phase={phase} kind={fx.castFxKind} />
        ) : null}
      </svg>

      {/* Painel de ataque — D20 + (se acertou) dado de dano ao lado */}
      {showAttackPanel ? (
        <div
          className={`combat-fx-panel${showResultText ? " combat-fx-panel--revealed" : ""}${showDamageRoll ? " combat-fx-panel--dual-dice" : ""}`}
          style={{ left: panelAt.x, top: panelAt.y }}
        >
          <div className="combat-fx-panel-inner">
            <div className="combat-fx-dice-row">
              <DiceCombatPanel
                key={fx.id}
                sequence={diceSequence!}
                ui={{
                  attackRolling: showRoll,
                  attackLocked: !showRoll,
                  showDamage: showDamageRoll,
                  damageRolling: damageDieRolling,
                  evicting: diceEvicting,
                }}
                reducedMotion={reducedMotion}
              />
            </div>
            {showResultText ? (
              <div className="combat-fx-panel-result">
                <p className={`combat-fx-result ${resultTone}`}>{resultLabel}</p>
                {showDamageRoll && !damageDieRolling && fx.damageTotal != null ? (
                  <p className={`combat-fx-panel-damage${fx.critical ? " combat-fx-panel-damage--crit" : ""}${fx.isHeal ? " combat-fx-panel-damage--heal" : ""}`}>
                    {fx.isHeal ? `+${fx.damageTotal}` : `−${fx.damageTotal}`}
                    {fx.damageTypeLabel ? (
                      <span className="combat-fx-panel-damage__type"> {fx.damageTypeLabel}</span>
                    ) : null}
                  </p>
                ) : null}
                {fx.saveTotal != null || fx.attackTotal != null || fx.defenderAc != null ? (
                  <p className="combat-fx-panel-vs">
                    {fx.saveTotal != null
                      ? `${fx.saveTotal} vs CD ${fx.saveDc ?? "—"}`
                      : `${fx.attackTotal ?? "—"} vs CA ${fx.defenderAc ?? "—"}`}
                  </p>
                ) : null}
                {fx.spellDamageType ? (
                  <p className="combat-fx-panel-dmg-type">{fx.spellDamageType}</p>
                ) : null}
                {showRollDetail ? (
                  <p className="combat-fx-panel-detail">{detailParts.roll}</p>
                ) : null}
              </div>
            ) : (
              <p className="combat-fx-rolling">
                {showDamageRoll && damageDieRolling
                  ? "Rolando dano…"
                  : showRoll
                    ? "Rolando ataque…"
                    : "Aguardando…"}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Painel de cura (sem rolagem de ataque) */}
      {showHealPanel ? (
        <div
          className="combat-fx-panel combat-fx-panel--revealed"
          style={{ left: panelAt.x, top: panelAt.y }}
        >
          <div className="combat-fx-panel-inner">
            <div className="combat-fx-panel-result">
              <p className="combat-fx-result heal">{resultLabel}</p>
              {fx.damageTotal != null && fx.damageTotal > 0 ? (
                <p className="combat-fx-panel-damage combat-fx-panel-damage--heal">
                  +{fx.damageTotal}
                  <span className="combat-fx-panel-damage__type">Cura</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Painel de área (area-intro) */}
      {showAreaIntroPanel ? (
        <div
          className="combat-fx-panel combat-fx-panel--revealed combat-fx-panel--area"
          style={{ left: panelAt.x, top: panelAt.y }}
        >
          <div className="combat-fx-panel-inner">
            <div className="combat-fx-panel-area">
              <p className="combat-fx-area-title">{fx.spellName ?? "Magia de área"}</p>
              <p className="combat-fx-area-damage-label">{fx.damageTypeLabel ?? "Dano"}</p>
              {fx.spellDamageType ? (
                <p className="combat-fx-area-damage-type">{fx.spellDamageType}</p>
              ) : null}
              {fx.resolveDetail ? (
                <p className="combat-fx-area-detail">{fx.resolveDetail}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {fx.mode === "area-simultaneous" && showDamage
        ? fx.areaTargets?.map((t) => {
            if (t.damageTotal == null || t.damageTotal <= 0) return null;
            const pos = markScreen(t.axial);
            const heal = t.isHeal ?? fx.isHeal;
            return (
              <div
                key={t.tokenId}
                className={`combat-fx-damage combat-fx-damage--cell ${t.critical ? "crit" : ""}${heal ? " heal" : ""}`}
                style={{ left: pos.x, top: pos.y }}
              >
                <span className="combat-fx-damage-label">{heal ? "Cura" : fx.damageTypeLabel ?? "Dano"}</span>
                <span className="combat-fx-damage-value">{heal ? `+${t.damageTotal}` : `−${t.damageTotal}`}</span>
              </div>
            );
          })
        : null}

    </div>
  );
}
