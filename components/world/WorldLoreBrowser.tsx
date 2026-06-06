"use client";

import { useMemo, useState } from "react";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import {
  PLACE_KIND_LABEL,
  WORLD_PLACES,
  WORLD_REGIONS,
  placeCardTooltip,
  type PlaceKind,
  type WorldPlace,
} from "@/lib/world/lore";

const KIND_ORDER: PlaceKind[] = [
  "reino",
  "cidade",
  "vilarejo",
  "fortaleza",
  "torre",
  "santuario",
  "cenario",
  "rota",
];

function PlaceCard({ place }: { place: WorldPlace }) {
  const tip = placeCardTooltip(place);
  return (
    <article className="world-lore-card">
      <header className="world-lore-card__head">
        <WizardHoverTip text={tip}>
          <h3 className="world-lore-card__title">{place.name}</h3>
        </WizardHoverTip>
        <span className="world-lore-card__kind">{PLACE_KIND_LABEL[place.kind]}</span>
      </header>
      <p className="world-lore-card__summary">{place.summary}</p>
      <div className="world-lore-card__meta">
        {place.boca ? (
          <WizardHoverTip text={`Entrada do submundo: Boca ${place.boca}`}>
            <span>Boca {place.boca}</span>
          </WizardHoverTip>
        ) : null}
        {place.devotion ? (
          <WizardHoverTip text={`Cultos e templos comuns na região: ${place.devotion}`}>
            <span>{place.devotion}</span>
          </WizardHoverTip>
        ) : null}
        {place.population ? <span>{place.population}</span> : null}
      </div>
      {place.hooks?.length ? (
        <ul className="world-lore-card__hooks">
          {place.hooks.map((h) => (
            <li key={h}>
              <WizardHoverTip text={`Gancho de campanha: ${h}`}>{h}</WizardHoverTip>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function WorldLoreBrowser() {
  const [region, setRegion] = useState<string>("all");
  const [kind, setKind] = useState<PlaceKind | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORLD_PLACES.filter((p) => {
      if (region !== "all" && p.region !== region) return false;
      if (kind !== "all" && p.kind !== kind) return false;
      if (!q) return true;
      const blob = `${p.name} ${p.region} ${p.summary} ${p.lore} ${p.devotion ?? ""} ${p.boca ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [region, kind, query]);

  const byRegion = useMemo(() => {
    const map = new Map<string, WorldPlace[]>();
    for (const p of filtered) {
      const list = map.get(p.region) ?? [];
      list.push(p);
      map.set(p.region, list);
    }
    return map;
  }, [filtered]);

  return (
    <div className="world-lore">
      <div className="world-lore__filters">
        <label className="world-lore__filter">
          Buscar
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cidade, boca, deus…"
          />
        </label>
        <label className="world-lore__filter">
          Região
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="all">Todas</option>
            {WORLD_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="world-lore__filter">
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as PlaceKind | "all")}>
            <option value="all">Todos</option>
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {PLACE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="world-lore__hint">
        {filtered.length} lugares · passe o mouse no nome para lore completo, ganchos e contexto.
      </p>

      {[...byRegion.entries()].map(([reg, places]) => (
        <section key={reg} className="world-lore__region">
          <h2 className="world-lore__region-title">{reg}</h2>
          <div className="world-lore__grid">
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 ? (
        <p className="world-lore__empty">Nenhum lugar corresponde aos filtros.</p>
      ) : null}
    </div>
  );
}
