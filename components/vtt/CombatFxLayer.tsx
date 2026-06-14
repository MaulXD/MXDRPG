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
import { splitCombatChatDetail } from "@/lib/combat/chat-display";
import type { TokenCastFxKind } from "@/lib/vtt/token-cast-fx";

export type { CombatFxState, CombatFxTargetBurst } from "@/lib/vtt/combat-fx-types";

export type TokenCombatFlash = "hit" | "miss" | "crit" | "heal" | null;

type Props = {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  hexSize: number;
  gridOx?: number;
  gridOy?: number;
  fx: CombatFxState | null;
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

function hexPathPoints(
  axial: Axial,
  hexSize: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
  view: BattlefieldView
): string {
  const local = axialToPixel(axial.q, axial.r, hexSize, ox, oy);
  const screen = worldToScreen(local.x, local.y, w, h, view);
  const r = hexDrawRadius(hexSize) * (view.scale ?? 1);
  const corners = hexCorners(screen.x, screen.y, r);
  return corners.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
}

function resultLabelFor(fx: CombatFxState): string {
  if (fx.isHeal) return "CURA";
  if (fx.saveTotal != null) {
    if (fx.saveDc == null || fx.saveSuccess === undefined) {
      return String(fx.saveTotal);
    }
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

export function CombatFxLayer({
  wrapRef,
  hexSize,
  gridOx,
  gridOy,
  fx,
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
  const [showDamage, setShowDamage] = useState(false);
  const fxRef = useRef(fx);
  const onDoneRef = useRef(onDone);
  const onApplyStateRef = useRef(onApplyState);
  const onTokenFlashRef = useRef(onTokenFlash);
  const onTokenCastFxRef = useRef(onTokenCastFx);
  const onChatRevealRef = useRef(onChatReveal);
  const castFxTriggeredRef = useRef(false);
  const applyStateCalledRef = useRef(false);
  fxRef.current = fx;
  onDoneRef.current = onDone;
  onApplyStateRef.current = onApplyState;
  onTokenFlashRef.current = onTokenFlash;
  onTokenCastFxRef.current = onTokenCastFx;
  onChatRevealRef.current = onChatReveal;

  const revealChat = (phase: "roll" | "damage" | "done") => {
    const ids = fxRef.current?.chatMessageIds;
    if (!ids?.length) return;
    onChatRevealRef.current?.(ids, phase);
  };

  const timings = useMemo(() => {
    const mode = fx?.mode ?? "single";
    if (reducedMotion) {
      return {
        mark: 120,
        roll: 200,
        resultPanelHold: mode === "area-intro" ? 480 : 620,
        postPanelDelay: 500,
        damageFade: 480,
        areaTargetMark: 160,
      };
    }
    return {
      mark: mode === "area-intro" ? 380 : 280,
      roll: 800,
      resultPanelHold: mode === "area-intro" ? 900 : 1400,
      postPanelDelay: 500,
      damageFade: 1500,
      areaTargetMark: 280,
    };
  }, [fx?.mode, reducedMotion]);

  const fxId = fx?.id ?? null;

  useEffect(() => {
    const data = fxRef.current;
    if (!fxId || !data) return;

    setPhase(data.mode === "area-simultaneous" ? "mark" : "mark");
    setPanelVisible(true);
    setShowDamage(false);
    castFxTriggeredRef.current = false;
    applyStateCalledRef.current = false;
    onTokenFlashRef.current?.(null, null);
    if (data.chatMessageIds?.length) {
      revealChat("roll");
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (data.mode === "area-intro") {
      timeouts.push(
        setTimeout(() => {
          setPhase("done");
          onDoneRef.current();
        }, timings.mark + timings.resultPanelHold)
      );
      return () => {
        for (const id of timeouts) clearTimeout(id);
      };
    }

    const schedulePostPanelDamage = (
      panelEndMs: number,
      onPanelHide: () => void,
      onDamage: () => void
    ) => {
      timeouts.push(
        setTimeout(() => {
          setPanelVisible(false);
          onPanelHide();
        }, panelEndMs)
      );
      timeouts.push(
        setTimeout(() => {
          onDamage();
        }, panelEndMs + timings.postPanelDelay)
      );
      timeouts.push(
        setTimeout(() => {
          revealChat("done");
          setPhase("done");
          onTokenFlashRef.current?.(null, null);
          onDoneRef.current();
        }, panelEndMs + timings.postPanelDelay + timings.damageFade)
      );
    };

    if (data.mode === "area-simultaneous") {
      const targets = data.areaTargets ?? [];
      const panelEnd = timings.mark + timings.roll + timings.resultPanelHold;
      timeouts.push(
        setTimeout(() => {
          revealChat("roll");
          setPhase("roll");
        }, timings.mark)
      );
      timeouts.push(
        setTimeout(() => {
          setPhase("result");
        }, timings.mark + timings.roll)
      );
      schedulePostPanelDamage(
        panelEnd,
        () => {
          for (const t of targets) {
            onTokenFlashRef.current?.(t.tokenId, flashForTarget(t));
            if (data.castFxKind) {
              onTokenCastFxRef.current?.(t.tokenId, data.castFxKind);
            }
          }
        },
        () => {
          if (!applyStateCalledRef.current) {
            applyStateCalledRef.current = true;
            onApplyStateRef.current?.();
          }
          revealChat("damage");
          setShowDamage(true);
          setPhase("damage");
        }
      );
      return () => {
        for (const id of timeouts) clearTimeout(id);
      };
    }

    const playTokenFx = () => {
      if (data.defenderTokenId) {
        onTokenFlashRef.current?.(data.defenderTokenId, tokenFlashForFx(data));
      }
      if (!castFxTriggeredRef.current && data.castFxKind && data.castFxTargetId) {
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
    };

    const applyDamagePhase = () => {
      if (applyStateCalledRef.current) return;
      applyStateCalledRef.current = true;
      onApplyStateRef.current?.();
      const hasDamage =
        data.damageTotal != null &&
        (data.isHeal || data.hit !== false || data.saveTotal != null);
      if (hasDamage) {
        setShowDamage(true);
        setPhase("damage");
      }
    };

    const runRollResultDamageSequence = (markMs: number) => {
      const panelEnd = markMs + timings.roll + timings.resultPanelHold;
      timeouts.push(
        setTimeout(() => {
          revealChat("roll");
          setPhase("roll");
        }, markMs)
      );
      timeouts.push(
        setTimeout(() => {
          setPhase("result");
        }, markMs + timings.roll)
      );
      schedulePostPanelDamage(
        panelEnd,
        () => {
          playTokenFx();
        },
        () => {
          applyDamagePhase();
          revealChat("damage");
        }
      );
    };

    if (data.mode === "area-target") {
      if (isHealCastWithoutRoll(data)) {
        const panelEnd = timings.mark + (reducedMotion ? 420 : 880);
        timeouts.push(
          setTimeout(() => {
            revealChat("roll");
            setPhase("result");
          }, timings.areaTargetMark)
        );
        schedulePostPanelDamage(
          panelEnd,
          () => {
            playTokenFx();
          },
          () => {
            applyDamagePhase();
            revealChat("damage");
          }
        );
      } else {
        runRollResultDamageSequence(timings.areaTargetMark);
      }
      return () => {
        for (const id of timeouts) clearTimeout(id);
      };
    }

    const t0 = setTimeout(() => {
      if (isHealCastWithoutRoll(data)) {
        const panelEnd = timings.mark + (reducedMotion ? 420 : 880);
        timeouts.push(
          setTimeout(() => {
            revealChat("roll");
            setPhase("result");
          }, timings.mark)
        );
        schedulePostPanelDamage(
          panelEnd,
          () => {
            playTokenFx();
          },
          () => {
            applyDamagePhase();
            revealChat("damage");
          }
        );
      } else {
        runRollResultDamageSequence(timings.mark);
      }
    }, 0);
    timeouts.push(t0);

    return () => {
      for (const id of timeouts) clearTimeout(id);
    };
  }, [fxId, reducedMotion, timings]);

  if (!fx || phase === "done") return null;

  const wrap = wrapRef.current;
  const w = wrap?.clientWidth ?? 800;
  const h = wrap?.clientHeight ?? 640;
  const center = canvasCenter(w, h);
  const ox = gridOx ?? center.ox;
  const oy = gridOy ?? center.oy;

  const markScreen = (axial: Axial) => {
    const local = axialToPixel(axial.q, axial.r, hexSize, ox, oy);
    return worldToScreen(local.x, local.y, w, h, view);
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
  const healCastWithoutRoll = isHealCastWithoutRoll(fx);
  const showDicePanel =
    !healCastWithoutRoll && (fx.mode === "single" || fx.mode === "area-target");
  const showPanel =
    fx.mode === "area-intro" ||
    ((showDicePanel || healCastWithoutRoll) &&
      panelVisible &&
      (phase === "roll" || phase === "result"));
  const showResultText =
    fx.mode === "area-intro" ||
    ((showDicePanel || healCastWithoutRoll) && panelVisible && phase === "result");
  const showRoll = showDicePanel && phase === "roll";
  const detailParts = fx.resolveDetail
    ? splitCombatChatDetail(
        fx.resolveDetail,
        fx.saveTotal != null ? "save" : "attack"
      )
    : { roll: "", damage: null };
  const showRollDetail =
    showDicePanel &&
    phase === "result" &&
    Boolean(detailParts.roll) &&
    !healCastWithoutRoll &&
    (fx.hit === true || fx.hit === false || fx.saveTotal != null);

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
            ) : healCastWithoutRoll ? (
              <>
                {showResultText && !showRoll ? (
                  <div className="combat-fx-panel-result">
                    <p className="combat-fx-result heal">{resultLabel}</p>
                    {fx.damageTotal != null && fx.damageTotal > 0 ? (
                      <p className="combat-fx-panel-damage combat-fx-panel-damage--heal">
                        +{fx.damageTotal}
                        <span className="combat-fx-panel-damage__type">Cura</span>
                      </p>
                    ) : null}
                  </div>
                ) : showRoll ? (
                  <p className="combat-fx-rolling">Curando…</p>
                ) : null}
              </>
            ) : (
              <>
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
                        fx.isHeal
                          ? "heal"
                          : fx.saveSuccess !== false && (fx.hit || fx.saveTotal != null)
                            ? "hit"
                            : "miss"
                      }`}
                    >
                      {resultLabel}
                    </p>
                    {fx.saveTotal != null || (fx.attackTotal != null && !fx.isHeal) || fx.defenderAc != null ? (
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
                    {fx.damageTotal != null && fx.damageTotal > 0 ? (
                      <p
                        className={`combat-fx-panel-damage${fx.critical ? " combat-fx-panel-damage--crit" : ""}${fx.isHeal ? " combat-fx-panel-damage--heal" : ""}`}
                      >
                        {fx.isHeal ? `+${fx.damageTotal}` : `−${fx.damageTotal}`}
                        {fx.damageTypeLabel ? (
                          <span className="combat-fx-panel-damage__type">{fx.damageTypeLabel}</span>
                        ) : null}
                      </p>
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
          style={{ left: to.x, top: to.y }}
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
            const heal = t.isHeal ?? fx.isHeal;
            return (
              <div
                key={t.tokenId}
                className={`combat-fx-damage combat-fx-damage--hex ${t.critical ? "crit" : ""}${heal ? " heal" : ""}`}
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
