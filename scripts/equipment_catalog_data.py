# -*- coding: utf-8 -*-
"""Fonte de dados para CATALOGO + compendium VTT. IDs canonicos."""

from __future__ import annotations

METERS_PER_HEX = 1.5
DND_RANGE_SCALE = 0.7
FEET_TO_METERS = 0.3048


def dnd_normal_range_hex(feet: int) -> int:
    """Alcance normal SRD/D&D 5e em pes, escalado a 70% e arredondado em hex."""
    meters = feet * FEET_TO_METERS * DND_RANGE_SCALE
    return max(1, round(meters / METERS_PER_HEX))


def meters_bonus_hex(meters: float) -> int:
    return round(meters / METERS_PER_HEX)


# Referencia SRD (pes) — ver lib/vtt/ranged-weapon-range.ts
_HEX_LONG_BOW = dnd_normal_range_hex(150)  # 21
_HEX_SHORT_BOW = dnd_normal_range_hex(80)  # 11
_HEX_LIGHT_CROSSBOW = dnd_normal_range_hex(80)  # 11
_HEX_HEAVY_CROSSBOW = dnd_normal_range_hex(100)  # 14
_HEX_HAND_CROSSBOW = dnd_normal_range_hex(30)  # 4
_HEX_THROWN = dnd_normal_range_hex(20)  # 4

# Arcos longos (9) — ID ARC-L01 … ARC-L09
ARCOS_LONGOS = [
    ("ARC-L01", "Arco Longo de Vinha", "1d8", _HEX_LONG_BOW),
    ("ARC-L02", "Arco Longo de Teixo", "1d8", _HEX_LONG_BOW),
    ("ARC-L03", "Arco Longo de Grimwald", "1d8", _HEX_LONG_BOW),
    ("ARC-L04", "Arco Longo de Prata", "1d8", _HEX_LONG_BOW),
    ("ARC-L05", "Arco Longo de Cripta", "1d8", _HEX_LONG_BOW),
    ("ARC-L06", "Arco Longo de Osso de Grifo", "1d10", _HEX_LONG_BOW + meters_bonus_hex(3)),
    ("ARC-L07", "Arco Longo de Dragão", "1d10", _HEX_LONG_BOW),
    ("ARC-L08", "Arco Longo de Abismo", "1d8", _HEX_LONG_BOW + 3),
    ("ARC-L09", "Arco Longo de Valdrun", "1d10", _HEX_LONG_BOW + 1),
]

# Arcos curtos (9) — ID ARC-C01 … ARC-C09
ARCOS_CURTOS = [
    ("ARC-C01", "Arco Curto de Caçador", "1d6", _HEX_SHORT_BOW),
    ("ARC-C02", "Arco Curto de Teixo", "1d6", _HEX_SHORT_BOW),
    ("ARC-C03", "Arco Curto de Goblin", "1d6", _HEX_SHORT_BOW - 2),
    ("ARC-C04", "Arco Curto de Cripta", "1d6", _HEX_SHORT_BOW),
    ("ARC-C05", "Arco Curto de Costela", "1d8", _HEX_SHORT_BOW),
    ("ARC-C06", "Arco Curto de Matriarca", "1d6", _HEX_SHORT_BOW + 1),
    ("ARC-C07", "Arco Curto de Ninho", "1d6", _HEX_SHORT_BOW),
    ("ARC-C08", "Arco Curto de Marfim", "1d6", _HEX_SHORT_BOW),
    ("ARC-C09", "Arco Curto de Valdrun", "1d8", _HEX_SHORT_BOW + 1),
]

# Bestas (8) — ID BST-01 … BST-08
BESTAS = [
    ("BST-01", "Besta Leve", "1d8", _HEX_LIGHT_CROSSBOW),
    ("BST-02", "Besta de Mão", "1d6", _HEX_HAND_CROSSBOW),
    ("BST-03", "Besta Pesada", "1d10", _HEX_HEAVY_CROSSBOW),
    ("BST-04", "Besta de Repetição", "1d8", _HEX_LIGHT_CROSSBOW),
    ("BST-05", "Besta de Assalto", "1d10", _HEX_LIGHT_CROSSBOW),
    ("BST-06", "Besta de Caverna", "1d8", _HEX_LIGHT_CROSSBOW - 2),
    ("BST-07", "Besta de Alcance", "1d10", _HEX_LONG_BOW),
    ("BST-08", "Besta de Engenharia", "1d10", _HEX_HEAVY_CROSSBOW),
]

