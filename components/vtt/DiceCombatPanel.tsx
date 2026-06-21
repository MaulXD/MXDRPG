"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import type { CombatDiceSequence, DiceCombatUiState } from "@/lib/vtt/combat-dice-model";
import { dieFaceValue, toDiceBoxRoll } from "@/lib/vtt/combat-dice-model";
import {
  getDiceBoxBaseOptions,
  loadVendorDiceBox,
  warmCombatDiceBoxes,
  type DiceBoxInstance,
} from "@/lib/vtt/dice-combat-box";

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
  const safeKey = sequence.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const attackHostId = `combat-dice-attack-${safeKey}`;
  const damageHostId = `combat-dice-damage-${safeKey}`;
  const attackBoxRef = useRef<DiceBoxInstance | null>(null);
  const damageBoxRef = useRef<DiceBoxInstance | null>(null);
  const attackReadyRef = useRef(false);
  const damageReadyRef = useRef(false);
  const attackRollKeyRef = useRef<string | null>(null);
  const damageRollKeyRef = useRef<string | null>(null);
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
    await warmCombatDiceBoxes(reducedMotion);
    await waitLayout();
    if (attackReadyRef.current) {
      attackBoxRef.current?.resizeWorld?.();
      attackBoxRef.current?.show?.();
      return;
    }
    const DiceBox = await loadVendorDiceBox();
    attackBoxRef.current = new DiceBox({
      ...getDiceBoxBaseOptions(reducedMotion),
      container: `#${attackHostId}`,
    });
    await attackBoxRef.current.init();
    attackBoxRef.current.show?.();
    attackReadyRef.current = true;
  }, [attackHostId, reducedMotion]);

  const ensureDamageBox = useCallback(async () => {
    await warmCombatDiceBoxes(reducedMotion);
    await waitLayout();
    if (damageReadyRef.current) {
      damageBoxRef.current?.resizeWorld?.();
      damageBoxRef.current?.show?.();
      return;
    }
    const DiceBox = await loadVendorDiceBox();
    damageBoxRef.current = new DiceBox({
      ...getDiceBoxBaseOptions(reducedMotion),
      container: `#${damageHostId}`,
    });
    await damageBoxRef.current.init();
    damageBoxRef.current.show?.();
    damageReadyRef.current = true;
  }, [damageHostId, reducedMotion]);

  useEffect(() => {
    void loadVendorDiceBox();
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
  }, [sequence.id, clearBoth]);

  useEffect(() => {
    if (!ui.attackRolling) return;
    const spin = attack.value == null;
    const key = spin ? `${sequence.id}-atk-spin` : `${sequence.id}-atk-${attack.value}`;
    if (attackRollKeyRef.current === key) return;
    attackRollKeyRef.current = key;

    const face =
      attack.value != null ? dieFaceValue(attack.value, attack.sides) : undefined;
    void ensureAttackBox()
      .then(() => attackBoxRef.current?.roll(toDiceBoxRoll(attack, face)))
      .catch((err) => console.error("[DiceCombatPanel] attack roll", err));
  }, [ui.attackRolling, attack, ensureAttackBox, sequence.id]);

  useEffect(() => {
    if (!ui.showDamage || !ui.damageRolling || !damage) return;
    const key = `${sequence.id}-dmg-${damage.value ?? "spin"}`;
    if (damageRollKeyRef.current === key) return;
    damageRollKeyRef.current = key;

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
        <div id={attackHostId} className="combat-dice-box-host" />
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
          <div id={damageHostId} className="combat-dice-box-host" />
          <span className="combat-dice-slot__label">
            <span className="combat-dice-slot__dot" style={{ background: damage.themeColor }} />
            {damageSlotLabel ?? `Dano d${damage.sides}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
