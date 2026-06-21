"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import {
  DICE_COMBAT_EVICT_MS,
  DICE_TIER_LABELS,
  VENDOR_DICE_BOX,
  dieFaceValue,
  getAttackDieColor,
  getAttackSlotBorder,
  getDamageDieColor,
  getDiceBoxBaseOptions,
  preloadCombatDiceBox,
  type DiceSides,
} from "@/lib/vtt/dice-combat-box";
import type { PortraitFrameTier } from "@/lib/vtt/portrait-frame";

type DiceBoxInstance = {
  init(): Promise<boolean | void>;
  roll(notation: unknown): Promise<unknown>;
  clear(): unknown;
  show?(): DiceBoxInstance;
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

async function loadVendorDiceBox(): Promise<DiceBoxCtor> {
  preloadCombatDiceBox();
  const mod = (await import(/* webpackIgnore: true */ VENDOR_DICE_BOX)) as {
    default: DiceBoxCtor;
  };
  return mod.default;
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

  const attackColor = getAttackDieColor(attackerTier);
  const attackBorder = getAttackSlotBorder(attackerTier);
  const damageColor = getDamageDieColor({ isHeal, isCrit });
  const tierLabel = DICE_TIER_LABELS[attackerTier];

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
    DiceBoxRef.current = await loadVendorDiceBox();
    return DiceBoxRef.current;
  }, []);

  const ensureAttackBox = useCallback(async () => {
    await waitLayout();
    if (attackReadyRef.current) {
      attackBoxRef.current?.resizeWorld?.();
      attackBoxRef.current?.show?.();
      return;
    }
    const DiceBox = await loadDiceBox();
    attackBoxRef.current = new DiceBox({
      ...getDiceBoxBaseOptions(reducedMotion),
      container: `#${attackHostId}`,
    });
    await attackBoxRef.current.init();
    attackBoxRef.current.show?.();
    attackReadyRef.current = true;
  }, [attackHostId, loadDiceBox, reducedMotion]);

  const ensureDamageBox = useCallback(async () => {
    await waitLayout();
    if (damageReadyRef.current) {
      damageBoxRef.current?.resizeWorld?.();
      damageBoxRef.current?.show?.();
      return;
    }
    const DiceBox = await loadDiceBox();
    damageBoxRef.current = new DiceBox({
      ...getDiceBoxBaseOptions(reducedMotion),
      container: `#${damageHostId}`,
    });
    await damageBoxRef.current.init();
    damageBoxRef.current.show?.();
    damageReadyRef.current = true;
  }, [damageHostId, loadDiceBox, reducedMotion]);

  useEffect(() => {
    void loadDiceBox();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!attackRolling) return;
    const spin = attackValue == null;
    const key = spin
      ? `${sequenceKey}-atk-spin`
      : `${sequenceKey}-atk-${attackValue}`;
    if (attackRollKeyRef.current === key) return;
    attackRollKeyRef.current = key;

    const face = attackValue != null ? dieFaceValue(attackValue, attackSides) : undefined;
    void ensureAttackBox()
      .then(() =>
        attackBoxRef.current?.roll({
          qty: 1,
          sides: attackSides,
          ...(face != null ? { value: face } : {}),
          themeColor: attackColor,
        })
      )
      .catch((err) => console.error("[DiceCombatPanel] attack roll", err));
  }, [
    attackRolling,
    attackValue,
    attackSides,
    attackColor,
    ensureAttackBox,
    sequenceKey,
  ]);

  useEffect(() => {
    if (!showDamageSlot || !damageRolling || damageValue == null) return;
    const key = `${sequenceKey}-dmg-${damageValue}`;
    if (damageRollKeyRef.current === key) return;
    damageRollKeyRef.current = key;

    const face = dieFaceValue(damageValue, damageSides);
    void ensureDamageBox()
      .then(() =>
        damageBoxRef.current?.roll({
          qty: 1,
          sides: damageSides,
          ...(face != null ? { value: face } : {}),
          themeColor: damageColor,
        })
      )
      .catch((err) => console.error("[DiceCombatPanel] damage roll", err));
  }, [
    showDamageSlot,
    damageRolling,
    damageValue,
    damageSides,
    damageColor,
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
      className={`combat-dice-box-row${evicting ? " combat-dice-box-row--evicting" : ""}${showDamageSlot ? " combat-dice-box-row--dual" : ""}`}
    >
      <div
        className={`combat-dice-slot${attackLocked ? " combat-dice-slot--locked" : ""}`}
        style={
          {
            "--dice-tier-color": attackColor,
            "--dice-tier-border": attackBorder,
          } as CSSProperties
        }
      >
        <div id={attackHostId} className="combat-dice-box-host" />
        <span className="combat-dice-slot__label">
          <span className="combat-dice-slot__dot" style={{ background: attackColor }} />
          Ataque {attackSides === 20 ? "d20" : `d${attackSides}`} · {tierLabel}
        </span>
        {attackLocked ? (
          <span className="combat-dice-slot__lock" aria-hidden>
            fixo
          </span>
        ) : null}
      </div>
      {showDamageSlot ? (
        <div
          className="combat-dice-slot combat-dice-slot--damage"
          style={
            {
              "--dice-tier-color": damageColor,
              "--dice-tier-border": isCrit
                ? "rgba(255, 200, 48, 0.72)"
                : isHeal
                  ? "rgba(70, 200, 120, 0.65)"
                  : "rgba(224, 80, 64, 0.65)",
            } as CSSProperties
          }
        >
          <div id={damageHostId} className="combat-dice-box-host" />
          <span className="combat-dice-slot__label">
            <span className="combat-dice-slot__dot" style={{ background: damageColor }} />
            {isHeal ? "Cura" : isCrit ? "Crítico" : `Dano d${damageSides}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
