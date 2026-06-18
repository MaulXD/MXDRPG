# CATÁLOGO — ARMAS, ARMADURAS, FORJA, MUNIÇÃO E POÇÕES — Eldarin v4.0

> IDs canônicos · encantamento **+1 / +2 / +3** · forja mágica (Artífice) · VTT: `python scripts/gen-equipment-compendium.py`  
> Índice geral: `TABELA-IDS-ELDARIN.md`

---

## Convenção de ID e encantamento

| Sufixo | Significado | Efeito (arma) | Efeito (armadura) |
|--------|-------------|---------------|-------------------|
| *(sem sufixo)* | Base +0 | Dano/ataque da ficha | CA da tabela |
| **-E1** / nome **+1** | Encantamento +1 | +1 ataque e +1 dano | +1 CA mágica |
| **-E2** | +2 | +2 / +2 | +2 CA |
| **-E3** | +3 | +3 / +3 (+ propriedade menor, Mestre) | +3 CA (+ resistência menor) |

**ID VTT:** `armas-arc-l01-mais-2` = **ARC-L02-E2** (Arco Longo de Teixo +2).

**Empilhamento:** encantamento **não** acumula com segunda arma; armadura mágica substitui bônus anterior no mesmo slot.

### Texto na ficha (VTT)

Cada entrada do compêndio inclui **descrição de uso** gerada por `scripts/gen-equipment-compendium.py`:

| Variante | Arma (texto na ficha) | Armadura (texto na ficha) |
|----------|----------------------|---------------------------|
| **+0** | Dano, alcance (células), PA 1, efeito base (se houver) | Categoria, CA base, nota especial (se houver) |
| **+1** | Herda efeitos de +0 · **+1 ataque e +1 dano** | Herda nota de +0 · **+1 CA mágica** |
| **+2** | Herda efeitos · **+2 ataque e +2 dano** | **+2 CA mágica** |
| **+3** | Herda efeitos · **+3 ataque e +3 dano** (+ propriedade menor, Mestre) | **+3 CA mágica** (+ resistência menor, Mestre) |

**Referência na ficha:** `catalogId` (ex.: `WPN-S02`, `ARM-01-E2`) e `bookRef` apontando para este catálogo.

**Alcance à distância (células):** derivado do SRD/D&D 5e a **70%** — arco longo **21 células** (32 m), arco curto **11 células** (17 m), besta leve **11 células**, besta pesada **14 células**, besta de mão **4 células**. Ver `lib/vtt/ranged-weapon-range.ts` e Livro do Jogador §14.1.

---

## Arcos longos (9) — ARC-L01 a ARC-L09

| ID | Nome | Dano | Alcance (cél.) |
|----|------|------|-------------|
| ARC-L01 | Arco Longo de Vinha | 1d8 | 21 |
| ARC-L02 | Arco Longo de Teixo | 1d8 | 21 |
| ARC-L03 | Arco Longo de Grimwald | 1d8 | 21 |
| ARC-L04 | Arco Longo de Prata | 1d8 | 21 |
| ARC-L05 | Arco Longo de Cripta | 1d8 | 21 |
| ARC-L06 | Arco Longo de Osso de Grifo | 1d10 | 23 |
| ARC-L07 | Arco Longo de Dragão | 1d10 | 21 |
| ARC-L08 | Arco Longo de Abismo | 1d8 | 24 |
| ARC-L09 | Arco Longo de Valdrun | 1d10 | 22 |

Cada linha existe em **+0, +1, +2, +3** (36 entradas VTT).

---

## Arcos curtos (9) — ARC-C01 a ARC-C09

