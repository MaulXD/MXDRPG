#!/usr/bin/env python3
"""Insere | **XP:** N | apos Nivel em cada ficha do bestiario (100 x nivel)."""

from __future__ import annotations
import re
from pathlib import Path

LM = Path(__file__).resolve().parents[1] / "livros" / "LIVRO-DO-MESTRE.md"
PAT = re.compile(
    r"(\*\*Nível:\*\* (\d+) \| \*\*Faixa:\*\*)"
)
REPL = r"**Nível:** \2 | **XP:** \3 | **Faixa:**"
# fix: use function
def repl(m: re.Match) -> str:
    n = int(m.group(2))
    return f"**Nível:** {n} | **XP:** {100 * n} | **Faixa:**"

def main() -> int:
    text = LM.read_text(encoding="utf-8")
    if "**XP:**" in text.split("## 001")[1][:800]:
        print("XP ja presente nas fichas — nada a fazer.")
        return 0
    new, n = PAT.subn(repl, text)
    if n == 0:
        print("Nenhuma ficha atualizada.")
        return 1
    LM.write_text(new, encoding="utf-8")
    print(f"OK: {n} fichas com XP em {LM.name}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
