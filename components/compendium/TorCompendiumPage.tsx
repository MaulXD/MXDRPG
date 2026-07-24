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
import "./tor-compendium.css";

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
                Resistência FOR+{c.enduranceBonus} · Esperança COR+{c.hopeBonus} · Aparar ARG+{c.parryBonus}
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
              <h3>{attr === "forca" ? "Força" : attr === "coracao" ? "Coração" : "Argúcia"}</h3>
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
              <th>Proteção / Aparar</th>
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
                <td>+{s.parryModifier} Aparar</td>
                <td>{s.load}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}