| ID | Nome | Dano | Alcance (cél.) |
|----|------|------|-------------|
| ARC-C01 | Arco Curto de Caçador | 1d6 | 11 |
| ARC-C02 | Arco Curto de Teixo | 1d6 | 11 |
| ARC-C03 | Arco Curto de Goblin | 1d6 | 9 |
| ARC-C04 | Arco Curto de Cripta | 1d6 | 11 |
| ARC-C05 | Arco Curto de Costela | 1d8 | 11 |
| ARC-C06 | Arco Curto de Matriarca | 1d6 | 12 |
| ARC-C07 | Arco Curto de Ninho | 1d6 | 11 |
| ARC-C08 | Arco Curto de Marfim | 1d6 | 11 |
| ARC-C09 | Arco Curto de Valdrun | 1d8 | 12 |

Cada linha em **+0 a +3** (36 entradas VTT).

---

## Bestas (8) — BST-01 a BST-08

| ID | Nome | Dano | Alcance (cél.) | Nota |
|----|------|------|-------------|------|
| BST-01 | Besta Leve | 1d8 | 11 | Recarga |
| BST-02 | Besta de Mao | 1d6 | 4 | Leve |
| BST-03 | Besta Pesada | 1d10 | 14 | Pesada |
| BST-04 | Besta de Repetição | 1d8 | 11 | Recarga reduzida |
| BST-05 | Besta de Assalto | 1d10 | 11 | Penetrante |
| BST-06 | Besta de Caverna | 1d8 | 9 | Compacta |
| BST-07 | Besta de Alcance | 1d10 | 21 | Pesada |
| BST-08 | Besta de Engenharia | 1d10 | 14 | Artífice |

Cada linha em **+0 a +3** (32 entradas VTT).

---

## Espadas clássicas (12) — WPN-S01 a WPN-S12

| ID | Nome | Dano | Alcance (cél.) |
|----|------|------|-------------|
| WPN-S01 | Lâmina de Vinha | 1d6 perf. | 1 |
| WPN-S02 | Espada Longa | 1d8 cort. | 1 |
| WPN-S03 | Espada Bastarda | 1d10 cort. | 1 |
| WPN-S04 | Montante | 2d6 cort. | 1 |
| WPN-S05 | Rapieira | 1d8 perf. | 1 |
| WPN-S06 | Sabre de Cavalaria | 1d6 cort. | 1 |
| WPN-S07 | Cimitarra de Grimwald | 1d6 cort. | 1 |
| WPN-S08 | Gladius de Masmorra | 1d6 perf. | 1 |
| WPN-S09 | Claymore de Valdrun | 2d6 cort. | 1 |
| WPN-S10 | Espada de Cripta | 1d8 perf. | 1 |
| WPN-S11 | Lâmina de Teixo | 1d8 cort. | 1 |
| WPN-S12 | Espada de Prata | 1d8 perf. | 1 |

Cada linha em **+0 a +3** (48 entradas VTT).

---

## Lanças e variações (10) — WPN-P01 a WPN-P10

| ID | Nome | Dano | Alcance (cél.) |
|----|------|------|-------------|
| WPN-P01 | Lança Curta | 1d6 perf. | 1 |
| WPN-P02 | Lança Longa | 1d10 perf. | 2 |
| WPN-P03 | Pique de Falange | 1d10 perf. | 2 |
| WPN-P04 | Azagaia | 1d6 perf. | 4 |
| WPN-P05 | Tridente | 1d6 perf. | 1 |
| WPN-P06 | Alabarda | 1d10 cort. | 2 |
| WPN-P07 | Lança de Cavalaria | 1d8 perf. | 2 |
| WPN-P08 | Javelin de Caça | 1d6 perf. | 4 |
| WPN-P09 | Lança de Teixo | 1d8 perf. | 2 |
| WPN-P10 | Lança de Valdrun | 1d10 perf. | 2 |

Cada linha em **+0 a +3** (40 entradas VTT).

---

## Outras clássicas (6) — WPN-O01 a WPN-O06

Adaga, adagas gêmeas, machados, maça, martelo — IDs **WPN-O**; +0 a +3 (24 VTT).

---

## Armaduras (20) — ARM-01 a ARM-20

