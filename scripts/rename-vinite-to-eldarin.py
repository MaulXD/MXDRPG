#!/usr/bin/env python3
"""Substitui marca Eldarin por Eldarin em arquivos de texto do repositório."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_DIRS = {
    "node_modules",
    ".next",
    ".git",
    "pdf",
    "__pycache__",
}

# arquivos/pastas que mantêm nome técnico "vinite" (Foundry id)
SKIP_PATH_PARTS = [
    "node_modules",
    ".next",
]

REPLACEMENTS = [
    ("ECOLOGIA DE MASMORRA E CULINÁRIA BIOMÁGICA", "ECOLOGIA DE MASMORRA E CULINÁRIA BIOMÁGICA"),  # noop
    ("Livro do Jogador — Eldarin v4.0", "Livro do Jogador — Eldarin v4.0"),
    ("Livro do Mestre — Eldarin v4.0", "Livro do Mestre — Eldarin v4.0"),
    ("FICHA DE PERSONAGEM — ELDARIN", "FICHA DE PERSONAGEM — ELDARIN"),
    ("ELDARIN v4.0", "ELDARIN v4.0"),
    ("Eldarin_Ecologia_de_Masmorra_COMPLETO_v4", "Eldarin_Ecologia_de_Masmorra_COMPLETO_v4"),
    ("Eldarin-", "Eldarin-"),
    ("Eldarin v4.0", "Eldarin v4.0"),
    ("Eldarin v4", "Eldarin v4"),
    ("de Eldarin", "de Eldarin"),
    ("em Eldarin", "em Eldarin"),
    ("O UNIVERSO DE ELDARIN", "O UNIVERSO DE ELDARIN"),
    ("MAGIAS DE ELDARIN", "MAGIAS DE ELDARIN"),
    ("GRIMORIO DE ELDARIN", "GRIMORIO DE ELDARIN"),
    ("Escolas de Magia em Eldarin", "Escolas de Magia em Eldarin"),
    ("exclusiva de Eldarin", "exclusiva de Eldarin"),
    ("Visao Geral de Eldarin", "Visao Geral de Eldarin"),
    ("masmorras de Eldarin", "masmorras de Eldarin"),
    ("As masmorras de Eldarin", "As masmorras de Eldarin"),
    ("ha um dito em Eldarin", "ha um dito em Eldarin"),
    ("espalhadas por Eldarin", "espalhadas por Eldarin"),
    ("habitam Valdremor", "habitam Valdremor"),  # noop
    ("Eldarin", "Eldarin"),
    ("ELDARIN", "ELDARIN"),
]

GLOB_ROOTS = [
    ROOT / "livros",
    ROOT,
]

EXTRA_FILES = [
    ROOT / "scripts" / "build-pdfs.py",
    ROOT / "scripts" / "pdf-theme" / "vinite-book.css",
    ROOT / "PRODUTO.md",
    ROOT / "ESTRUTURA-PROJETOS.md",
    ROOT / "web" / "app",
    ROOT / "web" / "components",
    ROOT / "web" / "lib",
    ROOT / "web" / "README.md",
    ROOT / "vinite" / "lang" / "pt-BR.json",
    ROOT / "vinite" / "system.json",
]


def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    if parts & SKIP_DIRS:
        return True
    if path.suffix.lower() not in {".md", ".py", ".css", ".tsx", ".ts", ".json", ".html", ".hbs", ".mjs", ".js", ".scss"}:
        return False
    if "pdf" in parts and path.suffix.lower() == ".pdf":
        return True
    return False


def transform(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    return text


def process_file(path: Path) -> bool:
    if should_skip(path):
        return False
    original = path.read_text(encoding="utf-8")
    updated = transform(original)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed: list[str] = []
    for base in GLOB_ROOTS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and process_file(path):
                changed.append(str(path.relative_to(ROOT)))

    for path in EXTRA_FILES:
        if path.is_file() and process_file(path):
            rel = str(path.relative_to(ROOT))
            if rel not in changed:
                changed.append(rel)

    print(f"Arquivos alterados: {len(changed)}")
    for c in sorted(changed)[:40]:
        print(f"  {c}")
    if len(changed) > 40:
        print(f"  ... +{len(changed) - 40}")


if __name__ == "__main__":
    main()