# Armaduras (20) — ID ARM-01 … ARM-20
# (nome, categoria, ca_base, des_max, for_req, pesada)
ARMADURAS = [
    ("ARM-01", "Couro Curtido", "leve", 11, None, None, False),
    ("ARM-02", "Couro Acolchoado", "leve", 12, None, None, False),
    ("ARM-03", "Gibão de Peles", "leve", 11, None, None, False),
    ("ARM-04", "Couro Batido", "leve", 12, None, None, False),
    ("ARM-05", "Cota de Malha", "media", 13, 2, 11, False),
    ("ARM-06", "Cota de Anéis", "media", 14, 2, None, False),
    ("ARM-07", "Meia-armadura", "media", 14, 2, None, False),
    ("ARM-08", "Cota de Escamas", "media", 14, 2, None, False),
    ("ARM-09", "Brigandina", "media", 14, 2, None, False),
    ("ARM-10", "Gibão de Placas", "media", 15, 2, None, False),
    ("ARM-11", "Placas Parciais", "pesada", 15, 0, 13, True),
    ("ARM-12", "Placas Completas", "pesada", 16, 0, 15, True),
    ("ARM-13", "Cota de Malha Pesada", "pesada", 16, 0, 13, True),
    ("ARM-14", "Escamas de Dragonete", "organica", 14, 2, None, False),
    ("ARM-15", "Couro de Troll", "organica", 13, None, None, False),
    ("ARM-16", "Carapaça de Escorpião", "organica", 17, 0, 15, True),
    ("ARM-17", "Cota de Basilisco", "organica", 16, 2, None, False),
    ("ARM-18", "Placas de Golem", "organica", 17, 0, 15, True),
    ("ARM-19", "Manto de Grimwald", "leve", 11, None, None, False),
    ("ARM-20", "Arnês de Valdrun", "media", 14, 2, None, False),
]

# Poções — ID POC-01 …
POCOES = [
    ("POC-01", "Poção de Vida Menor", "2d4+2"),
    ("POC-02", "Poção de Vida", "4d4+4"),
    ("POC-03", "Poção de Vida Maior", "8d4+8"),
    ("POC-04", "Antídoto Universal", "veneno"),
    ("POC-05", "Antídoto de Masmorra", "veneno+"),
    ("POC-06", "Poção de Força de Touro", "FOR+2 1h"),
    ("POC-07", "Poção de Agilidade Felina", "DES+2 1h"),
    ("POC-08", "Poção de Vigor de Urso", "CON+2 1h"),
    ("POC-09", "Poção de Clarividência", "ADV Percepção 8h"),
    ("POC-10", "Poção de Resistência ao Fogo", "res fogo 1h"),
    ("POC-11", "Poção de Resistência ao Gelo", "res gelo 1h"),
    ("POC-12", "Poção de Resistência ao Ácido", "res ácido 1h"),
    ("POC-13", "Elixir de Trinchar", "+2 Trinchar 8h"),
    ("POC-14", "Elixir de Harmonização", "+2 Harmon 8h"),
    ("POC-15", "Tônico de Estômago de Ferro", "imune podridão leve 24h"),
    ("POC-16", "Soro de Mutação Estável", "1 mutação leve 8h"),
    ("POC-17", "Destilado de Wyvern", "arma +1d6 veneno 5 ataques"),
    ("POC-18", "Essência de Gelo Aromático", "preserva 72h"),
    ("POC-19", "Poção de Respiração Abissal", "respirar água 8h"),
    ("POC-20", "Poção de Pele de Pedra", "+2 CA 1h"),
    ("POC-21", "Poção de Passo Silencioso", "Vantagem Furtividade 8h"),
    ("POC-22", "Poção de Visão no Escuro", "18m 8h"),
    ("POC-23", "Poção de Cura de Grupo", "1d8 em 6m"),
    ("POC-24", "Elixir Lendário de Valdrun", "Prato Perfeito 1x"),
]

