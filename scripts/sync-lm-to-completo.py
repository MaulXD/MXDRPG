#!/usr/bin/env python3
"""Copia bestiario (Cap. I+) do LIVRO-DO-MESTRE para COMPLETO_v4."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LM = ROOT / "livros" / "LIVRO-DO-MESTRE.md"
COMPLETO = ROOT / "Eldarin_Ecologia_de_Masmorra_COMPLETO_v4.md"

MARK_START = "# CAPÍTULO I — MORTOS-VIVOS E ESPECTRAIS"
MARK_END = "# APÊNDICE — MONSTROS EXCLUSIVOS DE BOSS POR MASMORRA"


def slice_between(text: str, start: str, end: str) -> tuple[int, int]:
    i = text.find(start)
    if i < 0:
        raise SystemExit(f"Marcador nao encontrado: {start!r}")
    j = text.find(end, i + 1)
    if j < 0:
        raise SystemExit(f"Marcador nao encontrado: {end!r}")
    return i, j


def main() -> int:
    lm = LM.read_text(encoding="utf-8")
    c = COMPLETO.read_text(encoding="utf-8")
    li, lj = slice_between(lm, MARK_START, MARK_END)
    ci, cj = slice_between(c, MARK_START, MARK_END)
    block = lm[li:lj].rstrip() + "\n\n"
    c = c[:ci] + block + c[cj:]
    COMPLETO.write_text(c, encoding="utf-8")
    print(f"OK: bestiario sincronizado -> {COMPLETO.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
