#!/usr/bin/env python3
"""Gera livros/TABELA-IDS-ELDARIN.md a partir de fontes canônicas."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "livros" / "TABELA-IDS-ELDARIN.md"
EQUIP_CAT = ROOT / "livros" / "CATALOGO-ARMAS-ARMADURAS-FORJA-E-POCOES.md"
JOGADOR = ROOT / "livros" / "LIVRO-DO-JOGADOR.md"
LM = ROOT / "livros" / "LIVRO-DO-MESTRE.md"
FLORA = ROOT / "livros" / "CAPITULO-5B-FLORA-DE-ELDARIN.md"
CEN = ROOT / "livros" / "CATALOGO-OBJETOS-DE-CENARIO.md"
TES = ROOT / "livros" / "CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md"
COMP = ROOT / "data" / "compendiums"


def slug(s: str) -> str:
    s = s.lower()
    for a, b in (
        ("á", "a"), ("à", "a"), ("â", "a"), ("ã", "a"),
        ("é", "e"), ("ê", "e"),
        ("í", "i"),
        ("ó", "o"), ("ô", "o"), ("õ", "o"),
        ("ú", "u"), ("ç", "c"),
    ):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def parse_monsters_jogador() -> list[tuple[str, str]]:
    text = JOGADOR.read_text(encoding="utf-8")
    m = re.search(r"### 6\.2 Indice de espécimes.*?\n\n(\| Cod.*?\n\|[-| ]+\n(?:\| \d{3}.*?\n)+)", text, re.S)
    if not m:
        return []
    rows = []
    for line in m.group(1).splitlines()[2:]:
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if len(parts) >= 2 and parts[0].isdigit():
            rows.append((parts[0], parts[1]))
    return rows


def parse_monsters_lm_extra() -> list[tuple[str, str]]:
    text = LM.read_text(encoding="utf-8")
    rows = []
    for m in re.finditer(r"^## (\d{3}) — (.+)$", text, re.M):
        cod, name = m.group(1), m.group(2).strip()
        if int(cod) > 60:
            rows.append((cod, name))
    return rows


def parse_flora() -> list[tuple[str, str, str]]:
    text = FLORA.read_text(encoding="utf-8")
    rows = []
    for m in re.finditer(r"^\| (\d{2}) \| ([^|]+) \| ([^|]+) \|", text, re.M):
        rows.append((m.group(1), m.group(2).strip(), m.group(3).strip()))
    return rows


def parse_loot(kind: str) -> list[tuple[str, str]]:
    text = TES.read_text(encoding="utf-8")
    return [
        (f"{kind}-{num}", name.strip())
        for kind, num, name in re.findall(
            rf"^\| ({kind})-(\d{{2}}) \| ([^|]+) \|", text, re.M
        )
    ]


def parse_obj_ids() -> list[tuple[str, str, str]]:
    text = CEN.read_text(encoding="utf-8")
    rows = []
    for m in re.finditer(r"^\| (OBJ-[^|]+) \| ([^|]+) \|", text, re.M):
        oid, name = m.group(1).strip(), m.group(2).strip()
        rows.append((oid, name, ""))
    return rows


def compendium_pack(pack: str) -> list[tuple[str, str, str]]:
    path = COMP / f"{pack}.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for i, raw in enumerate(data):
        name = raw.get("name", "?")
        eid = raw.get("id") or f"{pack}-{slug(name) or i}"
        tipo = raw.get("type", pack)
        out.append((eid, name, tipo))
    return out


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines) + "\n"


def main() -> int:
    lines = [
        "# TABELA DE IDs — Eldarin v4.0",
        "",
        "> Registro unificado de identificadores para mesa, VTT (`data/compendiums/`) e documentação.  ",
        "> **Regenerar:** `python scripts/gen-tabela-ids.py`",
        "",
        "---",
        "",
        "## Convenção de prefixos",
        "",
        md_table(
            ["Prefixo", "Domínio", "Formato", "Exemplo", "Onde"],
            [
                ["`MON`", "Espécime canônico (assimilação + saque)", "`MON-###` ou `###`", "MON-001 / 001", "LM · Jogador 6.2"],
                ["`P` / `PLT`", "Flora de masmorra", "`P-##`", "P-03", "Cap. 5B"],
                ["`BIO`", "Bioma de masmorra", "`BIO-##`", "BIO-09", "Biomas aprofundados"],
                ["`MS`", "Masmorra (Boca)", "`MS-##`", "MS-01", "LM Cap. 21"],
                ["`ESP`", "Especiaria", "`ESP-##`", "ESP-12", "Catálogo tesouros"],
                ["`MIN`", "Minério", "`MIN-##`", "MIN-01", "Catálogo tesouros"],
                ["`TES`", "Tesouro / joia", "`TES-##`", "TES-11", "Catálogo tesouros"],
                ["`OBJ-G`", "Objeto de cenário global", "`OBJ-G##`", "OBJ-G08", "Catálogo cenário"],
                ["`OBJ-B`", "Objeto por bioma", "`OBJ-B##-##`", "OBJ-B09-03", "Catálogo cenário"],
                ["`OBJ-R`", "Recurso econômico", "`OBJ-R##`", "OBJ-R01", "Catálogo cenário"],
                ["`armas-`", "Arma (VTT)", "`armas-{slug}`", "armas-lâmina-de-vinha", "compendiums/armas.json"],
                ["`habilidades-`", "Habilidade tática", "`habilidades-{slug}`", "habilidades-investida-do-guerreiro", "compendiums/habilidades.json"],
                ["`magias-`", "Magia", "`magias-{slug}`", "magias-calor-de-panela", "compendiums/magias.json"],
                ["`equipamentos-`", "Equipamento", "`equipamentos-{slug}`", "equipamentos-kit-de-trinchar", "compendiums/equipamentos.json"],
                ["`monstros-`", "Ficha VTT de monstro", "`monstros-{slug}`", "monstros-zumbi-de-masmorra", "compendiums/monstros.json"],
                ["`PC`", "Personagem jogador", "`pc-{id}`", "pc-aventureiro", "characters.ts / API"],
                ["`ROOM`", "Mesa VTT", "`room-{id}`", "room-demo", "room state"],
                ["`USR`", "Conta", "`usr_{slug}`", "usr_demo_jogador", "auth seed"],
                ["`CLA`", "Classe", "`CLA-{slug}`", "CLA-guerreiro", "Jogador Parte III"],
                ["`RAC`", "Raça", "`RAC-{slug}`", "RAC-humano", "Jogador Parte III"],
                ["`LIN`", "Linhagem meio-humano", "`LIN-{slug}`", "LIN-gato", "Jogador Parte III"],
                ["`ASSIM`", "Habilidade assimilada", "`ASSIM-{MON}-{n}`", "ASSIM-024-3", "Assimilação por espécime"],
                ["`ARC-L`", "Arco longo", "`ARC-L##` (+E1-3)", "ARC-L06-E2", "Catálogo forja"],
                ["`ARC-C`", "Arco curto", "`ARC-C##`", "ARC-C09", "Catálogo forja"],
                ["`BST`", "Besta", "`BST-##`", "BST-08", "Catálogo forja"],
                ["`ARM`", "Armadura", "`ARM-##`", "ARM-12-E3", "Catálogo forja"],
                ["`POC`", "Poção", "`POC-##`", "POC-02", "Catálogo forja"],
                ["`MUN`", "Munição", "`MUN-##`", "MUN-05", "Catálogo forja"],
                ["`FORJA`", "Forja", "`FORJA-##`", "FORJA-03", "Cap. 14.7"],
                ["`WPN-S`", "Espada", "`WPN-S##`", "WPN-S02", "Catálogo forja"],
                ["`WPN-P`", "Lança / haste", "`WPN-P##`", "WPN-P02", "Catálogo forja"],
                ["`WPN-O`", "Outra melee", "`WPN-O##`", "WPN-O03", "Catálogo forja"],
                ["`EFE`", "Efeito de equipamento", "`EFE-##`", "EFE-01", "Cap. 14.8 · VTT special"],
                ["`ORG`", "Arma orgânica", "`ORG-##`", "ORG-01", "Cap. 15 · compêndio armas"],
            ],
        ),
        "",
        "**Regra:** na ficha e no chat, cite o ID curto (`001`, `ESP-12`, `OBJ-B04-02`). No VTT e inventário, use o `entryId` completo do compêndio.",
        "",
        "---",
        "",
        "## Monstros — espécimes 001–060 (canônicos)",
        "",
        "| ID | MON | Nome | VTT (slug) | Assimilação |",
        "| --- | --- | --- | --- | --- |",
    ]

    mons = parse_monsters_jogador()
    for cod, name in mons:
        vtt = f"monstros-{slug(name)}"
        lines.append(f"| {cod} | MON-{cod} | {name} | `{vtt}` | ASSIM-{cod}-1 … 8 |")

    lines += [
        "",
        "---",
        "",
        "## Monstros — ficha estendida LM (061+)",
        "",
        md_table(
            ["ID", "MON", "Nome"],
            [[c, f"MON-{c}", n] for c, n in parse_monsters_lm_extra()],
        ),
        "",
        "---",
        "",
        "## Flora (40 especies)",
        "",
        md_table(
            ["ID", "Nome", "Bioma típico"],
            [[f"P-{n}", name, bio] for n, name, bio in parse_flora()],
        ),
        "",
        "---",
        "",
        "## Biomas (20)",
        "",
        md_table(
            ["ID", "Nome"],
            [
                ["BIO-01", "Cidadela Palida"],
                ["BIO-02", "Mar de Prata Cega"],
                ["BIO-03", "Estômago Botanico"],
                ["BIO-04", "Fornalhas Douradas"],
                ["BIO-05", "Prisao Gelida"],
                ["BIO-06", "Labirinto Prismático"],
                ["BIO-07", "Cemiterio de Colossos"],
                ["BIO-08", "Engrenagens Esquecidas"],
                ["BIO-09", "Abismo Invertido"],
                ["BIO-10", "Pantano da Decomposicao"],
                ["BIO-11", "Arquivos Soterrados"],
                ["BIO-12", "Ninho Crepuscular"],
                ["BIO-13", "Oasis Neon"],
                ["BIO-14", "Matriz de Extrusao"],
                ["BIO-15", "Deserto de Carne e Tendoes"],
                ["BIO-16", "Jardim de Cinzas Petrificadas"],
                ["BIO-17", "Arquipelago de Pedra"],
                ["BIO-18", "Floresta de Fios de Prata"],
                ["BIO-19", "Fosso das Emocoes"],
                ["BIO-20", "Abatedouro Celestial"],
            ],
        ),
        "",
        "---",
        "",
        "## Onze masmorras (Bocas)",
        "",
        md_table(
            ["ID", "Nome", "Tema"],
            [
                ["MS-01", "Boca Vermelha", "Fogo / vulcanico"],
                ["MS-02", "Boca Azul", "Aquatico / abissal"],
                ["MS-03", "Boca Verde", "Flora / fungos"],
                ["MS-04", "Boca Dourada", "Academia / ilusao"],
                ["MS-05", "Boca Cinza", "Construtos / industria"],
                ["MS-06", "Boca Branca", "Gelo / mortos-vivos"],
                ["MS-07", "Boca Negra", "Necrótico / vampiros"],
                ["MS-08", "Boca Violeta", "Aberração / psionico"],
                ["MS-09", "Boca Laranja", "Colmeias / enxames"],
                ["MS-10", "Boca Prateada", "Metal / cristal"],
                ["MS-11", "Boca Vazia (anomalia)", "Chefe final / Devorador Ancião"],
            ],
        ),
        "",
        "---",
        "",
        "## Classes, racas e linhagens",
        "",
        md_table(
            ["ID", "Nome"],
            [
                ["CLA-guerreiro", "Guerreiro"],
                ["CLA-patrulheiro", "Patrulheiro"],
                ["CLA-ladino", "Ladino"],
                ["CLA-mago", "Mago"],
                ["CLA-clérigo", "Clérigo"],
                ["CLA-bárbaro", "Bárbaro"],
                ["CLA-bardo", "Bardo"],
                ["CLA-druida", "Druida"],
                ["CLA-artífice", "Artífice"],
                ["RAC-humano", "Humano"],
                ["RAC-elfo", "Elfo"],
                ["RAC-anao", "Anao"],
                ["RAC-meio-elfo", "Meio-elfo"],
                ["RAC-meio-orc", "Meio-orc"],
                ["RAC-pequenino", "Pequenino"],
                ["RAC-meio-humano", "Meio-humano (linhagem)"],
                ["LIN-gato", "Linhagem do Gato"],
                ["LIN-cobra", "Linhagem da Cobra"],
                ["LIN-urso", "Linhagem do Urso"],
                ["LIN-tigre", "Linhagem do Tigre"],
                ["LIN-aguia", "Linhagem da Aguia"],
                ["LIN-lobo", "Linhagem do Lobo"],
                ["LIN-tubarao", "Linhagem do Tubarao"],
                ["LIN-corvo", "Linhagem do Corvo"],
            ],
        ),
        "",
        "---",
        "",
        "## Especiarias (ESP-01–30)",
        "",
        md_table(["ID", "Nome"], [[a, b] for a, b in parse_loot("ESP")]),
        "",
        "---",
        "",
        "## Minérios (MIN-01–30)",
        "",
        md_table(["ID", "Nome"], [[a, b] for a, b in parse_loot("MIN")]),
        "",
        "---",
        "",
        "## Tesouros (TES-01–20)",
        "",
        md_table(["ID", "Nome"], [[a, b] for a, b in parse_loot("TES")]),
        "",
        "---",
        "",
        "## Objetos de cenário (amostra — lista completa no catálogo)",
        "",
    ]

    objs = parse_obj_ids()
    # dedupe by id
    seen: set[str] = set()
    obj_rows = []
    for oid, name, _ in objs:
        if oid in seen:
            continue
        seen.add(oid)
        obj_rows.append([oid, name])
    lines.append(md_table(["ID", "Nome"], obj_rows[:80]))
    if len(obj_rows) > 80:
        lines.append(f"\n*… e mais {len(obj_rows) - 80} IDs em `CATALOGO-OBJETOS-DE-CENARIO.md`.*\n")

    for pack, label in [
        ("armas", "Armas"),
        ("habilidades", "Habilidades"),
        ("magias", "Magias"),
        ("equipamentos", "Equipamentos"),
        ("monstros", "Monstros (VTT)"),
    ]:
        entries = compendium_pack(pack)
        lines += [
            "",
            "---",
            "",
            f"## Compêndio VTT — {label} ({len(entries)})",
            "",
            md_table(["entryId", "Nome", "tipo"], [[a, b, c] for a, b, c in entries]),
        ]

    lines += [
        "",
        "---",
        "",
        "## Personagens e mesa (demo)",
        "",
        md_table(
            ["ID", "Papel"],
            [
                ["PC-pc-aventureiro", "Jogador demo"],
                ["PC-pc-mestre-demo", "NPC demo mestre"],
                ["USR-usr_demo_jogador", "Conta jogador"],
                ["USR-usr_demo_mestre", "Conta mestre"],
                ["ROOM-demo", "Sala VTT padrão"],
            ],
        ),
        "",
    ]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK: {OUT} ({len(lines)} linhas)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
