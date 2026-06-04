#!/usr/bin/env python3
"""Insere linha **Saque** nas fichas 001-060 do LIVRO-DO-MESTRE.md."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LM = ROOT / "livros" / "LIVRO-DO-MESTRE.md"
CATALOG = ROOT / "livros" / "CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md"

ROW_RE = re.compile(
    r"^\|\s*(\d{3})\s*\|[^|]+\|([^|]+)\|([^|]+)\|([^|]+)\|",
    re.MULTILINE,
)
SECTION_RE = re.compile(r"(^## (\d{3}) —[^\n]*\n)", re.MULTILINE)
SAQUE_RE = re.compile(r"\*\*Saque \(Trinchar com sucesso\):\*\*")
INSERT_BEFORE = re.compile(r"(\n\*\*Versão Elite|\n---\n\n## )")


def parse_loot_table() -> dict[str, tuple[str, str, str]]:
    text = CATALOG.read_text(encoding="utf-8")
    start = text.find("| 001 |")
    if start < 0:
        raise SystemExit("Tabela 001-060 não encontrada no catálogo")
    chunk = text[start:]
    out: dict[str, tuple[str, str, str]] = {}
    for m in ROW_RE.finditer(chunk):
        cod, esp, mn, tes = m.group(1), m.group(2).strip(), m.group(3).strip(), m.group(4).strip()
        if cod > "060":
            break
        out[cod] = (esp, mn, tes)
    if len(out) != 60:
        raise SystemExit(f"Esperado 60 linhas, obteve {len(out)}")
    return out


def saque_line(cod: str, esp: str, mn: str, tes: str) -> str:
    return (
        f"\n**Saque (Trinchar com sucesso):** {esp} · {mn} · {tes} — "
        f"ver `CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md` (cod. {cod}).\n"
    )


def inject_section(body: str, cod: str, line: str) -> tuple[str, bool]:
    if SAQUE_RE.search(body):
        return body, False
    m = INSERT_BEFORE.search(body)
    if m:
        pos = m.start()
        return body[:pos] + line + body[pos:], True
    return body.rstrip() + line + "\n", True


def main() -> int:
    loot = parse_loot_table()
    text = LM.read_text(encoding="utf-8")
    parts = SECTION_RE.split(text)
    if len(parts) < 3:
        raise SystemExit("Nenhuma secao ## NNN encontrada")

    out: list[str] = [parts[0]]
    added = 0
    skipped = 0

    i = 1
    while i < len(parts):
        header = parts[i]
        cod = parts[i + 1]
        body = parts[i + 2] if i + 2 < len(parts) else ""
        i += 3

        if cod in loot:
            esp, mn, tes = loot[cod]
            body, did = inject_section(body, cod, saque_line(cod, esp, mn, tes))
            if did:
                added += 1
            else:
                skipped += 1

        out.append(header)
        out.append(cod)
        out.append(body)

    LM.write_text("".join(out), encoding="utf-8")
    print(f"OK: {added} saques inseridos, {skipped} ja existiam -> {LM.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
