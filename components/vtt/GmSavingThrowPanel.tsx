"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/character/rules";
import { buildSheetSavingThrows } from "@/lib/character/sheet-skills";
import { gmSavingThrows } from "@/hooks/useRoomSync";
import {
  isActorDowned,
  isPlayerBattleToken,
  isPlayerRoomActor,
  isTokenDowned,
} from "@/lib/vtt/player-tokens";

type TargetMode = "pick" | "on-map" | "downed";

type TargetRow = {
  actorId: string;
  tokenId?: string;
  name: string;
  onMap: boolean;
  downed: boolean;
  saveDisplay: string;
  trained: boolean;
};

type Props = {
  roomId: string;
  inviteCode?: string | null;
  tokens: BattleToken[];
  roomActors: Record<string, RoomActor>;
  onUpdated: (snapshot: RoomSnapshot) => void;
  onRefresh?: () => void;
};

const SAVE_ATTRS = Object.keys(ATTRIBUTE_LABELS) as AttributeKey[];

export function GmSavingThrowPanel({
  roomId,
  inviteCode = null,
  tokens,
  roomActors,
  onUpdated,
  onRefresh,
}: Props) {
  const [attribute, setAttribute] = useState<AttributeKey>("constituicao");
  const [mode, setMode] = useState<TargetMode>("on-map");
  const [dc, setDc] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const playerTokens = useMemo(
    () => tokens.filter((t) => isPlayerBattleToken(t, roomActors)),
    [tokens, roomActors]
  );

  const rows = useMemo((): TargetRow[] => {
    const players = Object.entries(roomActors)
      .map(([key, actor]) => ({ key, actor }))
      .filter(({ actor }) => isPlayerRoomActor(actor))
      .sort((a, b) => a.actor.name.localeCompare(b.actor.name, "pt"));

    return players.map(({ key, actor }) => {
      const actorId = actor.id || key;
      const token = playerTokens.find((t) => t.actorId === actorId || t.actorId === key);
      const saves = buildSheetSavingThrows(actor);
      const save = saves.find((s) => s.attr === attribute) ?? saves[0];
      return {
        actorId,
        tokenId: token?.id,
        name: actor.name,
        onMap: Boolean(token),
        downed: token ? isTokenDowned(token) : isActorDowned(actor),
        saveDisplay: save?.display ?? "—",
        trained: save?.trained ?? false,
      };
    });
  }, [roomActors, playerTokens, attribute]);

  const modeSelection = useMemo(() => {
    if (mode === "on-map") {
      return rows.filter((r) => r.onMap).map((r) => r.actorId);
    }
    if (mode === "downed") {
      return rows.filter((r) => r.downed && r.onMap).map((r) => r.actorId);
    }
    return [...picked];
  }, [mode, rows, picked]);

  useEffect(() => {
    if (mode === "pick") return;
    setPicked(new Set(modeSelection));
  }, [mode, modeSelection]);

  function togglePick(actorId: string) {
    setMode("pick");
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(actorId)) next.delete(actorId);
      else next.add(actorId);
      return next;
    });
  }

  async function roll() {
    const selectedIds = mode === "pick" ? [...picked] : modeSelection;
    if (!selectedIds.length) {
      setMsg("Selecione ao menos um personagem.");
      return;
    }

    const targets = selectedIds.map((actorId) => {
      const row = rows.find((r) => r.actorId === actorId);
      return { actorId, tokenId: row?.tokenId };
    });

    const dcNum = dc.trim() ? Number(dc) : undefined;

    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await gmSavingThrows(
        roomId,
        {
          attribute,
          targets,
          dc: dcNum,
        },
        inviteCode
      );
      onUpdated(snapshot);
      onRefresh?.();
      setMsg(
        `Salvaguarda de ${ATTRIBUTE_LABELS[attribute]} rolada para ${targets.length} personagem(ns).`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao rolar");
    } finally {
      setBusy(false);
    }
  }

  if (!rows.length) {
    return (
      <section className="vtt-panel vtt-gm-saves">
        <p className="vtt-hint">Nenhum personagem de jogador na sala.</p>
      </section>
    );
  }

  const previewMod = rows[0]
    ? buildSheetSavingThrows(roomActors[rows[0].actorId]).find((s) => s.attr === attribute)
    : null;

  const targetCount = mode === "pick" ? picked.size : modeSelection.length;

  return (
    <section className="vtt-panel vtt-gm-saves">
      <p className="vtt-gm-saves__lead">
        Role salvaguardas no chat da mesa com os modificadores da ficha. Tokens no mapa aplicam
        condições (desvantagem, etc.).
      </p>

      <fieldset className="vtt-gm-saves__attrs">
        <legend className="vtt-gm-saves__legend">Teste de salvaguarda</legend>
        <div className="vtt-gm-saves__attr-grid" role="radiogroup" aria-label="Atributo">
          {SAVE_ATTRS.map((attr) => (
            <button
              key={attr}
              type="button"
              className={`vtt-gm-saves__attr${attribute === attr ? " is-active" : ""}`}
              aria-pressed={attribute === attr}
              disabled={busy}
              onClick={() => setAttribute(attr)}
            >
              <span className="vtt-gm-saves__attr-label">{ATTRIBUTE_LABELS[attr]}</span>
            </button>
          ))}
        </div>
        {previewMod ? (
          <p className="vtt-gm-saves__mod-hint">
            Ex.: {rows[0]?.name} → {previewMod.display}
            {previewMod.trained ? " (proficiente)" : ""}
          </p>
        ) : null}
      </fieldset>

      <label className="vtt-field vtt-gm-saves__dc">
        CD (opcional)
        <input
          type="number"
          min={1}
          max={40}
          inputMode="numeric"
          placeholder="ex.: 14"
          value={dc}
          disabled={busy}
          onChange={(e) => setDc(e.target.value)}
        />
      </label>

      <fieldset className="vtt-gm-saves__targets">
        <legend className="vtt-gm-saves__legend">Alvos</legend>
        <div className="vtt-gm-saves__mode-tabs" role="tablist" aria-label="Modo de seleção">
          {(
            [
              ["pick", "Escolher"],
              ["on-map", "Com token"],
              ["downed", "Caídos"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              className={`vtt-gm-saves__mode${mode === id ? " is-active" : ""}`}
              disabled={busy}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="vtt-gm-saves__list">
          {rows.map((row) => {
            const checked = mode === "pick" ? picked.has(row.actorId) : modeSelection.includes(row.actorId);
            const disabledRow =
              busy || (mode === "on-map" && !row.onMap) || (mode === "downed" && (!row.onMap || !row.downed));
            return (
              <li
                key={row.actorId}
                className={`vtt-gm-saves__row${checked ? " is-checked" : ""}${disabledRow && mode !== "pick" ? " is-muted" : ""}`}
              >
                <label className="vtt-gm-saves__row-label">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabledRow}
                    onChange={() => togglePick(row.actorId)}
                  />
                  <span className="vtt-gm-saves__row-name">{row.name}</span>
                  <span className="vtt-gm-saves__row-mod">{row.saveDisplay}</span>
                </label>
                <span className="vtt-gm-saves__row-tags">
                  {row.onMap ? <span className="vtt-gm-saves__tag">mapa</span> : null}
                  {row.downed ? <span className="vtt-gm-saves__tag vtt-gm-saves__tag--down">caído</span> : null}
                  {row.trained ? <span className="vtt-gm-saves__tag vtt-gm-saves__tag--prof">prof.</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <button
        type="button"
        className="btn vtt-gm-saves__roll"
        disabled={busy || targetCount === 0}
        onClick={() => void roll()}
      >
        {busy ? "Rolando…" : `Rolar salv. ${ATTRIBUTE_LABELS[attribute]}`}
      </button>

      {msg ? <p className="vtt-gm-saves__msg">{msg}</p> : null}
    </section>
  );
}
