"use client";

import { SectionDivider } from "@/components/ui/SectionDivider";
import { classTraitsForLevel } from "@/lib/character/class-traits";

type Props = {
  classe: string;
  nivel: number;
};

/**
 * D-21 (a), BV-056: traços de classe do livro (Cap. 4) na aba Habilidades, só leitura.
 * Mostra só o que o personagem já tem no nível dele. Efeito na mesa continua caso a caso.
 */
export function ClassTraitsSection({ classe, nivel }: Props) {
  const tracos = classTraitsForLevel(classe, nivel);
  if (!tracos.length) return null;
  return (
    <section className="class-traits" aria-label={`Traços de classe: ${classe}`}>
      <SectionDivider title="Traços de classe" />
      <p className="class-traits__hint">Do livro, Cap. 4. Só leitura; o mestre aplica na mesa.</p>
      <ul className="class-traits__list">
        {tracos.map((t) => (
          <li key={t.nome} className="class-traits__item">
            <p className="class-traits__name">
              {t.nome}
              <span className="class-traits__level">nv {t.nivel}</span>
            </p>
            <p className="class-traits__text">{t.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
