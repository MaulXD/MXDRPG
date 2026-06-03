"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@/lib/auth/types";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import { entrySummary, stripHtml } from "@/lib/compendium/format";
import "./compendium.css";

type Props = {
  packs: CompendiumPackMeta[];
  data: Record<CompendiumPackId, CompendiumEntry[]>;
  role: UserRole | null;
};

const TYPE_COLOR: Record<string, string> = {
  arma: "#ffc14d",
  habilidade: "#b8ff3c",
  magia: "#8b5cf6",
  equipamento: "#94a3be",
  npc: "#ff4d6d",
  character: "#00f5ff",
};

export function CompendiumBrowser({ packs, data, role }: Props) {
  const [packId, setPackId] = useState<CompendiumPackId>(packs[0]?.id ?? "armas");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activePack = packs.find((p) => p.id === packId) ?? packs[0];

  const entries = useMemo(() => {
    const list = data[packId] ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => {
      const desc = stripHtml(String(e.system.description ?? "")).toLowerCase();
      return e.name.toLowerCase().includes(q) || desc.includes(q);
    });
  }, [data, packId, query]);

  const selected = entries.find((e) => e.id === selectedId) ?? null;

  function onPickPack(id: CompendiumPackId) {
    setPackId(id);
    setSelectedId(null);
    setQuery("");
  }

  if (!packs.length) {
    return (
      <div className="comp-locked">
        <p>Nenhum compêndio disponível.</p>
        <Link href="/entrar">Entrar como mestre</Link>
      </div>
    );
  }

  return (
    <div className="comp-shell">
      <aside className="comp-sidebar glass">
        <p className="eyebrow">Compêndios</p>
        <ul className="comp-pack-list">
          {packs.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`comp-pack-btn ${p.id === packId ? "active" : ""}`}
                onClick={() => onPickPack(p.id)}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
        {role === "mestre" || role === "admin" ? (
          <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Monstros visíveis só para mestre.
          </p>
        ) : null}
      </aside>

      <div className="comp-main">
        {activePack ? (
          <>
            <p className="eyebrow">{activePack.label}</p>
            <h2 className="display-lg" style={{ fontSize: "1.75rem" }}>
              {activePack.label}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>{activePack.description}</p>

            <div className="comp-toolbar">
              <input
                className="comp-search"
                type="search"
                placeholder="Buscar por nome ou descrição…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="comp-count">{entries.length} entradas</span>
            </div>

            <div className="comp-grid">
              {entries.map((entry) => (
                <CompendiumCard
                  key={entry.id}
                  entry={entry}
                  active={entry.id === selectedId}
                  onSelect={() => setSelectedId(entry.id)}
                />
              ))}
            </div>

            {selected ? <CompendiumDetail entry={selected} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function CompendiumCard({
  entry,
  active,
  onSelect,
}: {
  entry: CompendiumEntry;
  active: boolean;
  onSelect: () => void;
}) {
  const tags = entrySummary(entry.system, entry.type);
  const color = TYPE_COLOR[entry.type] ?? "#00f5ff";

  return (
    <button type="button" className={`comp-card ${active ? "active" : ""}`} onClick={onSelect}>
      <div className="comp-icon" style={{ background: `${color}22`, color }}>
        {entry.name.charAt(0)}
      </div>
      <h3>{entry.name}</h3>
      <span className="comp-tag">{entry.type}</span>
      {tags.slice(0, 3).map((t) => (
        <span key={t} className="comp-tag">
          {t}
        </span>
      ))}
    </button>
  );
}

function CompendiumDetail({ entry }: { entry: CompendiumEntry }) {
  const tags = entrySummary(entry.system, entry.type);
  const html = String(entry.system.description ?? "");

  return (
    <article className="comp-detail">
      <p className="eyebrow">Detalhe</p>
      <h3>{entry.name}</h3>
      <div className="comp-tags" style={{ marginBottom: "1rem" }}>
        <span className="comp-tag">{entry.type}</span>
        {tags.map((t) => (
          <span key={t} className="comp-tag">
            {t}
          </span>
        ))}
      </div>
      <div className="comp-detail-body" dangerouslySetInnerHTML={{ __html: html }} />
      <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--text-dim)" }}>
        Fase 2: arrastar para ficha ou mesa.
      </p>
    </article>
  );
}
