"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import { formatXpProgress, MAX_LEVEL } from "@/lib/character/xp";
import { gmActorProgress } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  roomActors: Record<string, RoomActor>;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function GmActorProgressPanel({ roomId, roomActors, onUpdated }: Props) {
  const players = useMemo(
    () =>
      Object.values(roomActors)
        .filter((a) => !a.gmAuthored && !a.gmTemplateId)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [roomActors]
  );

  const [actorId, setActorId] = useState(players[0]?.id ?? "");
  const [xpAmount, setXpAmount] = useState("100");
  const [targetLevel, setTargetLevel] = useState("2");
  const [hpValue, setHpValue] = useState("1");
  const [hpMax, setHpMax] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = players.find((a) => a.id === actorId) ?? players[0];

  useEffect(() => {
    if (!selected) return;
    setHpValue(String(selected.resources.vida.value));
    setHpMax(String(selected.resources.vida.max));
  }, [selected?.id, selected?.resources.vida.value, selected?.resources.vida.max]);

  async function run(action: "grant-xp" | "set-level" | "set-hp") {
    if (!selected || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const body =
        action === "grant-xp"
          ? { action: "grant-xp" as const, actorId: selected.id, amount: Number(xpAmount) }
          : action === "set-level"
            ? { action: "set-level" as const, actorId: selected.id, level: Number(targetLevel) }
            : {
                action: "set-hp" as const,
                actorId: selected.id,
                value: Number(hpValue),
                max: Number(hpMax),
              };
      const snapshot = await gmActorProgress(roomId, body);
      onUpdated(snapshot);
      setMsg(
        action === "grant-xp"
          ? `+${xpAmount} XP para ${selected.name}.`
          : action === "set-level"
            ? `${selected.name} agora é nível ${targetLevel}.`
            : `Vida de ${selected.name} definida para ${hpValue}/${hpMax}.`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha na operação");
    } finally {
      setBusy(false);
    }
  }

  if (!players.length) {
    return (
      <section className="vtt-panel vtt-gm-progress">
        <p className="vtt-eyebrow">XP e nível</p>
        <p className="vtt-hint">Nenhum personagem de jogador na sala.</p>
      </section>
    );
  }

  return (
    <section className="vtt-panel vtt-gm-progress">
      <p className="vtt-eyebrow">XP, nível e vida</p>
      <p className="vtt-hint">
        Conceda XP, defina nível ou ajuste a vida manualmente (sincroniza com o token no mapa).
      </p>

      <label className="vtt-field">
        Personagem
        <select
          value={selected?.id ?? ""}
          onChange={(e) => setActorId(e.target.value)}
          disabled={busy}
        >
          {players.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · nv {a.identity.nivel}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <p className="vtt-hint" style={{ marginTop: 0 }}>
          {formatXpProgress(selected.identity.nivel, selected.identity.xpTotal ?? 0)}
        </p>
      ) : null}

      <div className="vtt-gm-progress-row">
        <label className="vtt-field vtt-field--inline">
          Dar XP
          <input
            type="number"
            min={1}
            step={50}
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            disabled={busy}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !selected}
          onClick={() => void run("grant-xp")}
        >
          Aplicar XP
        </button>
      </div>

      <div className="vtt-gm-progress-row">
        <label className="vtt-field vtt-field--inline">
          Vida atual
          <input
            type="number"
            min={0}
            value={hpValue}
            onChange={(e) => setHpValue(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="vtt-field vtt-field--inline">
          Máx.
          <input
            type="number"
            min={1}
            value={hpMax}
            onChange={(e) => setHpMax(e.target.value)}
            disabled={busy}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !selected}
          onClick={() => void run("set-hp")}
        >
          Aplicar vida
        </button>
      </div>

      <div className="vtt-gm-progress-row">
        <label className="vtt-field vtt-field--inline">
          Nível
          <input
            type="number"
            min={1}
            max={MAX_LEVEL}
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
            disabled={busy}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || !selected}
          onClick={() => void run("set-level")}
        >
          Definir nível
        </button>
      </div>

      {msg ? <p className="vtt-hint">{msg}</p> : null}
    </section>
  );
}
