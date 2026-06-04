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
    desc = f"<p>Ataque +{bonus + enchant} · Dano {formula}.</p>"
    special = weapon_special_for(canon_id, enchant)
    if special:
        labels = []
        effs = special.get("effects", [special])
        for e in effs:
            labels.append(e.get("label", e.get("effectId", "?")))
        desc = desc[:-4] + f" · Efeito: {', '.join(labels)}.</p>"
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
            "catalogId": canon_id,
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
    desc = (
        f"<p>{CATEGORY_PT.get(categoria, categoria)} · CA base {ca_base}"
        + (f" +{bonus_ca} mágico" if bonus_ca else "")
        + ".</p>"
    )
    armor_sys: dict = {"categoria": categoria, "caBase": ca_base}
    note = ARMOR_SPECIAL_DESC.get(canon_id)
    if note and enchant == 0:
        desc = desc[:-4] + f" · {note}.</p>"
        armor_sys["special"] = {
            "effectId": canon_id,
            "trigger": "whileEquipped",
            "kind": "narrative",
            "label": note,
        }
    return {
        "id": entry_id,
        "name": display,
        "type": "equipamento",
        "system": {
            "description": desc,
            "catalogId": canon_id,
            "enchant": enchant,
            "armor": armor_sys,
            "gear": {"peso": 2, "equipado": False},
            "tactical": {"bonusDefesa": {"value": bonus_ca}},
        },
    }


def potion_entry(canon_id: str, name: str, effect: str) -> dict:
    return {
        "id": f"equipamentos-{slug(canon_id)}",
        "name": name,
        "type": "equipamento",
        "system": {
            "description": f"<p>{effect}</p>",
            "catalogId": canon_id,
            "consumable": True,
            "gear": {"peso": 1, "equipado": False},
        },
    }


def ammo_entry(canon_id: str, name: str, weapon_type: str) -> dict:
    return {
        "id": f"equipamentos-{slug(canon_id)}",
        "name": name,
        "type": "equipamento",
        "system": {
            "description": f"<p>Munição para {weapon_type}.</p>",
            "catalogId": canon_id,
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
        desc = f"<p>Arma orgânica · CD de durabilidade na ficha.</p>"
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
