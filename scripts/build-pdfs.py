#!/usr/bin/env python3
"""Gera PDFs estilizados dos livros Eldarin a partir de Markdown."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import markdown
from markdown.extensions.tables import TableExtension
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
THEME_DIR = Path(__file__).resolve().parent / "pdf-theme"
OUT_DIR = ROOT / "livros" / "pdf"
ECOLOGY_DIR = ROOT / "livros" / "guias-ecologia"
ECOLOGY_PDF_DIR = OUT_DIR / "guias-ecologia"

BOOKS = [
    {
        "id": "jogador",
        "source": ROOT / "livros" / "LIVRO-DO-JOGADOR.md",
        "output": OUT_DIR / "Eldarin-Livro-do-Jogador-v4.pdf",
        "cover_class": "jogador",
        "eyebrow": "Regras · Personagem · Culinária · Magia",
        "title": "Ecologia de Masmorra & Culinária Biomágica",
        "subtitle": "Livro do Jogador",
        "tagline": "Partes I–X · 34 caminhos de subclasse · 61 magias",
        "css": ["vinite-book.css"],
        "body_class": "book jogador",
    },
    {
        "id": "mestre",
        "source": ROOT / "livros" / "LIVRO-DO-MESTRE.md",
        "output": OUT_DIR / "Eldarin-Livro-do-Mestre-v4.pdf",
        "cover_class": "mestre",
        "eyebrow": "Biomas · Masmorras · Bestiário · Comportamentos",
        "title": "Ecologia de Masmorra & Culinária Biomágica",
        "subtitle": "Livro do Mestre",
        "tagline": "Partes XI–XII · Onze Bocas · ~80 espécimes",
        "css": ["vinite-book.css"],
        "body_class": "book mestre bestiário",
    },
    {
        "id": "ficha",
        "source": ROOT / "FICHA_PERSONAGEM_ELDARIN_v4.md",
        "output": OUT_DIR / "Eldarin-Ficha-Personagem-v4.pdf",
        "cover_class": "ficha",
        "eyebrow": "Ficha oficial",
        "title": "Ficha de Personagem",
        "subtitle": "Eldarin v4.0",
        "tagline": "Uma folha (frente e verso) — regras no Livro do Jogador.",
        "css": ["vinite-book.css", "vinite-ficha-compact.css"],
        "body_class": "book ficha-compact",
        "no_cover": True,
    },
    {
        "id": "geral",
        "source": None,
        "output": OUT_DIR / "Eldarin-Edicao-Geral-v4.pdf",
        "cover_class": "geral",
        "eyebrow": "Edição completa · Jogador + Mestre",
        "title": "Ecologia de Masmorra & Culinária Biomágica",
        "subtitle": "Livro Geral",
        "tagline": "Partes I–XII · 34 subclasses · 61 magias · bestiário",
        "css": ["vinite-book.css"],
        "body_class": "book geral bestiário",
    },
]


def build_geral_markdown() -> str:
    jogador = (ROOT / "livros" / "LIVRO-DO-JOGADOR.md").read_text(encoding="utf-8")
    mestre = (ROOT / "livros" / "LIVRO-DO-MESTRE.md").read_text(encoding="utf-8")
    mestre_start = mestre.find("# PARTE XI")
    mestre_body = mestre[mestre_start:] if mestre_start >= 0 else mestre
    return (
        "# EDIÇÃO GERAL — ELDARIN v4.0\n\n"
        "> **Volume I:** Livro do Jogador (abaixo). "
        "> **Volume II:** Livro do Mestre (a partir da Parte XI).\n\n"
        "---\n\n"
        f"{jogador.strip()}\n\n---\n\n{mestre_body.strip()}\n"
    )


def preprocess_md(text: str) -> str:
    """Marca partes/capítulos para quebras de página no CSS."""
    lines: list[str] = []
    for line in text.splitlines():
        if re.match(r"^# PARTE ", line):
            line = re.sub(
                r"^(# PARTE .+)$",
                r'\1 <!--parte-->',
                line,
            )
        elif re.match(r"^## CAPÍTULO ", line, re.I):
            line = re.sub(
                r"^(## CAPÍTULO .+)$",
                r'\1 <!--capitulo-->',
                line,
            )
        elif re.match(r"^## \d{3} — ", line):
            line = f"{line} <!--monstro-->"
        elif re.match(r"^# Guia de Ecologia", line):
            line = f"{line} <!--guia-->"
        elif re.match(r"^# Parte [A-Z]", line):
            line = f"{line} <!--parte-interna-->"
        elif re.match(r"^# PARTE XI", line):
            line = f"{line} <!--volume-mestre-->"
        lines.append(line)
    return "\n".join(lines)


def postprocess_html(html: str) -> str:
    html = html.replace("<!--parte-->", "")
    html = html.replace('class="parte"', 'class="parte"')
    html = re.sub(
        r"<h1>(PARTE [^<]+)</h1>",
        r'<h1 class="parte">\1</h1>',
        html,
    )
    html = html.replace("<!--capitulo-->", "")
    html = re.sub(
        r"<h2>(CAPÍTULO [^<]+)</h2>",
        r'<h2 class="capitulo">\1</h2>',
        html,
        flags=re.I,
    )
    html = html.replace("<!--monstro-->", "")

    def _monstro_header(match: re.Match[str]) -> str:
        num, nome = match.group(1), match.group(2).strip()
        return (
            '<header class="monstro-cabecalho">'
            f'<span class="monstro-num">{num}</span>'
            f'<h2 class="monstro-nome">{nome}</h2></header>'
        )

    html = re.sub(
        r"<h2>(\d{3})\s*[—–-]\s*([^<]+)</h2>",
        _monstro_header,
        html,
    )
    html = html.replace("<!--guia-->", "")
    html = re.sub(
        r"<h1>(Guia de Ecologia — [^<]+)</h1>",
        r'<h1 class="guia-folio">\1</h1>',
        html,
    )
    html = html.replace("<!--parte-interna-->", "")
    html = re.sub(
        r"<h1>(Parte [A-Z] — [^<]+)</h1>",
        r'<h1 class="parte-interna">\1</h1>',
        html,
    )
    html = html.replace("<!--volume-mestre-->", "")
    html = re.sub(
        r"<h1>(PARTE XI[^<]*)</h1>",
        r'<h1 class="parte volume-mestre">\1</h1>',
        html,
    )
    return html


def md_to_html(md_text: str) -> str:
    md = markdown.Markdown(
        extensions=[
            TableExtension(),
            "fenced_code",
            "nl2br",
            "sane_lists",
        ]
    )
    return postprocess_html(md.convert(preprocess_md(md_text)))


def build_html_document(book: dict, body_html: str) -> str:
    css_links = "\n".join(
        f'  <link rel="stylesheet" href="{(THEME_DIR / name).as_uri()}">'
        for name in book["css"]
    )
    fonts = (
        '  <link rel="preçonnect" href="https://fonts.googleapis.com">\n'
        '  <link rel="preçonnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700'
        "&family=Lora:ital,wght@0,400;0,600;1,400&display=swap\" rel=\"stylesheet\">\n"
    )
    folio_block = ""
    if book.get("folio_num"):
        folio_block = f'<p class="folio-num">{book["folio_num"]}</p>\n    '

    cover_html = ""
    if not book.get("no_cover"):
        cover_html = f"""
  <section class="cover {book['cover_class']}">
    <p class="eyebrow">{book['eyebrow']}</p>
    {folio_block}<h1>{book['title']}</h1>
    <p class="subtitle">{book['subtitle']}</p>
    <p class="tagline">{book['tagline']}</p>
    <span class="edition">v4.0</span>
  </section>
