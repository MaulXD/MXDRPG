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
import { TOR_ADVERSARIES } from "@/lib/character/um-anel/adversaries";
import { TOR_BLESSINGS, TOR_CURSED_ITEMS, TOR_ENCHANTED_REWARDS, TOR_HOARD_TABLE } from "@/lib/character/um-anel/treasure";
import { TOR_CULTURAL_VIRTUES_BY_CULTURE } from "@/lib/character/um-anel/cultural-virtues";
import { TOR_UNDERTAKINGS } from "@/lib/character/um-anel/undertakings";
import { TOR_PATRONS } from "@/lib/character/um-anel/patrons";
import { TOR_NOTABLE_NPCS } from "@/lib/character/um-anel/notable-npcs";
import {
  TOR_NAMELESS_ATTACK_FORMS,
  TOR_NAMELESS_CHARACTERISTICS,
  TOR_NAMELESS_FELL_ABILITIES,
} from "@/lib/character/um-anel/nameless-things";
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
        <h2>Coisas Sem Nome (gerador do Mestre)</h2>
        <p className="tor-compendium__lead">
          Sistema pra criar um adversário único e formidável — o Mestre rola pra montar identidade e
          estatísticas. Todas têm Medo do Fogo e Odeia a Luz do Sol, iguais aos Orcs.
        </p>
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
              {n.specialRule ? (
                <p className="tor-compendium__blessing">{n.specialRule}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
