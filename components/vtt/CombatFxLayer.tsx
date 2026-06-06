"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexCorners, hexDrawRadius } from "@/lib/vtt/hex-math";
import { canvasCenter, worldToScreen, type BattlefieldView } from "@/lib/vtt/battlefield-view";
import type {
  CombatFxPhase,
  CombatFxState,
  CombatFxTargetBurst,
} from "@/lib/vtt/combat-fx-types";
import { DiceMiniature } from "@/components/vtt/DiceMiniature";
import type { TokenCastFxKind } from "@/lib/vtt/token-cast-fx";

export type { CombatFxState, CombatFxTargetBurst } from "@/lib/vtt/combat-fx-types";

export type TokenCombatFlash = "hit" | "miss" | "crit" | null;

type Props = {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  hexSize: number;
  fx: CombatFxState | null;
  onDone: () => void;
  onApplyState?: () => void;
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

function hexPathPoints(
  axial: Axial,
  hexSize: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
  view: BattlefieldView
): string {
  const world = axialToPixel(axial.q, axial.r, hexSize, ox, oy);
  const screen = worldToScreen(world.x, world.y, w, h, view);
  const r = hexDrawRadius(hexSize) * (view.scale ?? 1);
  const corners = hexCorners(screen.x, screen.y, r);
  return corners.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
}

function resultLabelFor(fx: CombatFxState): string {
  if (fx.saveTotal != null) {
    return fx.saveSuccess ? "TESTE OK" : "TESTE FALHOU";
  }
  if (fx.criticalFail) return "FALHA CRÍTICA";
  if (fx.hit) return fx.critical ? "CRÍTICO!" : "ACERTO";
  return "ERROU";
}

function flashForTarget(t: CombatFxTargetBurst): TokenCombatFlash {
  if (t.critical) return "crit";
  if (t.hit === false && t.saveTotal == null) return "miss";
  if (t.hit || t.saveTotal != null) return "hit";
  return "miss";
}

export function CombatFxLayer({
  wrapRef,
  hexSize,
  fx,
  onDone,
  onApplyState,
  onTokenFlash,
  onTokenCastFx,
  view = { scale: 1, panX: 0, panY: 0 },
}: Props) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<CombatFxPhase>("mark");
  const [showDamage, setShowDamage] = useState(false);
  const fxRef = useRef(fx);
  const onDoneRef = useRef(onDone);
  const onApplyStateRef = useRef(onApplyState);
  const onTokenFlashRef = useRef(onTokenFlash);
  const onTokenCastFxRef = useRef(onTokenCastFx);
  const castFxTriggeredRef = useRef(false);
  const applyStateCalledRef = useRef(false);
  fxRef.current = fx;
  onDoneRef.current = onDone;
  onApplyStateRef.current = onApplyState;
  onTokenFlashRef.current = onTokenFlash;
  onTokenCastFxRef.current = onTokenCastFx;

  const timings = useMemo(() => {
    const mode = fx?.mode ?? "single";
    if (reducedMotion) {
      return {
        mark: 120,
        roll: mode === "area-target" ? 160 : 200,
        applyStateDelay: 350,
        resultHold: mode === "area-intro" ? 700 : mode === "area-target" ? 900 : 1200,
        damageFade: 600,
        simulFlash: 500,
      };
    }
    return {
      mark: mode === "area-intro" ? 500 : 280,
      roll: mode === "area-target" ? 650 : 900,
      applyStateDelay: mode === "area-target" ? 700 : 1000,
      resultHold:
        mode === "area-intro"
          ? 1100
          : mode === "area-target"
            ? 1400
            : mode === "area-simultaneous"
              ? 900
              : 6000,
      damageFade: mode === "area-target" ? 1600 : 2800,
      simulFlash: 450,
    };
  }, [fx?.mode, reducedMotion]);

  const fxId = fx?.id ?? null;

  useEffect(() => {
    const data = fxRef.current;
    if (!fxId || !data) return;

    setPhase(data.mode === "area-simultaneous" ? "mark" : "mark");
    setShowDamage(false);
    castFxTriggeredRef.current = false;
    applyStateCalledRef.current = false;
    onTokenFlashRef.current?.(null, null);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (data.mode === "area-intro") {
      timeouts.push(
        setTimeout(() => {
          setPhase("done");
          onDoneRef.current();
        }, timings.mark + timings.resultHold)
      );
      return () => {
        for (const id of timeouts) clearTimeout(id);
      };
    }

    if (data.mode === "area-simultaneous") {
      const targets = data.areaTargets ?? [];
      timeouts.push(
        setTimeout(() => {
          for (const t of targets) {
            onTokenFlashRef.current?.(t.tokenId, flashForTarget(t));
            if (data.castFxKind) {
              onTokenCastFxRef.current?.(t.tokenId, data.castFxKind);
            }
          }
          setShowDamage(true);
          setPhase("damage");
        }, timings.mark + timings.simulFlash)
      );
      timeouts.push(
        setTimeout(() => {
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, timings.mark + timings.simulFlash + timings.resultHold + timings.damageFade)
      );
      return () => {
        for (const id of timeouts) clearTimeout(id);
      };
    }

    const t0 = setTimeout(() => {
      if (data.mode === "single" || data.mode === "area-target") {
        setPhase("roll");
      }

      timeouts.push(
        setTimeout(() => {
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
        }, timings.mark + timings.roll)
      );

      timeouts.push(
        setTimeout(() => {
          if (applyStateCalledRef.current) return;
          applyStateCalledRef.current = true;
          if (data.deferStateApply) onApplyStateRef.current?.();
          const hasDamage =
            data.damageTotal != null &&
            (data.isHeal || data.hit !== false || data.saveTotal != null);
          if (hasDamage) {
            setShowDamage(true);
            setPhase("damage");
          }
        }, timings.mark + timings.roll + timings.applyStateDelay)
      );

      timeouts.push(
        setTimeout(() => {
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, timings.mark + timings.roll + timings.resultHold + timings.damageFade)
      );
    }, timings.mark);
    timeouts.push(t0);

    return () => {
      for (const id of timeouts) clearTimeout(id);
    };
  }, [fxId, reducedMotion, timings]);

  if (!fx || phase === "done") return null;

  const wrap = wrapRef.current;
  const w = wrap?.clientWidth ?? 800;
  const h = wrap?.clientHeight ?? 640;
  const { ox, oy } = canvasCenter(w, h);

  const markScreen = (axial: Axial) => {
    const world = axialToPixel(axial.q, axial.r, hexSize, ox, oy);
    return worldToScreen(world.x, world.y, w, h, view);
  };

  const to = markScreen(fx.markAxial);
  const panelAt = markScreen(fx.defenderAxial);

  const accent =
    fx.castFxKind === "heal"
      ? "rgba(100, 220, 140, 0.95)"
      : fx.castFxKind === "fire"
        ? "rgba(255, 120, 40, 0.95)"
        : fx.actionKind === "spell"
          ? "rgba(120,180,255,0.95)"
          : fx.critical
            ? "rgba(232,160,32,0.95)"
            : "rgba(200,80,60,0.95)";

  const areaFill = accent.replace(/[\d.]+\)$/, "0.2)");

  const resultLabel = resultLabelFor(fx);
  const showPanel =
    fx.mode === "area-intro" ||
    ((fx.mode === "single" || fx.mode === "area-target") &&
      (phase === "roll" || phase === "result" || phase === "damage"));
  const showResultText =
    fx.mode === "area-intro" || phase === "result" || phase === "damage";
  const showRoll = fx.mode !== "area-intro" && phase === "roll";

  const areaHexPaths =
    fx.areaHexes?.map((hex) => hexPathPoints(hex, hexSize, ox, oy, w, h, view)) ?? [];

  return (
    <div className={`combat-fx-layer ${reducedMotion ? "combat-fx-reduced" : ""}`} aria-live="polite">
      <svg className="combat-fx-hex-svg" width={w} height={h}>
        {areaHexPaths.map((d, i) => (
          <path
            key={`area-${i}`}
            d={d}
            className="combat-fx-area-hex"
            fill={areaFill}
            stroke={accent}
            strokeWidth={fx.mode === "area-intro" ? 2.5 : 1.5}
          />
        ))}
        <path
          d={hexPathPoints(fx.markAxial, hexSize, ox, oy, w, h, view)}
          className={`combat-fx-mark-hex${phase === "damage" ? " combat-fx-mark-hex--pulse" : ""}`}
          fill="none"
          stroke={accent}
          strokeWidth={3}
        />
        {fx.mode === "area-simultaneous" &&
          fx.areaTargets?.map((t) => (
            <path
              key={t.tokenId}
              d={hexPathPoints(t.axial, hexSize, ox, oy, w, h, view)}
              className="combat-fx-mark-hex combat-fx-mark-hex--target"
              fill="none"
              stroke={accent}
              strokeWidth={2}
            />
          ))}
      </svg>

      {showPanel ? (
        <div
          className={`combat-fx-panel${showResultText ? " combat-fx-panel--revealed" : ""}${fx.mode === "area-intro" ? " combat-fx-panel--area" : ""}`}
          style={{ left: panelAt.x, top: panelAt.y }}
        >
          <div className="combat-fx-panel-inner">
            {fx.mode === "area-intro" ? (
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
            ) : (
              <>
                {fx.mode === "area-target" && fx.cascadeIndex != null ? (
                  <p className="combat-fx-cascade-tag">
                    Alvo {fx.cascadeIndex}/{fx.cascadeTotal}
                  </p>
                ) : null}
                <DiceMiniature
                  formula="1d20"
                  value={
                    showRoll ? null : (fx.attackNatural ?? fx.saveTotal ?? null)
                  }
                  rolling={showRoll}
                  size="lg"
                />
                {showResultText && !showRoll ? (
                  <div className="combat-fx-panel-result">
                    <p
                      className={`combat-fx-result ${
                        fx.saveSuccess !== false && (fx.hit || fx.saveTotal != null) ? "hit" : "miss"
                      }`}
                    >
                      {resultLabel}
                    </p>
                    <p className="combat-fx-panel-vs">
                      {fx.saveTotal != null
                        ? `${fx.saveTotal} vs CD ${fx.saveDc}`
                        : `${fx.attackTotal} vs CA ${fx.defenderAc}`}
                    </p>
                    {fx.spellDamageType ? (
                      <p className="combat-fx-panel-dmg-type">{fx.spellDamageType}</p>
                    ) : null}
                    {fx.resolveDetail ? (
                      <p className="combat-fx-panel-detail">{fx.resolveDetail}</p>
                    ) : null}
                  </div>
                ) : showRoll ? (
                  <p className="combat-fx-rolling">Rolando…</p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {showDamage && fx.mode !== "area-simultaneous" && fx.damageTotal != null ? (
        <div
          className={`combat-fx-damage combat-fx-damage--hex ${fx.critical ? "crit" : ""} ${fx.isHeal ? "heal" : ""}`}
          style={{ left: to.x, top: to.y + (showPanel ? 72 : 0) }}
        >
          <span className="combat-fx-damage-label">{fx.damageTypeLabel ?? "Dano"}</span>
          <span className="combat-fx-damage-value">
            {fx.isHeal ? `+${fx.damageTotal}` : `−${fx.damageTotal}`}
          </span>
        </div>
      ) : null}

      {fx.mode === "area-simultaneous" && showDamage
        ? fx.areaTargets?.map((t) => {
            if (t.damageTotal == null || t.damageTotal <= 0) return null;
            const pos = markScreen(t.axial);
            return (
              <div
                key={t.tokenId}
                className={`combat-fx-damage combat-fx-damage--hex ${t.critical ? "crit" : ""}`}
                style={{ left: pos.x, top: pos.y }}
              >
                <span className="combat-fx-damage-label">{fx.damageTypeLabel ?? "Dano"}</span>
                <span className="combat-fx-damage-value">−{t.damageTotal}</span>
              </div>
            );
          })
        : null}

      {showResultText &&
      fx.hit === false &&
      !fx.criticalFail &&
      fx.saveTotal == null &&
      fx.mode !== "area-intro" ? (
        <div className="combat-fx-miss combat-fx-miss--hex" style={{ left: to.x, top: to.y + 88 }}>
          Errou
        </div>
      ) : null}
    </div>
  );
}
