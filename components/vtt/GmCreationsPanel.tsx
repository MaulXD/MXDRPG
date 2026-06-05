"use client";

import { useEffect, useMemo, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomActor } from "@/lib/room/types";
import type { GmCreation } from "@/lib/room/gm-creations";
import { listMonsterTemplates } from "@/lib/vtt/monsters";
import {
  createGmCreation,
  deleteGmCreation,
  spawnGmCreation,
  updateGmCreation,
} from "@/hooks/useRoomSync";
import { writeGmCreationSpawnDrag } from "@/lib/vtt/spawn-drag";

type Props = {
  roomId: string;
  creations: Record<string, GmCreation>;
  roomActors: Record<string, RoomActor>;
  spawnAxial: Axial | null;
  onUpdated: (snapshot: import("@/lib/room/types").RoomSnapshot) => void;
};

export function GmCreationsPanel({
  roomId,
  creations,
  roomActors,
  spawnAxial,
  onUpdated,
}: Props) {
  const list = useMemo(
    () => Object.values(creations).sort((a, b) => b.updatedAt - a.updatedAt),
    [creations]
  );
  const monsters = listMonsterTemplates();
  const cloneableActors = useMemo(
    () => Object.values(roomActors).filter((a) => !a.gmAuthored && !a.gmTemplateId),
    [roomActors]
  );

  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null);
  const [draft, setDraft] = useState<GmCreation | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("Nova criatura");
  const [newKind, setNewKind] = useState<"creature" | "npc">("creature");
  const [cloneMonsterId, setCloneMonsterId] = useState(monsters[0]?.entryId ?? "");
  const [cloneActorId, setCloneActorId] = useState(cloneableActors[0]?.id ?? "");

  useEffect(() => {
    if (!selectedId || !creations[selectedId]) {
      setDraft(null);
      return;
    }
    setDraft(structuredClone(creations[selectedId]));
  }, [selectedId, creations]);

  async function run<T>(fn: () => Promise<T>) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha na operação");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateBlank() {
    await run(async () => {
      const { snapshot, creation } = await createGmCreation(roomId, {
        mode: "blank",
        name: newName,
        creationKind: newKind,
      });
      setSelectedId(creation.id);
      onUpdated(snapshot);
      setMsg(`"${creation.name}" criado.`);
    });
  }

  async function handleCloneMonster() {
    if (!cloneMonsterId) return;
    await run(async () => {
      const { snapshot, creation } = await createGmCreation(roomId, {
        mode: "monster",
        monsterEntryId: cloneMonsterId,
      });
      setSelectedId(creation.id);
      onUpdated(snapshot);
      setMsg(`Clonado de compêndio: ${creation.name}`);
    });
  }

  async function handleCloneActor() {
    if (!cloneActorId) return;
    await run(async () => {
      const { snapshot, creation } = await createGmCreation(roomId, {
        mode: "actor",
        actorId: cloneActorId,
      });
      setSelectedId(creation.id);
      onUpdated(snapshot);
      setMsg(`Clonado de personagem: ${creation.name}`);
    });
  }

  async function handleSave() {
    if (!draft) return;
    await run(async () => {
      const patch =
        draft.kind === "creature" && draft.creature
          ? { name: draft.name, creature: draft.creature }
          : draft.kind === "npc" && draft.npc
            ? {
                name: draft.name,
                npc: {
                  identity: draft.npc.identity,
                  resources: draft.npc.resources,
                  movement: draft.npc.movement,
                  tactical: draft.npc.tactical,
                  attributes: draft.npc.attributes,
                },
              }
            : { name: draft.name };

      const { snapshot } = await updateGmCreation(roomId, draft.id, patch);
      onUpdated(snapshot);
      setMsg("Template salvo.");
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este template? Tokens já no mapa não são removidos.")) return;
    await run(async () => {
      const snapshot = await deleteGmCreation(roomId, id);
      if (selectedId === id) setSelectedId(null);
      onUpdated(snapshot);
      setMsg("Template excluído.");
    });
  }

  async function handleSpawn(id: string) {
    if (!spawnAxial) {
      setMsg("Passe o mouse sobre um hex no mapa ou arraste o template até o tabuleiro.");
      return;
    }
    await run(async () => {
      const snapshot = await spawnGmCreation(roomId, id, spawnAxial.q, spawnAxial.r);
      onUpdated(snapshot);
      setMsg("Colocado na mesa.");
    });
  }

  function updateDraftName(name: string) {
    setDraft((d) => (d ? { ...d, name } : d));
  }

  function updateCreatureField(key: keyof NonNullable<GmCreation["creature"]>, value: number) {
    setDraft((d) => {
      if (!d?.creature) return d;
      const creature = {
        ...d.creature,
        [key]: value,
        ...(key === "vidaMax" ? { vida: value } : {}),
        ...(key === "paMax" ? { pa: value } : {}),
      };
      return { ...d, creature };
    });
  }

  return (
    <section className="vtt-gm-creations">
      <h3 className="vtt-subtitle">Minhas fichas</h3>
      <p className="vtt-hint">
        Crie ou clone criaturas e NPCs. Só templates que você criou podem ser editados — fichas de
        jogadores e o compêndio permanecem somente leitura.
      </p>

      <div className="vtt-gm-creations__create">
        <label className="vtt-label">
          Nome
          <input
            className="vtt-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="vtt-label">
          Tipo
          <select
            className="vtt-input"
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as "creature" | "npc")}
            disabled={busy}
          >
            <option value="creature">Criatura (token de monstro)</option>
            <option value="npc">Personagem / NPC</option>
          </select>
        </label>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={handleCreateBlank}>
          Criar em branco
        </button>
      </div>

      <div className="vtt-gm-creations__clone">
        <p className="vtt-eyebrow">Clonar</p>
        <label className="vtt-label">
          Do compêndio
          <select
            className="vtt-input"
            value={cloneMonsterId}
            onChange={(e) => setCloneMonsterId(e.target.value)}
            disabled={busy}
          >
            {monsters.map((m) => (
              <option key={m.entryId} value={m.entryId}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={handleCloneMonster}>
          Clonar monstro
        </button>

        {cloneableActors.length > 0 ? (
          <>
            <label className="vtt-label">
              De personagem na mesa
              <select
                className="vtt-input"
                value={cloneActorId}
                onChange={(e) => setCloneActorId(e.target.value)}
                disabled={busy}
              >
                {cloneableActors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={handleCloneActor}>
              Clonar personagem
            </button>
          </>
        ) : null}
      </div>

      {list.length === 0 ? (
        <p className="vtt-hint">Nenhum template ainda.</p>
      ) : (
        <ul className="vtt-gm-creations__list">
          {list.map((item) => (
            <li key={item.id} className={item.id === selectedId ? "is-selected" : ""}>
              <button
                type="button"
                className="vtt-gm-creations__pick"
                onClick={() => setSelectedId(item.id)}
              >
                <span>{item.name}</span>
                <span className="vtt-gm-creations__badge">
                  {item.kind === "creature" ? "Criatura" : "NPC"}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                draggable
                onDragStart={(e) => {
                  writeGmCreationSpawnDrag(e.dataTransfer, { creationId: item.id });
                }}
                onClick={() => handleSpawn(item.id)}
                disabled={busy}
                title="Colocar no hex sob o cursor"
              >
                ⊕
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => handleDelete(item.id)}
                disabled={busy}
                title="Excluir template"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="vtt-gm-creations__editor">
          <p className="vtt-eyebrow">Editar template</p>
          <label className="vtt-label">
            Nome
            <input
              className="vtt-input"
              value={draft.name}
              onChange={(e) => updateDraftName(e.target.value)}
              disabled={busy}
            />
          </label>

          {draft.kind === "creature" && draft.creature ? (
            <div className="vtt-gm-creations__stats">
              {(
                [
                  ["vidaMax", "HP máx"],
                  ["paMax", "PA máx"],
                  ["defesa", "Defesa"],
                  ["walk", "Caminhada"],
                  ["run", "Corrida"],
                  ["forca", "Força"],
                  ["agilidade", "Agilidade"],
                  ["ameaca", "Ameaça"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="vtt-label">
                  {label}
                  <input
                    className="vtt-input"
                    type="number"
                    value={draft.creature![key]}
                    onChange={(e) => updateCreatureField(key, Number(e.target.value))}
                    disabled={busy}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {draft.kind === "npc" && draft.npc ? (
            <div className="vtt-gm-creations__stats">
              <label className="vtt-label">
                Nível
                <input
                  className="vtt-input"
                  type="number"
                  min={1}
                  value={draft.npc.identity.nivel}
                  onChange={(e) =>
                    setDraft((d) =>
                      d?.npc
                        ? {
                            ...d,
                            npc: {
                              ...d.npc,
                              identity: { ...d.npc.identity, nivel: Number(e.target.value) },
                            },
                          }
                        : d
                    )
                  }
                  disabled={busy}
                />
              </label>
              <label className="vtt-label">
                HP máx
                <input
                  className="vtt-input"
                  type="number"
                  value={draft.npc.resources.vida.max}
                  onChange={(e) => {
                    const max = Number(e.target.value);
                    setDraft((d) =>
                      d?.npc
                        ? {
                            ...d,
                            npc: {
                              ...d.npc,
                              resources: {
                                ...d.npc.resources,
                                vida: { max, value: max },
                              },
                            },
                          }
                        : d
                    );
                  }}
                  disabled={busy}
                />
              </label>
              <label className="vtt-label">
                Defesa
                <input
                  className="vtt-input"
                  type="number"
                  value={draft.npc.tactical.defesa}
                  onChange={(e) =>
                    setDraft((d) =>
                      d?.npc
                        ? {
                            ...d,
                            npc: {
                              ...d.npc,
                              tactical: { ...d.npc.tactical, defesa: Number(e.target.value) },
                            },
                          }
                        : d
                    )
                  }
                  disabled={busy}
                />
              </label>
            </div>
          ) : null}

          {draft.source.label ? <p className="vtt-hint">Origem: {draft.source.label}</p> : null}

          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={handleSave}>
            Salvar alterações
          </button>
        </div>
      ) : null}

      {msg ? <p className="vtt-hint vtt-gm-creations__msg">{msg}</p> : null}
    </section>
  );
}
