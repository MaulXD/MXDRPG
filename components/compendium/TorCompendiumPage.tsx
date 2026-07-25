import {
  ARMOURS,
  CALLINGS,
  COMBAT_PROFICIENCY_LABEL,
  CULTURES,
  DISTINCTIVE_FEATURE_BY_ID,
  HELM,
  SHIELDS,
  SKILLS,
  STARTING_REWARDS,
  STARTING_VIRTUES,
  WEAPONS,
} from "@/lib/character/um-anel/data";
import { TOR_ADVERSARIES } from "@/lib/character/um-anel/adversaries";
import { TOR_BLESSINGS, TOR_CURSED_ITEMS, TOR_ENCHANTED_REWARDS, TOR_HOARD_TABLE } from "@/lib/character/um-anel/treasure";
import "./tor-compendium.css";

const ADVERSARY_TIER_LABEL: Record<string, string> = {
  mob: "Bando",
  elite: "Elite",
  boss: "Chefe",
};

export function TorCompendiumPage() {
  return (
    <div className="tor-compendium">
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
        <h2>Armas</h2>
        <table className="tor-compendium__table">
          <thead>
            <tr>
              <th>Arma</th>
              <th>Dano</th>
              <th>Ferimento</th>
              <th>Carga</th>
              <th>Proficiência</th>
            </tr>
          </thead>
          <tbody>
            {WEAPONS.map((w) => (
              <tr key={w.id}>
                <td>{w.label}</td>
                <td>{w.damage}</td>
                <td>{w.injury ?? "—"}</td>
                <td>{w.load}</td>
                <td>{w.proficiency === "brawling" ? "Desarmado" : COMBAT_PROFICIENCY_LABEL[w.proficiency]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Armaduras e Escudos</h2>
        <table className="tor-compendium__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Proteção / Bloqueio</th>
              <th>Carga</th>
            </tr>
          </thead>
          <tbody>
            {[...ARMOURS, HELM].map((a) => (
              <tr key={a.id}>
                <td>{a.label}</td>
                <td>{a.protection}</td>
                <td>{a.load}</td>
              </tr>
            ))}
            {SHIELDS.map((s) => (
              <tr key={s.id}>
                <td>{s.label}</td>
                <td>+{s.parryModifier} Bloqueio</td>
                <td>{s.load}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

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
    </div>
  );
}
