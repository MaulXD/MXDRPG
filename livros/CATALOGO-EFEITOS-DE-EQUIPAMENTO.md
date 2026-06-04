# Catálogo — Efeitos de equipamento (EFE)

> IDs **`EFE-##`** ligam regras (Cap. 14.8), compendium VTT (`weapon.special` / `armor.special`) e mesa.  
> **Regenerar armas:** `python scripts/gen-equipment-compendium.py`

---

## Gatilhos (VTT)

| Gatilho | Quando |
|---------|--------|
| `onHit` | Ataque acerta (não natural 1) |
| `onCrit` | Natural 20 no ataque |
| `whileEquipped` | Narrativo / Mestre (armadura orgânica) |

## Tipos (VTT)

| kind | Efeito |
|------|--------|
| `healSelf` | Cura atacante (`amount` HP) |
| `bonusDamage` | Soma dano ao golpe (`formula`, `damageType`) |
| `narrative` | Só texto no item; sem automação |

---

## Templates EFE-01–EFE-10

| ID | Gatilho | kind | Parâmetros | Uso típico |
|----|---------|------|------------|------------|
| EFE-01 | onHit | healSelf | +1 HP | Vampírico |
| EFE-02 | onCrit | healSelf | +2 HP | Sede de sangue |
| EFE-03 | onHit | bonusDamage | 1d4 veneno | Veneno leve |
| EFE-04 | onHit | bonusDamage | 1d6 veneno | Veneno |
| EFE-05 | onCrit | bonusDamage | 2d6 necrótico | Pulso necrótico |
| EFE-06 | onCrit | bonusDamage | 1d8 contundente | Esmagadora |
| EFE-07 | onHit | bonusDamage | 1d6 fogo | Ignição |
| EFE-08 | onHit | bonusDamage | 1d6 mágico | Corte prateado |
| EFE-09 | onCrit | bonusDamage | 2d6 frio | Congelamento |
| EFE-10 | onHit | bonusDamage | 1d8 perfurante | Ferrão |

---

## Armas mundanas com efeito base

| ID arma | Efeito base | +3 extra |
|---------|-------------|----------|
| WPN-S01 | EFE-01 | — |
| WPN-S07 | EFE-03 | — |
| WPN-S10 | EFE-02 | — |
| WPN-S12 | EFE-08 | — |
| WPN-P05 | EFE-03 | — |
| WPN-O05 | EFE-06 | — |
| ARC-L06, ARC-C05 | EFE-04 | — |
| BST-03 | EFE-10 | — |
| WPN-S02, WPN-S09, WPN-O04 | — | EFE-01 ou EFE-02 / EFE-06 |

**Regra +3:** herda efeitos de +0…+2; em **+3** ganha linha extra da tabela ou **EFE-01** se a arma não tinha efeito.

---

## Orgânicas (ORG-01–ORG-08)

| ID | Nome | Efeitos VTT |
|----|------|-------------|
| ORG-01 | Lâmina de Dente de Wyvern | EFE-04 |
| ORG-02 | Maça de Fêmur Milenar | EFE-05 |
| ORG-03 | Adaga de Quelícera | EFE-03 |
| ORG-04 | Espada de Escama de Dragão | EFE-07 |
| ORG-05 | Lança de Ferrão de Escorpião | EFE-10 |
| ORG-06 | Martelo Fornalha | EFE-07 + EFE-06 |
| ORG-07 | Arco de Osso de Grifo | — (+1 alcance na ficha) |
| ORG-08 | Espada de Garra de Gelo | EFE-09 |

Saves, lentidão e HP máximo reduzido: **Mestre** (Cap. 15) até motor de save no ataque.

---

## Armaduras (narrativo)

| ID | Nota `whileEquipped` |
|----|----------------------|
| ARM-14 | Resistência narrativa a petrificação |
| ARM-15 | Regenera 1 CA em descanso curto |
| ARM-16 | Resistência a perfurante |

---

## JSON (arma)

```json
"weapon": {
  "dano": { "formula": "1d8", "tipo": "cortante" },
  "ataque": { "bonus": 1 },
  "special": {
    "effectId": "EFE-01",
    "trigger": "onHit",
    "kind": "healSelf",
    "amount": 1,
    "label": "Vampírico"
  }
}
```

Vários efeitos:

```json
"special": {
  "effects": [
    { "effectId": "EFE-07", "trigger": "onHit", "kind": "bonusDamage", "formula": "1d6", "damageType": "fogo", "label": "Ignição" },
    { "effectId": "EFE-06", "trigger": "onCrit", "kind": "bonusDamage", "formula": "1d8", "damageType": "contundente", "label": "Esmagadora" }
  ]
}
```
