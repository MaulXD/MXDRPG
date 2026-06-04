# -*- coding: utf-8 -*-
"""Templates EFE-* e atribuição a armas/armaduras/orgânicas (VTT + catálogo)."""

from __future__ import annotations

# trigger: onHit | onCrit | whileEquipped
# kind: healSelf | bonusDamage
EFFECT_DEFS: dict[str, dict] = {
    "EFE-01": {
        "trigger": "onHit",
        "kind": "healSelf",
        "amount": 1,
        "label": "Vampírico",
    },
    "EFE-02": {
        "trigger": "onCrit",
        "kind": "healSelf",
        "amount": 2,
        "label": "Sede de sangue",
    },
    "EFE-03": {
        "trigger": "onHit",
        "kind": "bonusDamage",
        "formula": "1d4",
        "damageType": "veneno",
        "label": "Veneno leve",
    },
    "EFE-04": {
        "trigger": "onHit",
        "kind": "bonusDamage",
        "formula": "1d6",
        "damageType": "veneno",
        "label": "Veneno",
    },
    "EFE-05": {
        "trigger": "onCrit",
        "kind": "bonusDamage",
        "formula": "2d6",
        "damageType": "necrótico",
        "label": "Pulsó necrótico",
    },
    "EFE-06": {
        "trigger": "onCrit",
        "kind": "bonusDamage",
        "formula": "1d8",
        "damageType": "contundente",
        "label": "Esmagadora",
    },
    "EFE-07": {
        "trigger": "onHit",
        "kind": "bonusDamage",
        "formula": "1d6",
        "damageType": "fogo",
        "label": "Ignição",
    },
    "EFE-08": {
        "trigger": "onHit",
        "kind": "bonusDamage",
        "formula": "1d6",
        "damageType": "mágico",
        "label": "Corte prateado",
    },
    "EFE-09": {
        "trigger": "onCrit",
        "kind": "bonusDamage",
        "formula": "2d6",
        "damageType": "frio",
        "label": "Congelamento",
    },
    "EFE-10": {
        "trigger": "onHit",
        "kind": "bonusDamage",
        "formula": "1d8",
        "damageType": "perfurante",
        "label": "Ferrão",
    },
}

# catalogId base (+0…+2 herdam; +3 ganha extra se listado)
WEAPON_BASE_EFFECT: dict[str, str] = {
    "WPN-S01": "EFE-01",
    "WPN-S07": "EFE-03",
    "WPN-S10": "EFE-02",
    "WPN-S12": "EFE-08",
    "WPN-P05": "EFE-03",
    "WPN-O05": "EFE-06",
    "ARC-L06": "EFE-04",
    "ARC-C05": "EFE-04",
    "BST-03": "EFE-10",
}

WEAPON_ENCHANT3_EXTRA: dict[str, str] = {
    "WPN-S02": "EFE-01",
    "WPN-S09": "EFE-02",
    "WPN-O04": "EFE-06",
}

# Armadura: efeitos só descritos na mesa por enquanto (whileEquipped sem motor)
ARMOR_SPECIAL_DESC: dict[str, str] = {
    "ARM-14": "Resistência narrativa a petrificação.",
    "ARM-15": "Regenera 1 CA em descansó curto (Mestre).",
    "ARM-16": "Resistência a perfurante (Mestre).",
}

# Orgânicas Cap. 15 — só +0 no compendium
ORGANIC_WEAPONS: list[tuple] = [
    # cid, name, formula, range, tipo, effects (efe ids)
    ("ORG-01", "Lâmina de Dente de Wyvern", "1d8", 1, "perfurante", ["EFE-04"]),
    ("ORG-02", "Maça de Fêmur Milenar", "2d6", 1, "contundente", ["EFE-05"]),
    ("ORG-03", "Adaga de Quelícera", "1d6", 1, "perfurante", ["EFE-03"]),
    ("ORG-04", "Espada de Escama de Dragão", "1d10", 1, "cortante", ["EFE-07"]),
    ("ORG-05", "Lança de Ferrão de Escorpião", "1d8", 2, "perfurante", ["EFE-10"]),
    ("ORG-06", "Martelo Fornalha", "2d8", 1, "contundente", ["EFE-07", "EFE-06"]),
    ("ORG-07", "Arco de Osso de Grifo", "1d10", 6, "perfurante", []),
    ("ORG-08", "Espada de Garra de Gelo", "1d10", 1, "cortante", ["EFE-09"]),
]


def effect_payload(effect_id: str) -> dict:
    base = EFFECT_DEFS[effect_id]
    return {"effectId": effect_id, **base}


def weapon_special_for(canon_id: str, enchant: int) -> dict | None:
    effects: list[dict] = []
    base_id = WEAPON_BASE_EFFECT.get(canon_id)
    if base_id:
        effects.append(effect_payload(base_id))
    if enchant >= 3:
        extra = WEAPON_ENCHANT3_EXTRA.get(canon_id)
        if extra and all(e["effectId"] != extra for e in effects):
            effects.append(effect_payload(extra))
        elif not effects:
            effects.append(effect_payload("EFE-01"))
    if not effects:
        return None
    return {"effects": effects} if len(effects) > 1 else effects[0]


def organic_special(effect_ids: list[str]) -> dict | None:
    if not effect_ids:
        return None
    effects = [effect_payload(e) for e in effect_ids]
    return {"effects": effects} if len(effects) > 1 else effects[0]
