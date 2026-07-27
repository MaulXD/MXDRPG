"use client";

import { useState } from "react";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import {
  ARMOURS,
  CALLINGS,
  COMBAT_PROFICIENCY_LABEL,
  CULTURES,
  CULTURE_BY_ID,
  DISTINCTIVE_FEATURE_BY_ID,
  HELM,
  SHIELDS,
  SKILLS,
  STARTING_REWARDS,
  STARTING_VIRTUES,
  WEAPONS,
} from "@/lib/character/um-anel/data";
import { TOR_ADVERSARIES, TOR_ADVERSARY_BY_ID } from "@/lib/character/um-anel/adversaries";
import { TOR_BLESSINGS, TOR_CURSED_ITEMS, TOR_ENCHANTED_REWARDS, TOR_HOARD_TABLE } from "@/lib/character/um-anel/treasure";
import { TOR_CULTURAL_VIRTUES_BY_CULTURE } from "@/lib/character/um-anel/cultural-virtues";
import { TOR_UNDERTAKINGS } from "@/lib/character/um-anel/undertakings";
import { TOR_PATRONS } from "@/lib/character/um-anel/patrons";
import { TOR_NOTABLE_NPCS } from "@/lib/character/um-anel/notable-npcs";
import {
  TOR_NAMELESS_ATTACK_FORMS,
  TOR_NAMELESS_BEFORE_SEEN,
  TOR_NAMELESS_CHARACTERISTICS,
  TOR_NAMELESS_FEAT_NAMES,
  TOR_NAMELESS_FELL_ABILITIES,
  TOR_NAMELESS_FEATURE,
  TOR_NAMELESS_FIRST_SEEN,
  TOR_NAMELESS_FORM,
  TOR_NAMELESS_KNOWN_BY,
  TOR_NAMELESS_LORE_SOURCES,
  TOR_NAMELESS_PLACE_SUFFIX,
  TOR_NAMELESS_RUMOURS,
} from "@/lib/character/um-anel/nameless-things";
import { TOR_LANDMARKS, TOR_LANDMARK_STRUCTURE } from "@/lib/character/um-anel/landmarks";
import { TOR_PREGEN_CHARACTERS } from "@/lib/character/um-anel/pregens";
import { attributeTN } from "@/lib/character/um-anel/rules";
import type { TorCombatProficiencyId } from "@/lib/character/um-anel/types";
import "@/components/compendium/compendium.css";
import "./tor-compendium.css";

const ADVERSARY_TIER_LABEL: Record<string, string> = {
  mob: "Bando",
  elite: "Elite",
  boss: "Chefe",
};

type CategoryId = "personagem" | "equipamento" | "adversarios" | "tesouro" | "companhia-mundo" | "pre-gerados";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "personagem", label: "Personagem" },
  { id: "equipamento", label: "Equipamento" },
  { id: "adversarios", label: "Adversários" },
  { id: "tesouro", label: "Tesouro" },
  { id: "companhia-mundo", label: "Companhia & Mundo" },
  { id: "pre-gerados", label: "Personagens Prontos" },
];

function recordEntries(rec: Record<string, string>): string {
  return Object.entries(rec)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");
}

export function TorCompendiumPage() {
  const [active, setActive] = useState<CategoryId>("personagem");

  return (
    <div className="comp-shell comp-shell--page">
      <OrnamentCard className="comp-sidebar">
        <p className="eyebrow">Compêndios</p>
        <ul className="comp-pack-list">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`comp-pack-btn ${c.id === active ? "active" : ""}`}
                aria-current={c.id === active ? "page" : undefined}
                onClick={() => setActive(c.id)}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </OrnamentCard>

      <div className="comp-main tor-compendium">
        {active === "personagem" ? <PersonagemSection /> : null}
        {active === "equipamento" ? <EquipamentoSection /> : null}
        {active === "adversarios" ? <AdversariosSection /> : null}
        {active === "tesouro" ? <TesouroSection /> : null}
        {active === "companhia-mundo" ? <CompanhiaMundoSection /> : null}
        {active === "pre-gerados" ? <PreGeradosSection /> : null}
      </div>
    </div>
  );
}