"""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>{book['subtitle']} — Eldarin v4.0</title>
{fonts}{css_links}
</head>
<body class="{book['body_class']}">
{cover_html}
  <article class="content">
{body_html}
  </article>
</body>
</html>
"""


def render_pdf(html_path: Path, pdf_path: Path) -> None:
    file_url = html_path.resolve().as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(file_url, wait_until="networkidle", timeout=120_000)
        page.pdf(
            path=str(pdf_path),
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()


def ecology_title_from_md(path: Path) -> str:
    first = path.read_text(encoding="utf-8").splitlines()[0].strip()
    if first.startswith("# Guia de Ecologia — "):
        return first.replace("# Guia de Ecologia — ", "", 1)
    return path.stem


def ecology_folio_num(path: Path) -> str:
    return path.stem.split("-", 1)[0]


def discover_ecology_books() -> list[dict]:
    guides = sorted(ECOLOGY_DIR.glob("*.md"))
    books: list[dict] = []
    ECOLOGY_PDF_DIR.mkdir(parents=True, exist_ok=True)

    for path in guides:
        num = ecology_folio_num(path)
        title = ecology_title_from_md(path)
        slug = path.stem
        books.append(
            {
                "id": f"ecologia-{num}",
                "source": path,
                "output": ECOLOGY_PDF_DIR / f"Eldarin-Ecologia-{num}-{slug[3:]}.pdf",
                "cover_class": "ecologia",
                "eyebrow": f"Folheto {num} · Guia de Ecologia",
                "title": title,
                "subtitle": "Eldarin v4.0",
                "tagline": "Mesa rápida — não substitui o Livro do Mestre.",
                "css": ["vinite-book.css", "vinite-ecologia.css"],
                "body_class": "book ecologia-doc",
                "folio_num": num,
            }
        )

    merged_body = "\n\n---\n\n".join(p.read_text(encoding="utf-8") for p in guides)
    books.append(
        {
            "id": "ecologia-compendio",
            "source": None,
            "md_text": (
                "# Compêndio de Ecologia\n\n"
                "> Os dez folhetos reunidos. Bestiário completo: *Livro do Mestre*.\n\n"
                "---\n\n"
                f"{merged_body}"
            ),
            "output": OUT_DIR / "Eldarin-Guias-Ecologia-Compendio-v4.pdf",
            "cover_class": "ecologia compedio",
            "eyebrow": "Suplemento · 10 folhetos",
            "title": "Guias de Ecologia",
            "subtitle": "Compêndio completo",
            "tagline": "Mortos-vivos a glaciais — referência de mesa.",
            "css": ["vinite-book.css", "vinite-ecologia.css"],
            "body_class": "book ecologia-doc",
            "folio_num": None,
        }
    )
    return books


def build_one(book: dict, keep_html: bool = False) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    book.get("output").parent.mkdir(parents=True, exist_ok=True)

    if book.get("md_text"):
        md_text = book["md_text"]
        label = book["id"]
    elif book["id"] == "geral":
        md_text = build_geral_markdown()
        label = "Edição Geral (Jogador + Mestre)"
    else:
        source: Path = book["source"]
        if not source.is_file():
            raise FileNotFoundError(source)
        md_text = source.read_text(encoding="utf-8")
        label = source.name

    body_html = md_to_html(md_text)
    html_doc = build_html_document(book, body_html)

    html_path = OUT_DIR / f"_build-{book['id']}.html"
    html_path.write_text(html_doc, encoding="utf-8")

    pdf_path: Path = book["output"]
    print(f"  PDF: {pdf_path.name} …", flush=True)
    render_pdf(html_path, pdf_path)

    if not keep_html:
        html_path.unlink(missing_ok=True)

    size_mb = pdf_path.stat().st_size / (1024 * 1024)
    print(f"  OK ({size_mb:.1f} MB)", flush=True)
    return pdf_path


def all_books() -> list[dict]:
    return BOOKS + discover_ecology_books()


def main() -> int:
    ecology = discover_ecology_books()
    catalog = BOOKS + ecology
    ids = [b["id"] for b in catalog]

    parser = argparse.ArgumentParser(description="Gera PDFs Eldarin")
    parser.add_argument("--only", choices=ids, help="Gerar apenas um volume")
    parser.add_argument(
        "--ecologia",
        action="store_true",
        help="Gerar os 10 folhetos + compêndio de ecologia",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Jogador + Mestre + Geral + Ficha + ecologia",
    )
    parser.add_argument(
        "--geral",
        action="store_true",
        help="Somente a Edição Geral (Jogador + Mestre)",
    )
    parser.add_argument(
        "--keep-html",
        action="store_true",
        help="Manter HTML intermediário em livros/pdf/",
    )
    args = parser.parse_args()

    if args.all:
        targets = catalog
    elif args.geral:
        targets = [b for b in BOOKS if b["id"] == "geral"]
    elif args.ecologia:
        targets = ecology
    elif args.only:
        targets = [b for b in catalog if b["id"] == args.only]
    else:
        targets = BOOKS

    print("Eldarin PDF builder\n")
    built: list[Path] = []
    for book in targets:
        label = book["source"].name if book.get("source") else book["id"]
        print(f"[{book['id']}] {label}")
        try:
            built.append(build_one(book, keep_html=args.keep_html))
        except Exception as exc:
            print(f"  ERRO: {exc}", file=sys.stderr)
            return 1

    print(f"\n{len(built)} PDF(s) em:\n  {OUT_DIR}")
    for path in built:
        rel = path.relative_to(OUT_DIR) if path.is_relative_to(OUT_DIR) else path.name
        print(f"  • {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
