"use client";

import { useMemo, useState } from "react";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import {
  maxAssimilationPicksFromPlate,
  mealQualityFromCoccaoRoll,
  mealQualityLabel,
} from "@/lib/culinary/meal-rules";
import { listSpecimenAssimilations } from "@/lib/culinary/specimen";
import { postStructuredMeal } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  roomActors: Record<string, RoomActor>;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function CulinaryMealPanel({ roomId, roomActors, onUpdated }: Props) {
  const players = useMemo(
    () =>
      Object.values(roomActors)
        .filter((a) => !a.gmAuthored && !a.gmTemplateId)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [roomActors]
  );

  const [monsterEntryId, setMonsterEntryId] = useState("monstros-zumbi-de-masmorra");
  const [participantIds, setParticipantIds] = useState<string[]>(() => players.map((p) => p.id));
  const [cookActorId, setCookActorId] = useState(players[0]?.id ?? "");
  const [coccaoRoll, setCoccaoRoll] = useState("12");
  const [plateD4, setPlateD4] = useState("3");
  const [focusId, setFocusId] = useState("");
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const assimilations = useMemo(
    () => listSpecimenAssimilations(monsterEntryId),
    [monsterEntryId]
  );

  const quality = mealQualityFromCoccaoRoll(Number(coccaoRoll) || 0);
  const maxPicks = maxAssimilationPicksFromPlate(Number(plateD4) || 1);

  function toggleParticipant(id: string) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleExtra(id: string) {
    setExtraIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxPicks - 1) return prev;
      if (id === focusId) return prev;
      return [...prev, id];
    });
  }

  async function applyMeal() {
    if (busy) return;
    if (!focusId) {
      setMsg("Escolha o Foco (habilidade garantida).");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const snap = await postStructuredMeal(roomId, {
        monsterEntryId,
        participantActorIds: participantIds,
        cookActorId: cookActorId || players[0]?.id || "",
        coccaoRoll: Number(coccaoRoll),
        plateD4: Number(plateD4),
        focusAssimEntryId: focusId,
        extraAssimEntryIds: extraIds,
      });
      onUpdated(snap);
      setMsg("Refeição aplicada — assimilações na ficha dos participantes.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao preparar refeição");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="vtt-gm-culinary glass-panel">
      <h3 className="vtt-gm-culinary__title">Prato estruturado</h3>
      <p className="vtt-hint">
        Cap. 5–6: qualidade (Coccao), d4 de aproveitamento e assimilações do espécime (001–060).
      </p>

      <label className="vtt-field">
        <span>Monstro preparado (entryId)</span>
        <input
          className="input"
          value={monsterEntryId}
          onChange={(e) => {
            setMonsterEntryId(e.target.value.trim());
            setFocusId("");
            setExtraIds([]);
          }}
          placeholder="monstros-zumbi-de-masmorra"
        />
      </label>

      {assimilations.length ? (
        <p className="vtt-hint">{assimilations.length} habilidades de assimilação carregadas.</p>
      ) : (
        <p className="vtt-hint vtt-hint--warn">Sem tabela de assimilação para este monstro.</p>
      )}

      <label className="vtt-field">
        <span>Cozinheiro</span>
        <select className="input" value={cookActorId} onChange={(e) => setCookActorId(e.target.value)}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Coccao +{p.culinary?.coccao ?? 0})
            </option>
          ))}
        </select>
      </label>

      <div className="vtt-gm-culinary__row">
        <label className="vtt-field">
          <span>Teste Coccao (total)</span>
          <input
            className="input"
            type="number"
            value={coccaoRoll}
            onChange={(e) => setCoccaoRoll(e.target.value)}
          />
        </label>
        <label className="vtt-field">
          <span>d4 aproveitamento</span>
          <input
            className="input"
            type="number"
            min={1}
            max={4}
            value={plateD4}
            onChange={(e) => {
              setPlateD4(e.target.value);
              setExtraIds([]);
            }}
          />
        </label>
      </div>

      <p className="vtt-hint">
        Qualidade prevista: <strong>{mealQualityLabel(quality)}</strong> · até{" "}
        <strong>{maxPicks}</strong> habilidade(s).
      </p>

      <fieldset className="vtt-gm-culinary__fieldset">
        <legend>Participantes</legend>
        {players.map((p) => (
          <label key={p.id} className="vtt-gm-culinary__check">
            <input
              type="checkbox"
              checked={participantIds.includes(p.id)}
              onChange={() => toggleParticipant(p.id)}
            />
            {p.name}
          </label>
        ))}
      </fieldset>

      <fieldset className="vtt-gm-culinary__fieldset">
        <legend>Foco (garantido)</legend>
        {assimilations.map((a) => (
          <label key={a.entryId} className="vtt-gm-culinary__radio">
            <input
              type="radio"
              name="culinary-focus"
              checked={focusId === a.entryId}
              onChange={() => {
                setFocusId(a.entryId);
                setExtraIds((prev) => prev.filter((id) => id !== a.entryId));
              }}
            />
            <span>
              <strong>{a.name}</strong> — {a.effectLabel}
            </span>
          </label>
        ))}
      </fieldset>

      {maxPicks > 1 ? (
        <fieldset className="vtt-gm-culinary__fieldset">
          <legend>Extras (até {maxPicks - 1})</legend>
          {assimilations
            .filter((a) => a.entryId !== focusId)
            .map((a) => (
              <label key={a.entryId} className="vtt-gm-culinary__check">
                <input
                  type="checkbox"
                  checked={extraIds.includes(a.entryId)}
                  onChange={() => toggleExtra(a.entryId)}
                />
                {a.name}
              </label>
            ))}
        </fieldset>
      ) : null}

      <button type="button" className="btn" disabled={busy || !assimilations.length} onClick={applyMeal}>
        {busy ? "Aplicando…" : "Servir refeição ao grupo"}
      </button>
      {msg ? <p className="vtt-hint">{msg}</p> : null}
    </section>
  );
}