| ID | Nome | Categoria | CA base |
|----|------|-----------|---------|
| ARM-01 | Couro Curtido | leve | 11+DES |
| ARM-02 | Couro Acolchoado | leve | 12+DES |
| ARM-03 | Gibão de Peles | leve | 11+DES |
| ARM-04 | Couro Batido | leve | 12+DES |
| ARM-05 | Cota de Malha | media | 13+DES(max2) |
| ARM-06 | Cota de Anéis | media | 14+DES(max2) |
| ARM-07 | Meia-armadura | media | 14+DES(max2) |
| ARM-08 | Cota de Escamas | media | 14+DES(max2) |
| ARM-09 | Brigandina | media | 14+DES(max2) |
| ARM-10 | Gibão de Placas | media | 15+DES(max2) |
| ARM-11 | Placas Parciais | pesada | 15 |
| ARM-12 | Placas Completas | pesada | 16 |
| ARM-13 | Cota de Malha Pesada | pesada | 16 |
| ARM-14 | Escamas de Dragonete | orgânica | 14+DES(max2) |
| ARM-15 | Couro de Troll | orgânica | 13+DES |
| ARM-16 | Carapaça de Escorpião | orgânica | 17 |
| ARM-17 | Cota de Basilisco | orgânica | 16+DES(max2) |
| ARM-18 | Placas de Golem | orgânica | 17 |
| ARM-19 | Manto de Grimwald | leve | 11+DES |
| ARM-20 | Arnês de Valdrun | media | 14+DES(max2) |

Cada linha em **+0 a +3** (80 entradas VTT). Encantamento soma **CA mágica** (nao altera categoria leve/media/pesada).

---

## Munição (12) — MUN-01 a MUN-12

| ID | Nome | Uso |
|----|------|-----|
| MUN-01 | Flecha Comum (20) | Arcos |
| MUN-02 | Flecha de Caça (20) | +1 dano situacional |
| MUN-03 | Flecha Cortante (20) | Propriedade Cortante |
| MUN-04 | Flecha Perfurante (20) | Crit 3 dados |
| MUN-05 | Flecha de Fogo (10) | +1d4 fogo |
| MUN-06 | Flecha de Gelo (10) | Lentidão CD 12 |
| MUN-07 | Flecha de Veneno (10) | Veneno CD 13 |
| MUN-08 | Flecha de Esporo (3) | Patrulheiro / flora |
| MUN-09 | Virote Comum (20) | Bestas |
| MUN-10 | Virote Pesado (10) | Besta pesada |
| MUN-11 | Virote Perfurante (10) | Penetrante |
| MUN-12 | Agulha de Zarabatana (10) | Zarabatana |

---

## Pocoes (24) — POC-01 a POC-24

| ID | Nome | Efeito resumido |
|----|------|-----------------|
| POC-01 | Poção de Vida Menor | 2d4+2 HP |
| POC-02 | Poção de Vida | 4d4+4 HP |
| POC-03 | Poção de Vida Maior | 8d4+8 HP |
| POC-04 | Antidoto Universal | Neutraliza 1 veneno |
| POC-05 | Antidoto de Masmorra | Vantagem save veneno 1h |
| POC-06 | Poção de Força de Touro | FOR +2, 1h |
| POC-07 | Poção de Agilidade Felina | DES +2, 1h |
| POC-08 | Poção de Vigor de Urso | CON +2, 1h |
| POC-09 | Poção de Clarividência | Vantagem Percepção 8h |
| POC-10 | Resistência ao Fogo | Res. fogo 1h |
| POC-11 | Resistência ao Gelo | Res. gelo 1h |
| POC-12 | Resistência ao Ácido | Res. ácido 1h |
| POC-13 | Elixir de Extração | +2 Extração 8h |
| POC-14 | Elixir de Forrageio | +2 Harmon 8h |
| POC-15 | Tônico de Fortitude | Imune podridao leve 24h |
| POC-16 | Soro de Mutação Estavel | 1 mutação leve 8h |
| POC-17 | Destilado de Wyvern | Arma +1d6 veneno, 5 ataques |
| POC-18 | Essência de Gelo Aromático | Preserva ingrediente 72h |
| POC-19 | Respiração Abissal | Respirar agua 8h |
| POC-20 | Pele de Pedra | +2 CA 1h |
| POC-21 | Passo Silencioso | Vantagem Furtividade 8h |
| POC-22 | Visao no Escuro | 18m, 8h |
| POC-23 | Cura de Grupo | 1d8 HP, raio 6m |
| POC-24 | Elixir Lendário de Valdrun | 1 Prato Perfeito automatico |