# Munição — ID MUN-01 …
MUNICAO = [
    ("MUN-01", "Flecha Comum (20)", "arco"),
    ("MUN-02", "Flecha de Caça (20)", "arco"),
    ("MUN-03", "Flecha Cortante (20)", "arco"),
    ("MUN-04", "Flecha Perfurante (20)", "arco"),
    ("MUN-05", "Flecha de Fogo (10)", "arco"),
    ("MUN-06", "Flecha de Gelo (10)", "arco"),
    ("MUN-07", "Flecha de Veneno (10)", "arco"),
    ("MUN-08", "Flecha de Esporo (3)", "arco"),
    ("MUN-09", "Virote Comum (20)", "besta"),
    ("MUN-10", "Virote Pesado (10)", "besta"),
    ("MUN-11", "Virote Perfurante (10)", "besta"),
    ("MUN-12", "Agulha de Zarabatana (10)", "zarabatana"),
]

# Forjas — ID FORJA-01 …
FORJAS = [
    ("FORJA-01", "Forja de Campo", "CD+2 encanto"),
    ("FORJA-02", "Forja de Ferraria", "CD normal"),
    ("FORJA-03", "Forja de Valdrun", "CD-2, +3 permitido"),
    ("FORJA-04", "Forja Ancestral Anã", "CD-2 orgânico"),
    ("FORJA-05", "Forja Portátil do Artífice", "CD+0, só +1"),
]

# Espadas clássicas (12) — WPN-S01 … WPN-S12
ESPADAS = [
    ("WPN-S01", "Lâmina de Vinha", "1d6", 1, "perfurante"),
    ("WPN-S02", "Espada Longa", "1d8", 1, "cortante"),
    ("WPN-S03", "Espada Bastarda", "1d10", 1, "cortante"),
    ("WPN-S04", "Montante", "2d6", 1, "cortante"),
    ("WPN-S05", "Rapieira", "1d8", 1, "perfurante"),
    ("WPN-S06", "Sabre de Cavalaria", "1d6", 1, "cortante"),
    ("WPN-S07", "Cimitarra de Grimwald", "1d6", 1, "cortante"),
    ("WPN-S08", "Gladius de Masmorra", "1d6", 1, "perfurante"),
    ("WPN-S09", "Claymore de Valdrun", "2d6", 1, "cortante"),
    ("WPN-S10", "Espada de Cripta", "1d8", 1, "perfurante"),
    ("WPN-S11", "Lâmina de Teixo", "1d8", 1, "cortante"),
    ("WPN-S12", "Espada de Prata", "1d8", 1, "perfurante"),
]

# Lanças e variações (10) — WPN-P01 … WPN-P10
LANCAS = [
    ("WPN-P01", "Lança Curta", "1d6", 1, "perfurante"),
    ("WPN-P02", "Lança Longa", "1d10", 2, "perfurante"),
    ("WPN-P03", "Pique de Falange", "1d10", 2, "perfurante"),
    ("WPN-P04", "Azagaia", "1d6", _HEX_THROWN, "perfurante"),
    ("WPN-P05", "Tridente", "1d6", 1, "perfurante"),
    ("WPN-P06", "Alabarda", "1d10", 2, "cortante"),
    ("WPN-P07", "Lança de Cavalaria", "1d8", 2, "perfurante"),
    ("WPN-P08", "Javelin de Caça", "1d6", _HEX_THROWN, "perfurante"),
    ("WPN-P09", "Lança de Teixo", "1d8", 2, "perfurante"),
    ("WPN-P10", "Lança de Valdrun", "1d10", 2, "perfurante"),
]

# Outras clássicas (6) — machado, maça, adaga, clava
OUTRAS_MELEE = [
    ("WPN-O01", "Adaga de Masmorra", "1d4", 1, "perfurante"),
    ("WPN-O02", "Adagas Gêmeas", "2d4", 1, "perfurante"),
    ("WPN-O03", "Machado de Batalha", "1d8", 1, "cortante"),
    ("WPN-O04", "Machado Grande", "1d12", 1, "cortante"),
    ("WPN-O05", "Maça de Guerra", "2d6", 1, "contundente"),
    ("WPN-O06", "Martelo de Guerra", "2d6", 1, "contundente"),
]

MELEE = ESPADAS + LANCAS + OUTRAS_MELEE

ENCHANT_LEVELS = [0, 1, 2, 3]
