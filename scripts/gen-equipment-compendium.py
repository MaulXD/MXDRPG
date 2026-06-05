#!/usr/bin/env python3
"""Gera compendiums/armas.json e equipamentos.json a partir de equipment_catalog_data.py."""

from __future__ import annotations

import json
from pathlib import Path

from equipment_catalog_data import (
    ARCOS_CURTOS,
    ARCOS_LONGOS,
    ARMADURAS,
    BESTAS,
    ENCHANT_LEVELS,
    ESPADAS,
    LANCAS,
    MUNICAO,
    OUTRAS_MELEE,
    POCOES,
)
from equipment_effects_data import (
    ARMOR_SPECIAL_DESC,
    ORGANIC_WEAPONS,
    organic_special,
    weapon_special_for,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_ARMAS = ROOT / "data" / "compendiums" / "armas.json"
OUT_EQUIP = ROOT / "data" / "compendiums" / "equipamentos.json"

CATEGORY_PT = {
    "leve": "Leve",
    "media": "Média",
    "pesada": "Pesada",
    "organica": "Orgânica",
}

BOOK_EQUIP = "CATALOGO-ARMAS-ARMADURAS-FORJA-E-POCOES.md"

ENCHANT_WEAPON_TEXT = {
    1: "Aprimoramento +1: soma +1 ao ataque e +1 ao dano.",
    2: "Aprimoramento +2: soma +2 ao ataque e +2 ao dano.",
    3: "Aprimoramento +3: soma +3 ao ataque e +3 ao dano; pode ganhar propriedade menor (Mestre).",
}

ENCHANT_ARMOR_TEXT = {
    1: "Aprimoramento +1: soma +1 de CA mágica.",
    2: "Aprimoramento +2: soma +2 de CA mágica.",
    3: "Aprimoramento +3: soma +3 de CA mágica; pode ganhar resistência menor (Mestre).",
}

POCAO_DESC = {
    "POC-01": "Restaura 2d4+2 HP ao beber (ação).",
    "POC-02": "Restaura 4d4+4 HP.",
    "POC-03": "Restaura 8d4+8 HP.",
    "POC-04": "Neutraliza um veneno ativo.",
    "POC-05": "Vantagem em saves contra veneno por 1 hora.",
    "POC-06": "FOR +2 por 1 hora.",
    "POC-07": "DES +2 por 1 hora.",
    "POC-08": "CON +2 por 1 hora.",
    "POC-09": "Vantagem em Percepção por 8 horas.",
    "POC-10": "Resistência a fogo por 1 hora.",
    "POC-11": "Resistência a gelo por 1 hora.",
    "POC-12": "Resistência a ácido por 1 hora.",
    "POC-13": "Bônus +2 em Extração por 8 horas.",
    "POC-14": "Bônus +2 em Forrageio por 8 horas.",
    "POC-15": "Imune a podridão leve por 24 horas.",
    "POC-16": "Concede 1 mutação leve estável por 8 horas.",
    "POC-17": "Reveste arma: +1d6 veneno nos próximos 5 ataques.",
    "POC-18": "Preserva ingrediente orgânico por 72 horas.",
    "POC-19": "Respiração aquática por 8 horas.",
    "POC-20": "+2 CA por 1 hora.",
    "POC-21": "Vantagem em Furtividade por 8 horas.",
    "POC-22": "Visão no escuro 18 m por 8 horas.",
    "POC-23": "Cura 1d8 HP em aliados num raio de 6 m.",
    "POC-24": "Elixir lendário: permite 1 Prato Perfeito (Mestre).",
}

MUN_DESC = {
    "MUN-01": "Pacote de 20 flechas comuns para arcos.",
    "MUN-02": "Flechas de caça: +1 dano em alvo ferido.",
    "MUN-03": "Flechas cortantes: propriedade Cortante.",
    "MUN-04": "Flechas perfurantes: crítico rola 3 dados de dano.",
    "MUN-05": "Flechas de fogo: +1d4 fogo no acerto.",
    "MUN-06": "Flechas de gelo: lentidão CD 12 no acerto.",
    "MUN-07": "Flechas de veneno: veneno CD 13 no acerto.",
    "MUN-08": "Flechas de esporo: patrulheiro / flora monstruosa.",
    "MUN-09": "Pacote de 20 virotes para bestas.",
    "MUN-10": "Virotes pesados para besta pesada.",
    "MUN-11": "Virotes perfurantes: propriedade Penetrante.",
    "MUN-12": "Agulhas para zarabatana (10 unidades).",
}


def slug(s: str) -> str:
    import unicodedata

    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    out = []
    for c in s:
        out.append(c if c.isalnum() else "-")
    return "-".join("".join(out).split("-")).strip("-")


def weapon_entry(
    canon_id: str,
    name: str,
    formula: str,
    alcance: int,
    tipo: str = "perfurante",
    bonus: int = 0,
    enchant: int = 0,
) -> dict:
    display = name if enchant == 0 else f"{name} +{enchant}"
    entry_id = f"armas-{slug(canon_id)}"
    if enchant:
        entry_id += f"-mais-{enchant}"
    parts = [
        f"<strong>{display}</strong> ({canon_id}).",
        f"Dano {formula} {tipo}, alcance {alcance} hex, 1 PA por ataque.",
        f"Ataque {bonus + enchant:+d}.",
    ]
    special = weapon_special_for(canon_id, enchant)
    if special:
        labels = []
        effs = special.get("effects", [special])
        for e in effs:
            labels.append(e.get("label", e.get("effectId", "?")))
        parts.append(f"Efeito: {', '.join(labels)}.")
    if enchant:
        parts.append(ENCHANT_WEAPON_TEXT[enchant])
    desc = f"<p>{' '.join(parts)}</p>"
    weapon_sys: dict = {
        "dano": {"formula": formula, "tipo": tipo},
        "ataque": {"bonus": bonus + enchant},
    }
    if special:
        weapon_sys["special"] = special
    return {
        "id": entry_id,
        "name": display,
        "type": "arma",
        "system": {
            "description": desc,
            "catalogId": canon_id if enchant == 0 else f"{canon_id}-E{enchant}",
            "bookRef": BOOK_EQUIP,
            "enchant": enchant,
            "tactical": {
                "alcanceHex": {"value": alcance, "min": 0},
                "custoPontosAcao": {"value": 1, "min": 0},
            },
            "weapon": weapon_sys,
        },
    }


def armor_entry(
    canon_id: str,
    name: str,
    categoria: str,
    ca_base: int,
    enchant: int,
) -> dict:
    bonus_ca = enchant
    display = name if enchant == 0 else f"{name} +{enchant}"
    entry_id = f"equipamentos-{slug(canon_id)}"
    if enchant:
        entry_id += f"-mais-{enchant}"
    parts = [
        f"<strong>{display}</strong> ({canon_id}).",
        f"Armadura {CATEGORY_PT.get(categoria, categoria)}, CA base {ca_base}.",
    ]
    armor_sys: dict = {"categoria": categoria, "caBase": ca_base}
    note = ARMOR_SPECIAL_DESC.get(canon_id)
    if note and enchant == 0:
        parts.append(note + ".")
        armor_sys["special"] = {
            "effectId": canon_id,
            "trigger": "whileEquipped",
            "kind": "narrative",
            "label": note,
        }
    if enchant:
        parts.append(ENCHANT_ARMOR_TEXT[enchant])
    desc = f"<p>{' '.join(parts)}</p>"
    return {
        "id": entry_id,
        "name": display,
        "type": "equipamento",
        "system": {
            "description": desc,
            "catalogId": canon_id if enchant == 0 else f"{canon_id}-E{enchant}",
            "bookRef": BOOK_EQUIP,
            "enchant": enchant,
            "armor": armor_sys,
            "gear": {"peso": 2, "equipado": False},
            "tactical": {"bonusDefesa": {"value": bonus_ca}},
        },
    }


def potion_entry(canon_id: str, name: str, effect: str) -> dict:
    text = POCAO_DESC.get(canon_id, effect)
    return {
        "id": f"equipamentos-{slug(canon_id)}",
        "name": name,
        "type": "equipamento",
        "system": {
            "description": f"<p><strong>{name}</strong> ({canon_id}). {text}</p>",
            "catalogId": canon_id,
            "bookRef": BOOK_EQUIP,
            "consumable": True,
            "gear": {"peso": 1, "equipado": False},
        },
    }


def ammo_entry(canon_id: str, name: str, weapon_type: str) -> dict:
    text = MUN_DESC.get(canon_id, f"Munição para {weapon_type}.")
    return {
        "id": f"equipamentos-{slug(canon_id)}",
        "name": name,
        "type": "equipamento",
        "system": {
            "description": f"<p><strong>{name}</strong> ({canon_id}). {text}</p>",
            "catalogId": canon_id,
            "bookRef": BOOK_EQUIP,
            "ammo": {"weaponType": weapon_type},
            "gear": {"peso": 1, "equipado": False},
        },
    }


def main() -> int:
    armas: list[dict] = []

    for cid, name, dmg, rng in ARCOS_LONGOS + ARCOS_CURTOS + BESTAS:
        for ench in ENCHANT_LEVELS:
            armas.append(weapon_entry(cid, name, dmg, rng, "perfurante", 0, ench))

    for cid, name, dmg, rng, tipo in ESPADAS + LANCAS + OUTRAS_MELEE:
        for ench in ENCHANT_LEVELS:
            armas.append(weapon_entry(cid, name, dmg, rng, tipo, 0, ench))

    for row in ORGANIC_WEAPONS:
        cid, name, dmg, rng, tipo, effect_ids = row
        entry_id = f"armas-{slug(cid)}"
        special = organic_special(effect_ids)
        desc = (
            f"<p><strong>{name}</strong> ({cid}). Arma orgânica: dano {dmg} {tipo}, "
            f"alcance {rng} hex. CD de durabilidade na ficha; efeitos do catálogo ORG.</p>"
        )
        weapon_sys: dict = {
            "dano": {"formula": dmg, "tipo": tipo},
            "ataque": {"bonus": 1},
        }
        if special:
            weapon_sys["special"] = special
        armas.append(
            {
                "id": entry_id,
                "name": name,
                "type": "arma",
                "system": {
                    "description": desc,
                    "catalogId": cid,
                    "bookRef": BOOK_EQUIP,
                    "enchant": 0,
                    "organic": True,
                    "tactical": {
                        "alcanceHex": {"value": rng, "min": 0},
                        "custoPontosAcao": {"value": 1, "min": 0},
                    },
                    "weapon": weapon_sys,
                },
            }
        )

    # dedupe by id
    seen: set[str] = set()
    armas_unique = []
    for a in armas:
        if a["id"] not in seen:
            seen.add(a["id"])
            armas_unique.append(a)

    equip: list[dict] = []
    for row in ARMADURAS:
        cid, name, cat, ca, *_ = row
        for ench in ENCHANT_LEVELS:
            equip.append(armor_entry(cid, name, cat, ca, ench))

    for cid, name, effect in POCOES:
        equip.append(potion_entry(cid, name, effect))

    for cid, name, wtype in MUNICAO:
        equip.append(ammo_entry(cid, name, wtype))

    # utilitários legado
    legacy_util = [
        ("equipamentos-kit-de-trinchar", "Kit de Trinchar", 0),
        ("equipamentos-tocha-de-masmorra", "Tocha de Masmorra", 0),
        ("equipamentos-corda-de-seda-de-aranha", "Corda de Seda de Aranha", 0),
        ("equipamentos-kit-de-brasas-mágicas", "Kit de Brasas Mágicas (6)", 0),
        ("equipamentos-forja-portátil-do-artífice", "Forja Portátil do Artífice", 0),
    ]
    for eid, name, bonus in legacy_util:
        if eid not in {e["id"] for e in equip}:
            canon_id = "UTL-" + slug(eid.replace("equipamentos-", ""))
            equip.append(
                {
                    "id": eid,
                    "name": name,
                    "type": "equipamento",
                    "system": {
                        "description": f"<p>{name}</p>",
                        "catalogId": canon_id,
                        "gear": {"peso": 2, "equipado": False},
                        **({"tactical": {"bonusDefesa": {"value": bonus}}} if bonus else {}),
                    },
                }
            )

    OUT_ARMAS.write_text(
        json.dumps(armas_unique, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    OUT_EQUIP.write_text(
        json.dumps(equip, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"armas: {len(armas_unique)} -> {OUT_ARMAS.name}")
    print(f"equipamentos: {len(equip)} -> {OUT_EQUIP.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