---

## Forjas (5) — FORJA-01 a FORJA-05

| ID | Nome | Efeito na mesa |
|----|------|----------------|
| FORJA-01 | Forja de Campo | CD encantamento +2; so +1 |
| FORJA-02 | Forja de Ferraria | CD padrão (cidade) |
| FORJA-03 | Forja de Valdrun | CD -2; permite +3 |
| FORJA-04 | Forja Ancestral Ana | CD -2 em orgânico |
| FORJA-05 | Forja Portátil do Artífice | CD padrão; so +1; 4h montagem |

---

## Forja mágica — regras (Artífice)

**Quem:** **Artífice** (qualquer subclasse) com ferramentas de ferreiro; **Ferreiro de Utensilios** reduz tempo e pode +3 em armadura que veste.

**Requisitos:** forja (**FORJA-xx**) + item base (mundano ou orgânico) + materiais:

| Encantamento | CD (INT + prof. ferreiro) | Tempo | Materiais |
|--------------|---------------------------|-------|-----------|
| **+1** | 12 | 8 h | 50 po ou 1 MIN Comum |
| **+2** | 16 | 24 h | 200 po ou 1 MIN Incomum + 1 ESP |
| **+3** | 20 | 72 h | 600 po ou 1 MIN Raro + 1 TES menor; **so FORJA-03/04** |

**Falha:** falha por 5+ → item danificado (reparo 4h, metade do custo). Falha critica (1) → item destruido.

**Ferreiro de Utensilios:** CD -2 em armaduras; -1 CD em armas; **Forja Rápida (nv 16):** +1 em 4h (1 item ativo).

**Infusão (classe):** mesmo teste; pode infundir item **mundano** encontrado na masmorra sem forjar do zero.

**Habilidade VTT:** `habilidades-forja-mágica-de-valdrun` (Cap. 14.7).

---

## Alquimia — pocoes (Biologo + Artífice)

**Biologo Alquimico:** **Catalisador (nv 8)** — dobra ingrediente Comum em poção (10 min). **Laboratorio de Campo (nv 12)** — antidoto 5 min.

**Qualquer Artífice:** INT + kit alquimia CD 12 (POC Comum), 15 (Incomum), 18 (Raro). 30 min por poção; 2 pocoes por descanso curto em laboratorio.

**Mago/Clérigo:** magias *Preservacao*, *Identificar* ajudam; não substituem craft de POC sem talento.

---

## Lacunas que ainda podem expandir

| Categoria | Antes | Agora |
|-----------|-------|-------|
| Arcos | 2 tipos (livro) | **18 tipos** x 4 encantos |
| **Espadas** | 3 no VTT antigo | **12** x 4 encantos |
| **Lanças** | 1–2 | **10** x 4 encantos |
| Bestas | 4 | **8** x 4 encantos |
| Armaduras nomeadas | 11 | **20** x 4 encantos |
| Flechas/virote | 0 catálogo | **12 MUN** |
| Pocoes | 2 no VTT | **24 POC** |
| Forja explicita | so Infusão 1 linha | **FORJA-01–05** + Cap. 14.7 |

**Ainda escasso (opcional futuro):** escudos com encantamento (4 tipos), armas orgânicas com ID (Cap. 15), rede/fundas catalogadas.

---

*Regenerar VTT: `python scripts/gen-equipment-compendium.py` · `python scripts/gen-tabela-ids.py`*
