#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "livros" / "CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md"
out = ROOT / "web" / "lib" / "character" / "loot-catalog.ts"
text = src.read_text(encoding="utf-8")
rows = re.findall(r"^\| (ESP|MIN|TES)-(\d{2}) \| ([^|]+) \|", text, re.M)
lines = ["/** Gerado por scripts/gen-loot-catalog-ts.py — nao editar a mao */", "", "export const LOOT_NAMES: Record<string, string> = {"]
for kind, num, name in rows:
    key = f"{kind}-{num}"
    safe = name.strip().replace("\\", "\\\\").replace('"', '\\"')
    lines.append(f'  "{key}": "{safe}",')
lines.append("};")
lines.append("")
out.write_text("\n".join(lines), encoding="utf-8")
print(f"OK: {len(rows)} -> {out}")