function PersonagemSection() {
  return (
    <>
      <section>
        <h2>Culturas</h2>
        <div className="tor-compendium__grid">
          {CULTURES.map((c) => (
            <article key={c.id} className="tor-compendium__card">
              <h3>{c.name}</h3>
              <p className="tor-compendium__blessing">
                <strong>{c.blessingName}</strong> — {c.blessingText}
              </p>
              <p className="tor-compendium__meta">
                Resistência FOR+{c.enduranceBonus} · Esperança COR+{c.hopeBonus} · Bloqueio AST+{c.parryBonus}
              </p>
              <p className="tor-compendium__meta">
                Traços: {c.distinctiveFeatureOptions.map((id) => DISTINCTIVE_FEATURE_BY_ID[id]?.label).join(", ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Vocações</h2>
        <div className="tor-compendium__grid">
          {CALLINGS.map((c) => {
            const trait = DISTINCTIVE_FEATURE_BY_ID[c.traitId];
            return (
              <article key={c.id} className="tor-compendium__card">
                <h3>{c.name}</h3>
                <p className="tor-compendium__blessing">
                  <strong>{trait?.label}</strong> — {trait?.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Perícias</h2>
        <div className="tor-compendium__attrs">
          {(["forca", "coracao", "argucia"] as const).map((attr) => (
            <div key={attr}>
              <h3>{attr === "forca" ? "Força" : attr === "coracao" ? "Coração" : "Astúcia"}</h3>
              <ul>
                {SKILLS.filter((s) => s.group === attr).map((s) => (
                  <li key={s.id}>{s.label}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Proficiências de Combate</h2>
        <ul className="tor-compendium__inline-list">
          {Object.values(COMBAT_PROFICIENCY_LABEL).map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Recompensas &amp; Virtudes iniciais</h2>
        <div className="tor-compendium__grid">
          {STARTING_REWARDS.map((r) => (
            <article key={r.id} className="tor-compendium__card">
              <h3>{r.label}</h3>
              <p>{r.description}</p>
            </article>
          ))}
          {STARTING_VIRTUES.map((v) => (
            <article key={v.id} className="tor-compendium__card">
              <h3>{v.label}</h3>
              <p>{v.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Virtudes Culturais</h2>
        <p className="tor-compendium__lead">
          Escolhidas no lugar de uma Virtude comum ao ganhar graduação de Sabedoria (a partir de Sabedoria 2),
          só da própria Cultura do herói.
        </p>
        <div className="tor-compendium__grid">
          {CULTURES.map((c) => (
            <article key={c.id} className="tor-compendium__card">
              <h3>{c.name}</h3>
              <ul className="tor-compendium__blessing-list">
                {(TOR_CULTURAL_VIRTUES_BY_CULTURE[c.id] ?? []).map((v) => (
                  <li key={v.id}>
                    <strong>{v.name}:</strong> {v.description}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function EquipamentoSection() {
  return (
    <>
      <section>
        <h2>Armas</h2>
        <div className="tor-compendium__grid">
          {WEAPONS.map((w) => {
            const handedness = w.twoHanded
              ? "Só 2 mãos"
              : w.twoHandedOptional
                ? "1 ou 2 mãos"
                : null;
            const flair = [
              w.thrown ? "Arremessável" : null,
              w.ranged ? "À distância" : null,
              handedness,
            ]
              .filter(Boolean)
              .join(" · ");
            const tip = [w.notes, flair].filter(Boolean).join(" — ");
            return (
              <article
                key={w.id}
                className="tor-compendium__card"
                data-site-tip={tip || undefined}
              >
                <h3>{w.label}</h3>
                <p className="tor-compendium__meta">
                  Dano {w.damage} · Ferimento {w.injury ?? "—"} · Carga {w.load}
                </p>
                <p className="tor-compendium__meta">
                  {w.proficiency === "brawling" ? "Desarmado" : COMBAT_PROFICIENCY_LABEL[w.proficiency]}
                  {flair ? ` · ${flair}` : ""}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2>Armaduras e Escudos</h2>
        <div className="tor-compendium__grid">
          {[...ARMOURS, HELM].map((a) => (
            <article
              key={a.id}
              className="tor-compendium__card"
              data-site-tip={a.removable ? "Pode ser retirado sem tirar o resto da armadura." : undefined}
            >
              <h3>{a.label}</h3>
              <p className="tor-compendium__meta">
                Proteção {a.protection} · Carga {a.load}
              </p>
            </article>
          ))}
          {SHIELDS.map((s) => (
            <article key={s.id} className="tor-compendium__card">
              <h3>{s.label}</h3>
              <p className="tor-compendium__meta">
                +{s.parryModifier} Bloqueio · Carga {s.load}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AdversariosSection() {
  return (
    <>
      <section>
        <h2>Adversários</h2>
        <div className="tor-compendium__grid">
          {TOR_ADVERSARIES.map((a) => (
            <article key={a.id} className="tor-compendium__card">
              <h3>
                {a.name} <span className="tor-compendium__tier">{ADVERSARY_TIER_LABEL[a.tier] ?? a.tier}</span>
              </h3>
              {a.traits ? <p className="tor-compendium__blessing">{a.traits}</p> : null}
              <p className="tor-compendium__meta">
                Nível de Atributo {a.attributeLevel} · Resistência {a.endurance} · Vigor {a.might} ·{" "}
                {a.hateKind === "hate" ? "Ódio" : "Resolução"} {a.hate} · Bloqueio {a.parry || "—"} · Proteção{" "}
                {a.armour}d
              </p>
              <p className="tor-compendium__meta">
                Proficiências:{" "}
                {a.actions
                  .map((act) => `${act.label} ${act.rating} (${act.damage}/${act.injury}${act.specialDamage ? `, ${act.specialDamage.join(", ")}` : ""})`)
                  .join(" · ")}
              </p>
              {a.fellAbilities?.length ? (
                <p className="tor-compendium__meta">
                  Habilidades Sinistras: {a.fellAbilities.map((f) => f.name).join(", ")}
                </p>
              ) : null}
              {a.description ? <p>{a.description}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Coisas Sem Nome (gerador do Mestre)</h2>
        <p className="tor-compendium__lead">
          Sistema pra criar um adversário único e formidável — o Mestre rola pra montar identidade e
          estatísticas. Todas têm Medo do Fogo e Odeia a Luz do Sol, iguais aos Orcs.
        </p>

        <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>Identidade e história (Tabelas 1-5)</h3>
        <div className="tor-compendium__grid" style={{ marginBottom: "1.25rem" }}>
          <article className="tor-compendium__card">
            <h3>1. Como é Chamada</h3>
            <p className="tor-compendium__meta">Nome (Proeza): {recordEntries(TOR_NAMELESS_FEAT_NAMES)}</p>
            <p className="tor-compendium__meta">Lugar (Sucesso): {recordEntries(TOR_NAMELESS_PLACE_SUFFIX as unknown as Record<string, string>)}</p>
            <p className="tor-compendium__meta">Conhecida por (Sucesso): {recordEntries(TOR_NAMELESS_KNOWN_BY as unknown as Record<string, string>)}</p>
          </article>
          <article className="tor-compendium__card">
            <h3>2. Pode Ser Descrita Como…</h3>
            <p className="tor-compendium__meta">Forma (Proeza): {recordEntries(TOR_NAMELESS_FORM)}</p>
            <p className="tor-compendium__meta">Traço (Sucesso): {recordEntries(TOR_NAMELESS_FEATURE as unknown as Record<string, string>)}</p>
          </article>
          <article className="tor-compendium__card">
            <h3>3. No Primeiro Encontro</h3>
            <ul className="tor-compendium__blessing-list">
              {Object.entries(TOR_NAMELESS_BEFORE_SEEN).map(([k, v]) => (
                <li key={k}>
                  <strong>Antes de ver ({k}):</strong> {v}
                </li>
              ))}
            </ul>
            <ul className="tor-compendium__blessing-list" style={{ marginTop: "0.4rem" }}>
              {Object.entries(TOR_NAMELESS_FIRST_SEEN).map(([k, v]) => (
                <li key={k}>
                  <strong>O que vê primeiro ({k}):</strong> {v}
                </li>
              ))}
            </ul>
          </article>
          <article className="tor-compendium__card">
            <h3>4. Um Boato Sobre a Coisa</h3>
            <ul className="tor-compendium__blessing-list">
              {Object.entries(TOR_NAMELESS_RUMOURS).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {v}
                </li>
              ))}
            </ul>
          </article>
          <article className="tor-compendium__card">
            <h3>5. Onde É Lembrada</h3>
            <ul className="tor-compendium__blessing-list">
              {Object.entries(TOR_NAMELESS_LORE_SOURCES).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {v}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>Estatísticas (Tabelas 6-8)</h3>
        <table className="tor-compendium__table">
          <thead>
            <tr>
              <th>Proeza</th>
              <th>Nível de Atributo / Ódio</th>
              <th>Proteção</th>
              <th>Bloqueio</th>
              <th>Resistência</th>
              <th>Vigor</th>
              <th>Proficiência</th>
              <th>Nº Habilidades</th>
            </tr>
          </thead>
          <tbody>
            {TOR_NAMELESS_CHARACTERISTICS.map((row) => (
              <tr key={row.roll}>
                <td>{row.roll}</td>
                <td>{row.attributeLevelAndHate}</td>
                <td>{row.armour}</td>
                <td>{row.parry}</td>
                <td>{row.endurance}</td>
                <td>{row.might}</td>
                <td>{row.combatProficiency}</td>
                <td>{row.fellAbilityCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tor-compendium__meta" style={{ marginTop: "0.5rem" }}>
          Formas de ataque (role 2×): {TOR_NAMELESS_ATTACK_FORMS.map((f) => `${f.name} (${f.damage}/${f.injury}, ${f.specialDamage})`).join(" · ")}
        </p>
        <div className="tor-compendium__grid" style={{ marginTop: "0.75rem" }}>
          {TOR_NAMELESS_FELL_ABILITIES.map((f) => (
            <article key={f.roll} className="tor-compendium__card">
              <h3>
                {f.name} <span className="tor-compendium__tier">{f.roll}</span>
              </h3>
              <p>{f.effect}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function TesouroSection() {
  return (
    <>
      <section>
        <h2>Tesouro</h2>
        <table className="tor-compendium__table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Exemplos</th>
              <th>Valor de Tesouro</th>
              <th>Rolagens de Tesouro Mágico</th>
            </tr>
          </thead>
          <tbody>
            {TOR_HOARD_TABLE.map((h) => (
              <tr key={h.id}>
                <td>{h.label}</td>
                <td>{h.examples}</td>
                <td>{h.treasureValue}</td>
                <td>{h.magicalTreasureRolls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Bênçãos (Artefatos Maravilhosos &amp; Itens Prodigiosos)</h2>
        <p className="tor-compendium__lead">
          Um Artefato Maravilhoso tem 1 Bênção, um Item Prodigioso tem 2 — role um Dado de Sucesso pra categoria,
          outro pra Perícia dentro dela. O portador ganha (2d) em rolagens dessa Perícia, com sucesso Mágico.
        </p>
        <div className="tor-compendium__grid">
          {TOR_BLESSINGS.map((cat) => (
            <article key={cat.id} className="tor-compendium__card">
              <h3>{cat.label}</h3>
              <ul className="tor-compendium__blessing-list">
                {cat.entries.map((e) => (
                  <li key={e.rollRange}>
                    <strong>{e.rollRange}:</strong> {e.skill}{" "}
                    <span className="tor-compendium__meta">({e.suggestedItems})</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Recompensas Encantadas (Armas &amp; Armaduras Famosas)</h2>
        <p className="tor-compendium__lead">
          Máx. 3 qualidades por item (Recompensas comuns ou Encantadas), mín. 1 Recompensa Encantada.
        </p>
        <div className="tor-compendium__grid">
          {TOR_ENCHANTED_REWARDS.map((r) => (
            <article key={r.id} className="tor-compendium__card">
              <h3>{r.name}</h3>
              <p className="tor-compendium__meta">
                {r.craftsmanship} · {r.item}
                {r.special ? ` · ${r.special}` : ""}
              </p>
              <p>{r.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Itens Amaldiçoados</h2>
        <div className="tor-compendium__grid">
          {TOR_CURSED_ITEMS.map((c) => (
            <article key={c.id} className="tor-compendium__card">
              <h3>{c.name}</h3>
              <p>{c.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function CompanhiaMundoSection() {
  return (
    <>
      <section>
        <h2>Empreitadas da Fase de Companhia</h2>
        <p className="tor-compendium__lead">
          Numa Fase comum, a Companhia escolhe 1 + 1 grátis (se tiver o Chamado correspondente). Numa Fase de
          Yule (fim de ano), cada jogador escolhe 1.
        </p>
        <div className="tor-compendium__grid">
          {TOR_UNDERTAKINGS.map((u) => (
            <article key={u.id} className="tor-compendium__card">
              <h3>
                {u.name}
                {u.yuleOnly ? <span className="tor-compendium__tier">Só Yule</span> : null}
                {u.freeForCallingId ? (
                  <span className="tor-compendium__tier">Grátis: {CALLINGS.find((c) => c.id === u.freeForCallingId)?.name}</span>
                ) : null}
              </h3>
              <p>{u.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Patronos</h2>
        <p className="tor-compendium__lead">
          Escolhidos como Patrono principal da Companhia via a Empreitada Encontrar Patrono.
        </p>
        <div className="tor-compendium__grid">
          {TOR_PATRONS.map((p) => (
            <article key={p.id} className="tor-compendium__card">
              <h3>{p.name}</h3>
              <p className="tor-compendium__meta">
                {p.roles} · {p.distinctiveFeatures.join(", ")} · Nível de Companhia +{p.fellowshipBonus}
              </p>
              <p>{p.description}</p>
              <p className="tor-compendium__blessing">
                <strong>{p.advantageName}</strong> — {p.advantageText}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>PNJs Notáveis de Valfenda</h2>
        <p className="tor-compendium__lead">
          Diferente dos Patronos, não têm bônus de Companhia formal (exceto Elrond, listado acima) —
          referência de mesa pro Mestre.
        </p>
        <div className="tor-compendium__grid">
          {TOR_NOTABLE_NPCS.map((n) => (
            <article key={n.id} className="tor-compendium__card">
              <h3>{n.name}</h3>
              <p className="tor-compendium__meta">
                {n.roles} · {n.distinctiveFeatures.join(", ")}
              </p>
              <p>{n.description}</p>
              {n.specialRule ? <p className="tor-compendium__blessing">{n.specialRule}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Marcos</h2>
        <p className="tor-compendium__lead">
          Cenários jogáveis auto-contidos, sem plot predeterminado — o Mestre usa Jornada pra levar a
          Companhia até lá, depois conduz a exploração livremente com as regras normais.
        </p>
        <div className="tor-compendium__grid" style={{ marginBottom: "1.25rem" }}>
          {TOR_LANDMARK_STRUCTURE.map((s) => (
            <article key={s.step} className="tor-compendium__card">
              <h3>
                {s.step}. {s.name}
              </h3>
              <p>{s.description}</p>
            </article>
          ))}
        </div>
        {TOR_LANDMARKS.map((l) => {
          const adversary = l.adversaryId ? TOR_ADVERSARY_BY_ID[l.adversaryId] : undefined;
          return (
            <article key={l.id} className="tor-compendium__card" style={{ marginBottom: "1rem" }}>
              <h3>{l.name}</h3>
              <p className="tor-compendium__blessing">
                <strong>Boato:</strong> {l.rumour}
              </p>
              <p>
                <strong>Saber Antigo:</strong> {l.oldLore}
              </p>
              <p>
                <strong>Antecedentes:</strong> {l.background}
              </p>
              <p>
                <strong>Locais:</strong> {l.locations}
              </p>
              {adversary ? (
                <p className="tor-compendium__meta">
                  Adversária: {adversary.name} — Nível de Atributo {adversary.attributeLevel} · Resistência{" "}
                  {adversary.endurance} · Ódio {adversary.hate} · Bloqueio {adversary.parry} · Proteção{" "}
                  {adversary.armour}d
                </p>
              ) : null}
              <ul className="tor-compendium__blessing-list">
                {l.schemesAndTrouble.map((s) => (
                  <li key={s.name}>
                    <strong>{s.name}:</strong> {s.text}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </>
  );
}

function PreGeradosSection() {
  return (
    <section>
      <h2>Personagens Pré-Gerados (Starter Set)</h2>
      <p className="tor-compendium__lead">
        Os 8 heróis prontos-pra-jogar do Starter Set — use pra começar uma mesa sem passar pelo assistente
        de criação.
      </p>
      <div className="tor-compendium__grid">
        {TOR_PREGEN_CHARACTERS.map((p) => (
          <article key={p.id} className="tor-compendium__card">
            <h3>
              {p.name} <span className="tor-compendium__tier">{CULTURE_BY_ID[p.culture]?.name}</span>
            </h3>
            <p className="tor-compendium__meta">
              {p.age} anos · Traços: {p.distinctiveFeatureIds.map((id) => DISTINCTIVE_FEATURE_BY_ID[id]?.label).join(", ")}
            </p>
            <p className="tor-compendium__meta">
              Força {p.attributes.forca} (NA {attributeTN(p.attributes.forca)}) · Coração {p.attributes.coracao} (NA{" "}
              {attributeTN(p.attributes.coracao)}) · Astúcia {p.attributes.argucia} (NA{" "}
              {attributeTN(p.attributes.argucia)})
            </p>
            <p className="tor-compendium__meta">
              Resistência {p.endurance} · Esperança {p.hope} · Bloqueio {p.parry} · Valor {p.valour} · Sabedoria{" "}
              {p.wisdom}
            </p>
            <p className="tor-compendium__meta">
              Perícias:{" "}
              {SKILLS.filter((s) => p.skills[s.id] > 0)
                .map((s) => `${s.label} ${p.skills[s.id]}${p.favouredSkills.includes(s.id) ? " (Favorecida)" : ""}`)
                .join(" · ")}
            </p>
            <p className="tor-compendium__meta">
              Proficiências:{" "}
              {(Object.keys(p.combatProficiencies) as TorCombatProficiencyId[])
                .filter((id) => p.combatProficiencies[id] > 0)
                .map((id) => `${COMBAT_PROFICIENCY_LABEL[id]} ${p.combatProficiencies[id]}`)
                .join(" · ") || "—"}
            </p>
            {p.rewards.length ? <p className="tor-compendium__meta">Recompensas: {p.rewards.join("; ")}</p> : null}
            {p.virtues.length ? (
              <ul className="tor-compendium__blessing-list">
                {p.virtues.map((v, i) => (
                  <li key={i}>
                    <strong>{v.name}:</strong> {v.text}
                  </li>
                ))}
              </ul>
            ) : null}
            {p.warGear.length ? (
              <p className="tor-compendium__meta">
                Equipamento de Guerra:{" "}
                {p.warGear
                  .map((w) => `${w.name} (Dano ${w.damage}/Ferimento ${w.injury}/Carga ${w.load}${w.notes ? `, ${w.notes}` : ""})`)
                  .join(" · ")}
              </p>
            ) : null}
            {p.armour ? (
              <p className="tor-compendium__meta">
                Armadura: {p.armour.name} (Proteção {p.armour.protection}, Carga {p.armour.load})
              </p>
            ) : null}
            {p.shield ? (
              <p className="tor-compendium__meta">
                Escudo: {p.shield.name} (+{p.shield.parryBonus} Bloqueio, Carga {p.shield.load})
              </p>
            ) : null}
            <p className="tor-compendium__meta">Equipamento de Viagem: {p.travellingGear}</p>
            <p className="tor-compendium__blessing">
              <em>&ldquo;{p.quote}&rdquo;</em>
            </p>
            <p>{p.background}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
