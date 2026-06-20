"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  DICE_COMBAT_EVICT_MS,
  dieFaceValue,
  getAttackDieColor,
  getDamageDieColor,
  getDiceBoxBaseOptions,
  type DiceSides,
} from "@/lib/vtt/dice-combat-box";
import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";
import "@3d-dice/dice-box/dist/style.css";

type DiceBoxInstance = {
  init(): Promise<boolean | void>;
  roll(notation: unknown): Promise<unknown>;
  clear(): unknown;
  resizeWorld?(): void;
};

type DiceBoxCtor = new (config: Record<string, unknown>) => DiceBoxInstance;

type Props = {
  sequenceKey: string;
  attackSides: DiceSides;
  attackValue: number | null;
  attackRolling: boolean;
  attackLocked: boolean;
  showDamageSlot: boolean;
  damageSides: DiceSides;
  damageValue: number | null;
  damageRolling: boolean;
  attackerTier: PortraitFrameTier;
  isHeal?: boolean;
  isCrit?: boolean;
  evicting: boolean;
  reducedMotion?: boolean;
};

function waitLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DiceCombatPanel({
  sequenceKey,
  attackSides,
  attackValue,
  attackRolling,
  attackLocked,
  showDamageSlot,
  damageSides,
  damageValue,
  damageRolling,
  attackerTier,
  isHeal,
  isCrit,
  evicting,
  reducedMotion = false,
}: Props) {
  const safeKey = sequenceKey.replace(/[^a-zA-Z0-9_-]/g, "_");
  const attackHostId = `combat-dice-attack-${safeKey}`;
  const damageHostId = `combat-dice-damage-${safeKey}`;
  const attackBoxRef = useRef<DiceBoxInstance | null>(null);
  const damageBoxRef = useRef<DiceBoxInstance | null>(null);
  const attackReadyRef = useRef(false);
  const damageReadyRef = useRef(false);
  const attackRollKeyRef = useRef<string | null>(null);
  const damageRollKeyRef = useRef<string | null>(null);
  const DiceBoxRef = useRef<DiceBoxCtor | null>(null);
  const evictingRef = useRef(false);

  const clearBoth = useCallback(async () => {
    await Promise.all([
      attackReadyRef.current
        ? Promise.resolve(attackBoxRef.current?.clear()).catch(() => {})
        : Promise.resolve(),
      damageReadyRef.current
        ? Promise.resolve(damageBoxRef.current?.clear()).catch(() => {})
        : Promise.resolve(),
    ]);
  }, []);

  const loadDiceBox = useCallback(async (): Promise<DiceBoxCtor> => {
    if (DiceBoxRef.current) return DiceBoxRef.current;
    const mod = await import("@3d-dice/dice-box");
    DiceBoxRef.current = mod.default as DiceBoxCtor;
    return DiceBoxRef.current;
  }, []);

  const ensureAttackBox = useCallback(async () => {
    await waitLayout();
    await waitMs(reducedMotion ? 40 : 120);
    if (attackReadyRef.current) {
      attackBoxRef.current?.resizeWorld?.();
      return;
    }
    const DiceBox = await loadDiceBox();
    attackBoxRef.current = new DiceBox({
      ...getDiceBoxBaseOptions(reducedMotion),
      container: `#${attackHostId}`,
    });
    await attackBoxRef.current.init();
    attackReadyRef.current = true;
  }, [attackHostId, loadDiceBox, reducedMotion]);

  const ensureDamageBox = useCallback(async () => {
    await waitLayout();
    await waitMs(reducedMotion ? 40 : 80);
    if (damageReadyRef.current) {
      damageBoxRef.current?.resizeWorld?.();
      return;
    }
    const DiceBox = await loadDiceBox();
    damageBoxRef.current = new DiceBox({
      ...getDiceBoxBaseOptions(reducedMotion),
      container: `#${damageHostId}`,
    });
    await damageBoxRef.current.init();
    damageReadyRef.current = true;
  }, [damageHostId, loadDiceBox, reducedMotion]);

  useEffect(() => {
    attackRollKeyRef.current = null;
    damageRollKeyRef.current = null;
    attackReadyRef.current = false;
    damageReadyRef.current = false;
    attackBoxRef.current = null;
    damageBoxRef.current = null;
    return () => {
      void clearBoth();
    };
  }, [sequenceKey, clearBoth]);

  useEffect(() => {
    if (!attackRolling || attackValue == null) return;
    const key = `${sequenceKey}-atk`;
    if (attackRollKeyRef.current === key) return;
    attackRollKeyRef.current = key;

    const color = getAttackDieColor(attackerTier);
    const face = dieFaceValue(attackValue, attackSides);
    void ensureAttackBox()
      .then(() =>
        attackBoxRef.current?.roll({
          qty: 1,
          sides: attackSides,
          ...(face != null ? { value: face } : {}),
          themeColor: color,
        })
      )
      .catch((err) => console.error("[DiceCombatPanel] attack roll", err));
  }, [
    attackRolling,
    attackValue,
    attackSides,
    attackerTier,
    ensureAttackBox,
    sequenceKey,
  ]);

  useEffect(() => {
    if (!showDamageSlot || !damageRolling) return;
    const key = `${sequenceKey}-dmg`;
    if (damageRollKeyRef.current === key) return;
    damageRollKeyRef.current = key;

    const color = getDamageDieColor({ isHeal, isCrit });
    const face = dieFaceValue(damageValue, damageSides);
    void ensureDamageBox()
      .then(() =>
        damageBoxRef.current?.roll({
          qty: 1,
          sides: damageSides,
          ...(face != null ? { value: face } : {}),
          themeColor: color,
        })
      )
      .catch((err) => console.error("[DiceCombatPanel] damage roll", err));
  }, [
    showDamageSlot,
    damageRolling,
    damageValue,
    damageSides,
    isHeal,
    isCrit,
    ensureDamageBox,
    sequenceKey,
  ]);

  useEffect(() => {
    if (!evicting || evictingRef.current) return;
    evictingRef.current = true;
    void (async () => {
      await waitMs(DICE_COMBAT_EVICT_MS);
      await clearBoth();
      evictingRef.current = false;
    })();
  }, [evicting, clearBoth]);

  return (
    <div
      className={`combat-dice-box-row${evicting ? " combat-dice-box-row--evicting" : ""}`}
    >
      <div
        className={`combat-dice-slot${attackLocked ? " combat-dice-slot--locked" : ""}`}
      >
        <div id={attackHostId} className="combat-dice-box-host" />
        <span className="combat-dice-slot__label">
          <span
            className="combat-dice-slot__dot"
            style={{ background: getAttackDieColor(attackerTier) }}
          />
          {attackSides === 20 ? "d20" : `d${attackSides}`}
        </span>
        {attackLocked ? (
          <span className="combat-dice-slot__lock" aria-hidden>
            fixo
          </span>
        ) : null}
      </div>
      {showDamageSlot ? (
        <div className="combat-dice-slot combat-dice-slot--damage">
          <div id={damageHostId} className="combat-dice-box-host" />
          <span className="combat-dice-slot__label">
            <span
              className="combat-dice-slot__dot"
              style={{
                background: getDamageDieColor({ isHeal, isCrit }),
              }}
            />
            {isHeal ? "Cura" : `d${damageSides}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
