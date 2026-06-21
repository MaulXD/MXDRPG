"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import type { CombatDiceSequence, DiceCombatUiState } from "@/lib/vtt/combat-dice-model";
import { dieFaceValue, toDiceBoxRoll } from "@/lib/vtt/combat-dice-model";
import {
  COMBAT_DICE_HOST_PX,
  getDiceBoxOptionsForHost,
  loadVendorDiceBox,
  type DiceBoxInstance,
} from "@/lib/vtt/dice-combat-box";

/** Hosts fixos — reutiliza instâncias WebGL entre ataques. */
const ATTACK_HOST_ID = "combat-dice-panel-attack";
const DAMAGE_HOST_ID = "combat-dice-panel-damage";

type Props = {
  sequence: CombatDiceSequence;
  ui: DiceCombatUiState;
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

export function DiceCombatPanel({ sequence, ui, reducedMotion = false }: Props) {
  const attackBoxRef = useRef<DiceBoxInstance | null>(null);
  const damageBoxRef = useRef<DiceBoxInstance | null>(null);
  const attackReadyRef = useRef(false);
  const damageReadyRef = useRef(false);
  const attackSeqRef = useRef<string | null>(null);
  const damageSeqRef = useRef<string | null>(null);
  const evictingRef = useRef(false);

  const { attack, attacker, damage, attackSlotLabel, damageSlotLabel, damageSlotBorder } =
    sequence;

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

  const ensureAttackBox = useCallback(async () => {
    await waitLayout();
    if (attackReadyRef.current) {
      attackBoxRef.current?.resizeWorld?.();
      attackBoxRef.current?.show?.();
      return;
    }
    const DiceBox = await loadVendorDiceBox();
    attackBoxRef.current = new DiceBox({
      ...getDiceBoxOptionsForHost(COMBAT_DICE_HOST_PX, reducedMotion),
      container: `#${ATTACK_HOST_ID}`,
    });
    await attackBoxRef.current.init();
    attackBoxRef.current.show?.();
    attackReadyRef.current = true;
  }, [reducedMotion]);

  const ensureDamageBox = useCallback(async () => {
    await waitLayout();
    if (damageReadyRef.current) {
      damageBoxRef.current?.resizeWorld?.();
      damageBoxRef.current?.show?.();
      return;
    }
    const DiceBox = await loadVendorDiceBox();
    damageBoxRef.current = new DiceBox({
      ...getDiceBoxOptionsForHost(COMBAT_DICE_HOST_PX, reducedMotion),
      container: `#${DAMAGE_HOST_ID}`,
    });
    await damageBoxRef.current.init();
    damageBoxRef.current.show?.();
    damageReadyRef.current = true;
  }, [reducedMotion]);

  useEffect(() => {
    attackSeqRef.current = null;
    damageSeqRef.current = null;
    evictingRef.current = false;
  }, [sequence.id]);

  useEffect(() => {
    if (!ui.attackRolling) return;
    if (attackSeqRef.current === sequence.id) return;
    attackSeqRef.current = sequence.id;

    const face =
      attack.value != null ? dieFaceValue(attack.value, attack.sides) : undefined;
    void ensureAttackBox()
      .then(() => attackBoxRef.current?.roll(toDiceBoxRoll(attack, face)))
      .catch((err) => console.error("[DiceCombatPanel] attack roll", err));
  }, [ui.attackRolling, attack, ensureAttackBox, sequence.id]);

  useEffect(() => {
    if (!ui.showDamage || !ui.damageRolling || !damage) return;
    if (damageSeqRef.current === sequence.id) return;
    damageSeqRef.current = sequence.id;

    const face =
      damage.value != null ? dieFaceValue(damage.value, damage.sides) : undefined;
    void ensureDamageBox()
      .then(() => damageBoxRef.current?.roll(toDiceBoxRoll(damage, face)))
      .catch((err) => console.error("[DiceCombatPanel] damage roll", err));
  }, [ui.showDamage, ui.damageRolling, damage, ensureDamageBox, sequence.id]);

  useEffect(() => {
    if (!ui.evicting || evictingRef.current) return;
    evictingRef.current = true;
    void (async () => {
      await waitMs(sequence.timings.evictMs);
      await clearBoth();
      evictingRef.current = false;
    })();
  }, [ui.evicting, clearBoth, sequence.timings.evictMs]);

  useEffect(() => {
    return () => {
      void clearBoth();
    };
  }, [clearBoth]);

  return (
    <div
      className={`combat-dice-box-row${ui.evicting ? " combat-dice-box-row--evicting" : ""}${ui.showDamage && damage ? " combat-dice-box-row--dual" : ""}`}
    >
      <div
        className={`combat-dice-slot${ui.attackLocked ? " combat-dice-slot--locked" : ""}`}
        style={
          {
            "--dice-tier-color": attacker.color,
            "--dice-tier-border": attacker.border,
          } as CSSProperties
        }
      >
        <div id={ATTACK_HOST_ID} className="combat-dice-box-host" />
        <span className="combat-dice-slot__label">
          <span className="combat-dice-slot__dot" style={{ background: attacker.color }} />
          {attackSlotLabel}
        </span>
        {ui.attackLocked ? (
          <span className="combat-dice-slot__lock" aria-hidden>
            fixo
          </span>
        ) : null}
      </div>
      {ui.showDamage && damage ? (
        <div
          className="combat-dice-slot combat-dice-slot--damage"
          style={
            {
              "--dice-tier-color": damage.themeColor,
              "--dice-tier-border": damageSlotBorder ?? damage.themeColor,
            } as CSSProperties
          }
        >
          <div id={DAMAGE_HOST_ID} className="combat-dice-box-host" />
          <span className="combat-dice-slot__label">
            <span className="combat-dice-slot__dot" style={{ background: damage.themeColor }} />
            {damageSlotLabel ?? `Dano d${damage.sides}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
