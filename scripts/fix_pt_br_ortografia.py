#!/usr/bin/env python3
"""Revisão ortográfica PT-BR em Markdown/Python (preserva blocos ``` e chaves técnicas)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Ordem: expressões mais longas primeiro
REPLACEMENTS: list[tuple[str, str]] = [
    ("Propriedades magicas", "Propriedades mágicas"),
    ("propriedades magicas", "propriedades mágicas"),
    ("Forja Magica", "Forja Mágica"),
    ("forja magica", "forja mágica"),
    ("Forja magica", "Forja mágica"),
    ("CA magica", "CA mágica"),
    ("ca magica", "ca mágica"),
    ("Armas Organicas", "Armas Orgânicas"),
    ("armas organicas", "armas orgânicas"),
    ("Arma organica", "Arma orgânica"),
    ("arma organica", "arma orgânica"),
    ("Catalogo de Armas Organicas", "Catálogo de Armas Orgânicas"),
    ("Catalogo de Armas", "Catálogo de Armas"),
    ("REFERENCIA RAPIDA", "REFERÊNCIA RÁPIDA"),
    ("referencia rapida", "referência rápida"),
    ("Assimilacao por especime", "Assimilação por espécime"),
    ("# CATALOGO —", "# CATÁLOGO —"),
    ("| Usó ", "| Uso "),
    ("| usó ", "| uso "),
    ("Usó ", "Uso "),
    ("usó ", "uso "),
    ("Ossó", "Osso"),
    (" bônus anterior", " bônus anterior"),
    ("bonus anterior", "bônus anterior"),
    ("culinario", "culinário"),
    ("Secao ", "Seção "),
    ("controlavel", "controlável"),
    ("temporaria", "temporária"),
    (" acao ", " ação "),
    ("acao bonus", "ação bônus"),
    ("propria ", "própria "),
    ("Absorcao", "Absorção"),
    ("Ferrao", "Ferrão"),
    ("lamina", "lâmina"),
    (" tem um ", " têm um "),
    ("MUNICAO E POCOES", "MUNIÇÃO E POÇÕES"),
    ("MUNICAO ", "MUNIÇÃO "),
    ("POCOES ", "POÇÕES "),
    ("Convencao de ID", "Convenção de ID"),
    ("Convencao de prefixos", "Convenção de prefixos"),
    ("Indice geral", "Índice geral"),
    ("Cacador", "Caçador"),
    ("Caca ", "Caça "),
    ("Repeticao", "Repetição"),
    ("Aneis", "Anéis"),
    ("Gibao", "Gibão"),
    ("Arnes ", "Arnês "),
    ("Forca ", "Força "),
    ("Resistencia", "Resistência"),
    ("Clarividencia", "Clarividência"),
    ("Percepcao", "Percepção"),
    ("Tonico", "Tônico"),
    ("Estomago", "Estômago"),
    ("Essencia", "Essência"),
    ("Lendario", "Lendário"),
    ("padrao", "padrão"),
    ("organico", "orgânico"),
    ("Infusao", "Infusão"),
    ("resistencia", "resistência"),
    ("Lentidao", "Lentidão"),
    ("Penetrante", "Penetrante"),
    ("CAPITULO ", "CAPÍTULO "),
    ("Capitulo ", "Capítulo "),
    ("Contagio Necrotico", "Contágio Necrótico"),
    ("contagio necrotico", "contágio necrótico"),
    ("Regeneracao Biomagica", "Regeneração Biomágica"),
    ("regeneracao biomagica", "regeneração biomágica"),
    ("Grande Transmutacao Biomagica", "Grande Transmutação Biomágica"),
    ("Transmutacao de Carne", "Transmutação de Carne"),
    ("Animacao de Mortos", "Animação de Mortos"),
    ("Biomancia Suprema — Transcendencia", "Biomancia Suprema — Transcendência"),
    ("Fermentacao Acelerada", "Fermentação Acelerada"),
    ("Gelo de Conservacao", "Gelo de Conservação"),
    ("Preservacao Perfeita", "Preservação Perfeita"),
    ("Preservacao Anual", "Preservação Anual"),
    ("Ilusao Menor", "Ilusão Menor"),
    ("Invisibilidade Maior", "Invisibilidade Maior"),
    ("Envelhecer Materia", "Envelhecer Matéria"),
    ("Calor de Panela", "Calor de Panela"),
    ("Catalogo tesouros", "Catálogo tesouros"),
    ("Catalogo cenario", "Catálogo cenário"),
    ("Catalogo forja", "Catálogo forja"),
    ("lista completa no catalogo", "lista completa no catálogo"),
    ("no catalogo", "no catálogo"),
    ("documentacao", "documentação"),
    ("Convencao de prefixos", "Convenção de prefixos"),
    ("Especime canonico", "Espécime canônico"),
    ("Assimilacao por especime", "Assimilação por espécime"),
    ("bioma tipico", "bioma típico"),
    ("Bioma tipico", "Bioma típico"),
    ("Plataforma Flutuante (magica)", "Plataforma Flutuante (mágica)"),
    ("Objetos de cenario", "Objetos de cenário"),
    ("cenario global", "cenário global"),
    ("Recurso economico", "Recurso econômico"),
    ("Habilidade tatica", "Habilidade tática"),
    ("Habilidade assimilada", "Habilidade assimilada"),
    ("Divisao do material", "Divisão do material"),
    ("assimilacao **por especime**", "assimilação **por espécime**"),
    ("bestiario", "bestiário"),
    ("canonicos", "canônicos"),
    ("canonicas", "canônicas"),
    ("Catalogo tecnico", "Catálogo técnico"),
    ("catalogo tecnico", "catálogo técnico"),
    ("no compendio", "no compêndio"),
    ("Compendio VTT", "Compêndio VTT"),
    ("compendium armas", "compêndio armas"),
    ("automacao completa", "automação completa"),
    ("sem automacao", "sem automação"),
    ("Necrotico /", "Necrótico /"),
    ("necrotico", "necrótico"),
    ("necrotica", "necrótica"),
    ("petrificacao", "petrificação"),
    ("Petrificacao", "Petrificação"),
    ("assimilacao", "assimilação"),
    ("Assimilacao", "Assimilação"),
    ("especime", "espécime"),
    ("Especime", "Espécime"),
    ("Catalogo", "Catálogo"),
    ("catalogo", "catálogo"),
    ("magica", "mágica"),
    ("magicas", "mágicas"),
    ("organicas", "orgânicas"),
    ("Organicas", "Orgânicas"),
    ("Organica", "Orgânica"),
    ("organica", "orgânica"),
    ("Minerio", "Minério"),
    ("minerio", "minério"),
    ("Pocao", "Poção"),
    ("pocao", "poção"),
    ("Municao", "Munição"),
    ("municao", "munição"),
    ("Lanca ", "Lança "),
    ("Lanca/", "Lança/"),
    ("lanca ", "lança "),
    ("Artifice", "Artífice"),
    ("artifice", "artífice"),
    ("Clerigo", "Clérigo"),
    ("clerigo", "clérigo"),
    ("barbaro", "bárbaro"),
    ("Barbaro", "Bárbaro"),
    ("Raca", "Raça"),
    ("raca ", "raça "),
    ("inventario", "inventário"),
    ("Dominio", "Domínio"),
    ("dominio", "domínio"),
    ("tecnico", "técnico"),
    ("tatica", "tática"),
    ("Tatica", "Tática"),
    ("critico", "crítico"),
    ("criticos", "críticos"),
    ("Critico", "Crítico"),
    ("acido", "ácido"),
    ("Acido", "Ácido"),
    ("Relampago", "Relâmpago"),
    ("relampago", "relâmpago"),
    ("Ignicao", "Ignição"),
    ("ignicao", "ignição"),
    ("Quelicera", "Quelícera"),
    ("quelicera", "quelícera"),
    ("glandula", "glândula"),
    ("mandibula", "mandíbula"),
    ("seculos", "séculos"),
    ("existencia", "existência"),
    ("Escorpiao", "Escorpião"),
    ("escorpiao", "escorpião"),
    ("Dragao", "Dragão"),
    ("dragao", "dragão"),
    ("Femur", "Fêmur"),
    ("femur", "fêmur"),
    ("Lamina ", "Lâmina "),
    ("Lamina de", "Lâmina de"),
    ("Maca ", "Maça "),
    ("Maca de", "Maça de"),
    ("apos ", "após "),
    ("estao", "estão"),
    ("exposicao", "exposição"),
    ("condicoes", "condições"),
    ("Preco:", "Preço:"),
    ("Preco ", "Preço "),
    ("preco", "preço"),
    ("maximo", "máximo"),
    ("Criacao:", "Criação:"),
    ("Criacao", "Criação"),
    ("Degradacao:", "Degradação:"),
    ("Degradacao", "Degradação"),
    ("Manutencao:", "Manutenção:"),
    ("Manutencao", "Manutenção"),
    ("Evolucao:", "Evolução:"),
    ("Evolucao", "Evolução"),
    ("disponiveis", "disíponíveis"),
    ("Transcendencia", "Transcendência"),
    ("Regeneracao", "Regeneração"),
    ("regeneracao", "regeneração"),
    ("Animacao", "Animação"),
    ("animacao", "animação"),
    ("Harmonizacao", "Harmonização"),
    ("harmonizacao", "harmonização"),
    ("Mutacao", "Mutação"),
    ("mutacao", "mutação"),
    ("Respiracao", "Respiração"),
    ("respiracao", "respiração"),
    ("Aromatico", "Aromático"),
    ("aromatico", "aromático"),
    ("Carapaca", "Carapaça"),
    ("carapaca", "carapaça"),
    ("portatil", "portátil"),
    ("Portatil", "Portátil"),
    ("unico ", "único "),
    ("unico.", "único."),
    (" nao ", " não "),
    ("**nao**", "**não**"),
    ("voce ", "você "),
    ("Voce ", "Você "),
    ("ate ", "até "),
    ("proximo", "próximo"),
    ("duracao", "duração"),
    ("padrao", "padrão"),
    ("simbolico", "simbólico"),
    ("provocacao", "provocação"),
    ("intimidacao", "intimidação"),
    ("Enganacao", "Enganação"),
    ("enganacao", "enganação"),
    ("imunidade", "imunidade"),
    ("doencas", "doenças"),
    ("venenos", "venenos"),
    ("lentidao", "lentidão"),
    ("surpresa", "surpresa"),
    ("saving throw", "teste de resistência"),
    (" · save", " · teste"),
    ("fog of war", "névoa de guerra"),
    ("Roadmap", "Roteiro"),
    ("virtual tabletop", "mesa virtual"),
]

# Reverter falsos positivos em IDs / slugs / nomes de arquivo
REVERT_IN_BACKTICKS = [
    (r"Catalógo", "CATALOGO"),
    (r"catálago", "catalogo"),
]

SKIP_LINE_MARKERS = (
    '"categoria": "organica"',
    '"categoria": "orgânica"',
    '"organic":',
)


def split_fenced(text: str) -> list[tuple[bool, str]]:
    parts: list[tuple[bool, str]] = []
    fence = re.compile(r"(```[\w]*\n.*?```)", re.DOTALL)
    last = 0
    for m in fence.finditer(text):
        if m.start() > last:
            parts.append((False, text[last : m.start()]))
        parts.append((True, m.group(1)))
        last = m.end()
    if last < len(text):
        parts.append((False, text[last:]))
    return parts or [(False, text)]


def apply_replacements(segment: str) -> str:
    for old, new in REPLACEMENTS:
        segment = segment.replace(old, new)
    return segment


def fix_line(line: str) -> str:
    if any(m in line for m in SKIP_LINE_MARKERS):
        return line
    out = apply_replacements(line)

    def repl_backtick(m: re.Match[str]) -> str:
        inner = m.group(1)
        for a, b in REVERT_IN_BACKTICKS:
            inner = inner.replace(a, b)
        return "`" + inner + "`"

    return re.sub(r"`([^`]+)`", repl_backtick, out)


def fix_segment(segment: str) -> str:
    if "\n" not in segment and "\r" not in segment:
        return fix_line(segment)
    parts = re.split(r"(\r?\n)", segment)
    out: list[str] = []
    for part in parts:
        if part in ("\n", "\r\n"):
            out.append(part)
        else:
            out.append(fix_line(part))
    return "".join(out)


def fix_file(path: Path) -> bool:
    raw = path.read_text(encoding="utf-8")
    chunks = split_fenced(raw)
    fixed = "".join(
        chunk if is_fence else fix_segment(chunk) for is_fence, chunk in chunks
    )
    if fixed != raw:
        path.write_text(fixed, encoding="utf-8")
        return True
    return False


def main() -> int:
    targets: list[Path] = []
    targets.extend(ROOT.glob("livros/*.md"))
    targets.extend(ROOT.glob("app/**/*.tsx"))
    targets.extend(ROOT.glob("components/**/*.tsx"))
    skip_names = {"fix_pt_br_ortografia.py", "equipment_catalog_data.py"}
    changed = []
    for p in sorted(set(targets)):
        if p.name in skip_names:
            continue
        if fix_file(p):
            changed.append(p.relative_to(ROOT))
    print(f"Arquivos alterados: {len(changed)}")
    for c in changed:
        print(f"  - {c}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
