"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { WEAPON_BY_ID } from "@/lib/character/um-anel/data";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";
import type { BattleToken } from "@/lib/vtt/types";
import { postRoomAttack, postRoomTorStance, type RoomApiPayload } from "@/hooks/useRoomSync";
import {
  TOR_DEFAULT_STANCE,
  TOR_STANCES,
  TOR_STANCE_META,
  isTorStance,
  type TorStanceId,
} from "@/lib/combat/um-anel/stances";

type Props = {
  x: number;
  y: number;
  token: BattleToken;
  allTokens: BattleToken[];
  roomId: string;
  onClose: () => void;
  onRoomSync: (payload?: RoomApiPayload) => void;
};

type WeaponChoice = { id: string; label: string };

export function TorAttackPopup({ token, allTokens, roomId, onClose, onRoomSync }: Props) {
  const [mounted, setMounted] = useState(false);
  const [sheet, setSheet] = useState<TorCharacterSheet | null>(null);
  const [targetId, setTargetId] = useState<string>("");
  const [choiceId, setChoiceId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const combat = token.torCombat;
  const isHero = combat?.kind === "hero";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isHero || !combat?.torCharacterId) return;
    let cancelled = false;
    fetch(`/api/tor-characters/${encodeURIComponent(combat.torCharacterId)}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: { character?: TorCharacterSheet }) => {
        if (!cancelled) setSheet(data.character ?? null);
      })
      .catch(() => {
        if (!cancelled) setErr("Falha ao carregar equipamento");
      });
    return () => {
      cancelled = true;
    };
  }, [isHero, combat?.torCharacterId]);

  const weaponChoices: WeaponChoice[] = useMemo(() => {
    if (isHero) {
      if (!sheet) return [];
      return sheet.warGear
        .map((item) => WEAPON_BY_ID[item.weaponId])
        .filter((w): w is NonNullable<typeof w> => Boolean(w))
        .map((w) => ({ id: w.id, label: w.label }));
    }
    return (combat?.actions ?? []).map((a) => ({ id: a.id, label: a.label }));
  }, [isHero, sheet, combat?.actions]);

  useEffect(() => {
    if (weaponChoices.length && !weaponChoices.some((w) => w.id === choiceId)) {
      setChoiceId(weaponChoices[0]!.id);
    }
  }, [weaponChoices, choiceId]);

  const targets = useMemo(
    () => allTokens.filter((t) => t.id !== token.id && t.torCombat && !t.torCombat.eliminated),
    [allTokens, token.id]
  );

  useEffect(() => {
    if (targets.length && !targets.some((t) => t.id === targetId)) {
      setTargetId(targets[0]!.id);
    }
  }, [targets, targetId]);

  /* A postura vem do token, não de estado local: outro cliente (ou o Mestre)
     pode trocá-la, e o snapshot é a fonte da verdade. */
  const stance: TorStanceId = isTorStance(combat?.stance) ? combat.stance : TOR_DEFAULT_STANCE;

  async function changeStance(next: string) {
    if (busy || next === stance) return;
    setBusy(true);
    setErr(null);
    try {
      onRoomSync(await postRoomTorStance(roomId, token.id, next));
    } catch (e) {
      // O erro mais comum é o requisito da Retaguarda ("faltam 2 aventureiros
      // em corpo a corpo") — precisa aparecer, não pode falhar em silêncio.
      setErr(e instanceof Error ? e.message : "Falha ao trocar a postura");
    } finally {
      setBusy(false);
    }
  }

  async function attack() {
    if (!targetId || !choiceId || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const payload = await postRoomAttack(roomId, token.id, targetId, {
        torWeaponId: isHero ? choiceId : undefined,
        torActionId: isHero ? undefined : choiceId,
      });
      const messages = "chat" in payload ? payload.chat : (payload.chatAppend ?? []);
      const last = messages[messages.length - 1];
      setLastMessage(last?.text ?? null);
      onRoomSync(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no ataque");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !combat) return null;

  return createPortal(
    <div
      className="vtt-gm-hp-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="vtt-gm-hp-modal glass-panel" role="dialog" aria-modal="true">
        <h3 className="vtt-gm-hp-modal__title">{token.name}</h3>
        <p className="vtt-gm-hp-modal__lead">
          {combat.kind === "adversary" ? "Adversário" : "Aventureiro"} · Resistência {token.vida ?? 0}/
          {token.vidaMax ?? 0} · Bloqueio {combat.parry}
        </p>

        {isHero ? (
          <label className="vtt-field">
            Postura de Combate
            <select value={stance} onChange={(e) => void changeStance(e.target.value)} disabled={busy}>
              {TOR_STANCES.map((id) => (
                <option key={id} value={id}>
                  {TOR_STANCE_META[id].label}
                </option>
              ))}
            </select>
            <span className="vtt-field__hint">
              Tarefa de combate: {TOR_STANCE_META[stance].combatTask}
              {stance === "retaguarda" ? " · só ataca e só é atingido à distância" : ""}
              {stance === "avancada" ? " · +1d no ataque, mais fácil de acertar você" : ""}
              {stance === "defensiva" ? " · −1d pra quem te ataca, −1d por inimigo adjacente" : ""}
            </span>
          </label>
        ) : null}

        <label className="vtt-field">
          Arma / Ataque
          <select value={choiceId} onChange={(e) => setChoiceId(e.target.value)} disabled={busy}>
            {weaponChoices.length === 0 ? <option value="">Nenhuma disponível</option> : null}
            {weaponChoices.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </label>

        <label className="vtt-field">
          Alvo
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} disabled={busy}>
            {targets.length === 0 ? <option value="">Nenhum alvo no mapa</option> : null}
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.vida ?? 0}/{t.vidaMax ?? 0})
              </option>
            ))}
          </select>
        </label>

        {err ? <p className="dice-err">{err}</p> : null}
        {lastMessage ? <p className="vtt-gm-hp-modal__lead">{lastMessage}</p> : null}

        <div className="vtt-gm-hp-modal__actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            Fechar
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy || !targetId || !choiceId}
            onClick={() => void attack()}
          >
            {busy ? "Atacando…" : "Atacar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
