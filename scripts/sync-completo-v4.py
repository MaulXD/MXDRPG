#!/usr/bin/env python3
"""Sincroniza Eldarin_Ecologia_de_Masmorra_COMPLETO_v4.md com Jogador (Cap. 5–6, 5B) + Assimilação."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPLETO = ROOT / "Eldarin_Ecologia_de_Masmorra_COMPLETO_v4.md"
JOGADOR = ROOT / "livros" / "LIVRO-DO-JOGADOR.md"
ASSIM = ROOT / "livros" / "ASSIMILACAO-POR-ESPECIME.md"

MARK_V = "# PARTE V — ALIMENTACAO"
MARK_VI = "# PARTE VI — DIVINDADES"

CLASS_OLD = (
    "Cada monstro possui uma **versão Elite** desbloqueada quando encontrado nos andares "
    "mais profundos (biomas de Nível 10+).\n\n### Estatísticas"
)
CLASS_NEW = (
    "Cada monstro possui uma **versão Elite** desbloqueada quando encontrado nos andares "
    "mais profundos (biomas de Nível 10+).\n\n"
    "**Assimilação (Jogador):** cada ficha numerada (**001–060**) tem **8 habilidades** proprias "
    "(Apendice neste arquivo / `ASSIMILACAO-POR-ESPECIME.md`). O codigo do titulo da ficha "
    "(ex.: `## 024 —`) e o indice de assimilação.\n\n"
    "**Flora de masmorra:** 40 especies em **Cap. 5B** — Druidas e ecossistema; monstros "
    "**Consumidores** listados por planta.\n\n"
    "**Saque economico:** Trinchar com sucessó concede ESP/MIN/tesouro por codigo em "
    "`CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md`; cenario **OBJ-R**.\n\n"
    "### Estatísticas"
)


def slice_between(text: str, start: str, end: str) -> tuple[int, int]:
    i = text.find(start)
    if i < 0:
        raise SystemExit(f"Marcador não encontrado: {start!r}")
    j = text.find(end, i + 1)
    if j < 0:
        raise SystemExit(f"Marcador não encontrado: {end!r}")
    return i, j


def assim_appendix() -> str:
    raw = ASSIM.read_text(encoding="utf-8")
    parts = raw.split("---\n", 1)
    body = parts[1].strip() if len(parts) > 1 else raw.strip()
    return (
        "\n\n---\n\n"
        "# APENDICE — ASSIMILACAO POR ESPECIME (001–060)\n\n"
        f"{body}\n\n"
    )


def main() -> int:
    j = JOGADOR.read_text(encoding="utf-8")
    c = COMPLETO.read_text(encoding="utf-8")

    ji, jj = slice_between(j, MARK_V, MARK_VI)
    parte_v = j[ji:jj].rstrip() + assim_appendix()

    ci, cj = slice_between(c, MARK_V, MARK_VI)
    c = c[:ci] + parte_v + "\n\n---\n\n" + c[cj:]

    flora_tail = (
        "**Flora de masmorra:** 40 especies em **Cap. 5B** — Druidas e ecossistema; monstros "
        "**Consumidores** listados por planta.\n\n### Estatísticas"
    )
    flora_saque = flora_tail.replace(
        "planta.\n\n###",
        "planta.\n\n**Saque economico:** Trinchar com sucessó concede ESP/MIN/tesouro por codigo em "
        "`CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md`; cenario **OBJ-R**.\n\n###",
        1,
    )
    if flora_tail in c and "**Saque economico:**" not in c:
        c = c.replace(flora_tail, flora_saque, 1)
    elif CLASS_OLD in c:
        c = c.replace(CLASS_OLD, CLASS_NEW, 1)
    elif "**Saque economico:**" not in c:
        print("AVISO: bloco de classificacao do bestiário não encontrado; pulando patch LM.")

    tesouros = ROOT / "livros" / "CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md"
    mark_app = "# APENDICE — CATALOGO TESOUROS"
    if tesouros.exists() and mark_app not in c:
        body = tesouros.read_text(encoding="utf-8")
        parts = body.split("---\n", 1)
        inner = parts[1].strip() if len(parts) > 1 else body.strip()
        c = c.rstrip() + "\n\n---\n\n" + mark_app + "\n\n" + inner + "\n"

    COMPLETO.write_text(c, encoding="utf-8")
    lines = len(c.splitlines())
    print(f"OK: {COMPLETO.name} ({lines} linhas)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
