"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DiceMiniature } from "@/components/vtt/DiceMiniature";
import {
  DICE_HOST_HEIGHT,
  DICE_ROLLER_COLOR,
  dieFaceValue,
  formulaToDiceSides,
  getDiceBoxOptionsForHost,
  loadVendorDiceBox,
  preloadCombatDiceBox,
  warmCombatDiceBoxes,
  type DiceBoxInstance,
  type DiceHostSize,
} from "@/lib/vtt/dice-combat-box";

type Props = {
  formula: string;
  value: number | null;
  rolling?: boolean;
  size?: DiceHostSize;
  themeColor?: string;
  reducedMotion?: boolean;
};

function waitLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function DiceBoxMini({
  formula,
  value,
  rolling = false,
  size = "md",
  themeColor = DICE_ROLLER_COLOR,
  reducedMotion = false,
}: Props) {
  const reactId = useId();
  const hostId = `dice-box-mini-${reactId.replace(/:/g, "")}`;
  const hostPx = DICE_HOST_HEIGHT[size];
  const sides = formulaToDiceSides(formula, 20);
  const boxRef = useRef<DiceBoxInstance | null>(null);
  const initDoneRef = useRef(false);
  const rollKeyRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

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
    const spin = rolling || value == null;
    const key = spin ? `${formula}-spin` : `${formula}-${value}`;
    if (rollKeyRef.current === key) return;
    rollKeyRef.current = key;

    const face = value != null ? dieFaceValue(value, sides) : undefined;
    void boxRef.current
      ?.roll({
        qty: 1,
        sides,
        ...(face != null ? { value: face } : {}),
        themeColor,
      })
      .catch((err) => console.error("[DiceBoxMini] roll", err));
  }, [failed, ready, formula, rolling, value, sides, themeColor]);

  if (failed) {
    return (
      <DiceMiniature
        formula={formula}
        value={value}
        rolling={rolling}
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "md"}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <div
      className={`dice-box-mini dice-box-mini--${size}`}
      style={{ "--dice-mini-color": themeColor } as CSSProperties}
    >
      <div id={hostId} className="dice-box-mini__host" />
    </div>
  );
}
