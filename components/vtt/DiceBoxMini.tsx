"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DiceMiniature } from "@/components/vtt/DiceMiniature";
import type { DiceRollSpec } from "@/lib/vtt/combat-dice-model";
import { dieFaceValue, toDiceBoxRoll } from "@/lib/vtt/combat-dice-model";
import {
  DICE_HOST_HEIGHT,
  getDiceBoxOptionsForHost,
  loadVendorDiceBox,
  preloadCombatDiceBox,
  warmCombatDiceBoxes,
  type DiceBoxInstance,
  type DiceHostSize,
} from "@/lib/vtt/dice-combat-box";

type Props = {
  spec: DiceRollSpec;
  rolling?: boolean;
  size?: DiceHostSize;
  reducedMotion?: boolean;
  /** Fallback DiceMiniature quando WebGL/dice-box falha. */
  formula?: string;
};

function waitLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function DiceBoxMini({
  spec,
  rolling = false,
  size = "md",
  reducedMotion = false,
  formula,
}: Props) {
  const reactId = useId();
  const hostId = `dice-box-mini-${reactId.replace(/:/g, "")}`;
  const hostPx = DICE_HOST_HEIGHT[size];
  const boxRef = useRef<DiceBoxInstance | null>(null);
  const initDoneRef = useRef(false);
  const rollKeyRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const fallbackFormula = formula ?? `1d${spec.sides}`;

  useEffect(() => {
    preloadCombatDiceBox();
    void warmCombatDiceBoxes(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (failed) return;
    let cancelled = false;

    void (async () => {
      try {
        await waitLayout();
        if (cancelled || initDoneRef.current) return;
        const DiceBox = await loadVendorDiceBox();
        if (cancelled) return;
        boxRef.current = new DiceBox({
          ...getDiceBoxOptionsForHost(hostPx, reducedMotion),
          container: `#${hostId}`,
        });
        await boxRef.current.init();
        boxRef.current.show?.();
        initDoneRef.current = true;
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("[DiceBoxMini] init", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      initDoneRef.current = false;
      setReady(false);
      rollKeyRef.current = null;
      void Promise.resolve(boxRef.current?.clear()).catch(() => {});
      boxRef.current = null;
    };
  }, [failed, hostId, hostPx, reducedMotion]);

  useEffect(() => {
    if (failed || !ready) return;
    const spin = rolling || spec.value == null;
    const key = spin ? `${spec.sides}-spin` : `${spec.sides}-${spec.value}`;
    if (rollKeyRef.current === key) return;
    rollKeyRef.current = key;

    const face =
      spec.value != null ? dieFaceValue(spec.value, spec.sides) : undefined;
    void boxRef.current
      ?.roll(toDiceBoxRoll(spec, face))
      .catch((err) => console.error("[DiceBoxMini] roll", err));
  }, [failed, ready, rolling, spec]);

  if (failed) {
    return (
      <DiceMiniature
        formula={fallbackFormula}
        value={spec.value ?? null}
        rolling={rolling}
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <div
      className={`dice-box-mini dice-box-mini--${size}`}
      style={{ "--dice-mini-color": spec.themeColor } as CSSProperties}
    >
      <div id={hostId} className="dice-box-mini__host" />
    </div>
  );
}
