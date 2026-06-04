#!/usr/bin/env python3
"""Reverte 'so'→'só' acidental no meio/fim de palavras (venenosó, descansó, ossó…)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAT = re.compile(r"(\w{2,})só\b", re.UNICODE)

EXTRA = [
    ("Usó", "Uso"),
    ("usó", "uso"),
    ("Osso", "Osso"),
    ("ORGANICAS", "ORGÂNICAS"),
    ("Extraida", "Extraída"),
    ("extraida", "extraída"),
    ("automaticamente", "automaticamente"),
    ("area 3m", "área 3m"),
    ("area ", "área "),
    ("Abreviacao", "Abreviação"),
    ("Recuperacao", "Recuperação"),
    ("basica", "básica"),
    ("informacao", "informação"),
    ("imperios", "impérios"),
    ("maxima", "máxima"),
    ("terceira geracao", "terceira geração"),
    ("comecaram", "começaram"),
    ("opinioes", "opiniões"),
    ("consciencia", "consciência"),
    ("legalmente", "legalmente"),
    ("pecas", "peças"),
    ("maxilares", "maxilares"),
    ("caixas toracicas", "caixas torácicas"),
    ("estetica", "estética"),
    ("Hibernacao", "Hibernação"),
    ("Rapida", "Rápida"),
    ("Implacavel", "Implacável"),
    ("Forjados de Osso", "Forjados de Osso"),
    ("Forjado de Osso", "Forjado de Osso"),
    ("Forjados de Osso", "Forjados de Osso"),
]


def fix_text(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        stem = m.group(1)
        if stem.lower() in ("ap", "atrav", "dev"):
            return m.group(0)
        return stem + "so"

    out = PAT.sub(repl, text)
    for a, b in EXTRA:
        out = out.replace(a, b)
    return out


def main() -> int:
    n = 0
    for path in sorted(ROOT.glob("livros/*.md")):
        raw = path.read_text(encoding="utf-8")
        fixed = fix_text(raw)
        if fixed != raw:
            path.write_text(fixed, encoding="utf-8")
            n += 1
            print(path.name)
    print(f"total: {n}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
