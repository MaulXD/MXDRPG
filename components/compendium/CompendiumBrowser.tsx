"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@/lib/auth/types";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import { CompendiumIcon } from "@/components/compendium/CompendiumIcon";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import { entryBookRef, entrySummary, stripHtml } from "@/lib/compendium/format";
import { compendiumTypeColor } from "@/lib/compendium/icons";
import "./compendium.css";

type Props = {
  packs: CompendiumPackMeta[];
  data: Record<CompendiumPackId, CompendiumEntry[]>;
  role: UserRole | null;
  /** Painel estreito da mesa (layout em lista, sem grid largo) */
  variant?: "page" | "rail";
};

export function CompendiumBrowser({ packs, data, role, variant = "page" }: Props) {
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

  if (variant === "rail") {
    return (
      <div className="comp-shell comp-shell--rail">
        <header className="comp-rail-head">
          <p className="vtt-eyebrow comp-rail-eyebrow">Compêndio</p>
          <div className="comp-rail-packs" role="tablist" aria-label="Pacotes">
            {packs.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === packId}
                className={`comp-rail-pack-chip${p.id === packId ? " active" : ""}`}
                onClick={() => onPickPack(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {activePack ? (
          <>
            <div className="comp-rail-toolbar">
              <input
                className="comp-search comp-search--rail"
                type="search"
                placeholder={`Buscar em ${activePack.label}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="comp-count">{entries.length}</span>
            </div>

            <div className="comp-rail-list">
              {entries.length === 0 ? (
                <p className="comp-rail-empty">Nenhuma entrada encontrada.</p>
              ) : (
                entries.map((entry) => (
                  <CompendiumCard
                    key={entry.id}
                    entry={entry}
                    active={entry.id === selectedId}
                    onSelect={() => setSelectedId(entry.id)}
                    layout="rail"
                  />
                ))
              )}
            </div>

            {selected ? <CompendiumDetail entry={selected} layout="rail" /> : null}
          </>
        ) : null}

        {role === "admin" ? (
          <p className="comp-rail-admin-hint">Monstros visíveis só para mestre.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="comp-shell comp-shell--page">
      <OrnamentCard className="comp-sidebar">
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
        {role === "admin" ? (
          <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Monstros visíveis só para mestre.
          </p>
        ) : null}
      </OrnamentCard>

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
                  layout="page"
                />
              ))}
            </div>

            {selected ? <CompendiumDetail entry={selected} layout="page" /> : null}
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
  layout = "page",
}: {
  entry: CompendiumEntry;
  active: boolean;
  onSelect: () => void;
  layout?: "page" | "rail";
}) {
  const tags = entrySummary(entry.system, entry.type);
  const color = compendiumTypeColor(entry.type);
  const tagLimit = layout === "rail" ? 4 : 3;

  return (
    <button
      type="button"
      className={`comp-card comp-card--${layout} ${active ? "active" : ""}`}
      onClick={onSelect}
    >
      <CompendiumIcon entry={entry} color={color} className="comp-icon" />
      <div className="comp-card-body">
        <h3>{entry.name}</h3>
        <div className="comp-card-tags">
          <span className="comp-tag">{entry.type}</span>
          {tags.slice(0, tagLimit).map((t) => (
            <span key={t} className="comp-tag">
              {t}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function CompendiumDetail({
  entry,
  layout = "page",
}: {
  entry: CompendiumEntry;
  layout?: "page" | "rail";
}) {
  const tags = entrySummary(entry.system, entry.type);
  const html = String(entry.system.description ?? "");
  const { catalogId, bookRef } = entryBookRef(entry.system);

  const color = compendiumTypeColor(entry.type);

  return (
    <OrnamentCard variant="parchment" className={`comp-detail comp-detail--${layout}`}>
      <p className="eyebrow">Detalhe</p>
      <div className="comp-detail-head">
        <CompendiumIcon entry={entry} color={color} className="comp-icon comp-detail-icon" />
        <h3>{entry.name}</h3>
      </div>
      {catalogId || bookRef ? (
        <p className="comp-detail-ref" style={{ fontSize: "0.78rem", color: "var(--text-dim)", margin: "0 0 0.65rem" }}>
          {catalogId ? <code>{catalogId}</code> : null}
          {catalogId && bookRef ? " · " : null}
          {bookRef ? <em>{bookRef}</em> : null}
        </p>
      ) : null}
      <div className="comp-tags" style={{ marginBottom: "1rem" }}>
        <span className="comp-tag">{entry.type}</span>
        {tags.map((t) => (
          <span key={t} className="comp-tag">
            {t}
          </span>
        ))}
      </div>
      <div className="comp-detail-body" dangerouslySetInnerHTML={{ __html: html }} />
      {layout === "page" ? (
        <p style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--text-dim)" }}>
          Fase 2: arrastar para ficha ou mesa.
        </p>
      ) : null}
    </OrnamentCard>
  );
}
