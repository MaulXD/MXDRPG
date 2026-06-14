# TABELA DE IDs — Eldarin v4.0

> Registro unificado de identificadores para mesa, VTT (`data/compendiums/`) e documentação.  
> **Regenerar:** `python scripts/gen-tabela-ids.py`

---

## Convenção de prefixos

| Prefixo | Domínio | Formato | Exemplo | Onde |
| --- | --- | --- | --- | --- |
| `MON` | Espécime canônico (assimilação + saque) | `MON-###` ou `###` | MON-001 / 001 | LM · Jogador 6.2 |
| `P` / `PLT` | Flora de masmorra | `P-##` | P-03 | Cap. 5B |
| `BIO` | Bioma de masmorra | `BIO-##` | BIO-09 | Biomas aprofundados |
| `MS` | Masmorra (Boca) | `MS-##` | MS-01 | LM Cap. 21 |
| `ESP` | Especiaria | `ESP-##` | ESP-12 | Catálogo tesouros |
| `MIN` | Minério | `MIN-##` | MIN-01 | Catálogo tesouros |
| `TES` | Tesouro / joia | `TES-##` | TES-11 | Catálogo tesouros |
| `OBJ-G` | Objeto de cenário global | `OBJ-G##` | OBJ-G08 | Catálogo cenário |
| `OBJ-B` | Objeto por bioma | `OBJ-B##-##` | OBJ-B09-03 | Catálogo cenário |
| `OBJ-R` | Recurso econômico | `OBJ-R##` | OBJ-R01 | Catálogo cenário |
| `armas-` | Arma (VTT) | `armas-{slug}` | armas-lâmina-de-vinha | compendiums/armas.json |
| `habilidades-` | Habilidade tática | `habilidades-{slug}` | habilidades-investida-do-guerreiro | compendiums/habilidades.json |
| `magias-` | Magia | `magias-{slug}` | magias-calor-de-panela | compendiums/magias.json |
| `equipamentos-` | Equipamento | `equipamentos-{slug}` | equipamentos-kit-de-trinchar | compendiums/equipamentos.json |
| `monstros-` | Ficha VTT de monstro | `monstros-{slug}` | monstros-zumbi-de-masmorra | compendiums/monstros.json |
| `PC` | Personagem jogador | `pc-{id}` | pc-aventureiro | characters.ts / API |
| `ROOM` | Mesa VTT | `room-{id}` | room-demo | room state |
| `USR` | Conta | `usr_{slug}` | usr_demo_jogador | auth seed |
| `CLA` | Classe | `CLA-{slug}` | CLA-guerreiro | Jogador Parte III |
| `RAC` | Raça | `RAC-{slug}` | RAC-humano | Jogador Parte III |
| `LIN` | Linhagem meio-humano | `LIN-{slug}` | LIN-gato | Jogador Parte III |
| `ASSIM` | Habilidade assimilada | `ASSIM-{MON}-{n}` | ASSIM-024-3 | Assimilação por espécime |
| `ARC-L` | Arco longo | `ARC-L##` (+E1-3) | ARC-L06-E2 | Catálogo forja |
| `ARC-C` | Arco curto | `ARC-C##` | ARC-C09 | Catálogo forja |
| `BST` | Besta | `BST-##` | BST-08 | Catálogo forja |
| `ARM` | Armadura | `ARM-##` | ARM-12-E3 | Catálogo forja |
| `POC` | Poção | `POC-##` | POC-02 | Catálogo forja |
| `MUN` | Munição | `MUN-##` | MUN-05 | Catálogo forja |
| `FORJA` | Forja | `FORJA-##` | FORJA-03 | Cap. 14.7 |
| `WPN-S` | Espada | `WPN-S##` | WPN-S02 | Catálogo forja |
| `WPN-P` | Lança / haste | `WPN-P##` | WPN-P02 | Catálogo forja |
| `WPN-O` | Outra melee | `WPN-O##` | WPN-O03 | Catálogo forja |
| `EFE` | Efeito de equipamento | `EFE-##` | EFE-01 | Cap. 14.8 · VTT special |
| `ORG` | Arma orgânica | `ORG-##` | ORG-01 | Cap. 15 · compêndio armas |


**Regra:** na ficha e no chat, cite o ID curto (`001`, `ESP-12`, `OBJ-B04-02`). No VTT e inventário, use o `entryId` completo do compêndio.

---

## Monstros — espécimes 001–060 (canônicos)

| ID | MON | Nome | VTT (slug) | Assimilação |
| --- | --- | --- | --- | --- |
| 001 | MON-001 | Zumbi de Masmorra | `monstros-zumbi-de-masmorra` | ASSIM-001-1 … 8 |
| 002 | MON-002 | Esqueleto Armado | `monstros-esqueleto-armado` | ASSIM-002-1 … 8 |
| 003 | MON-003 | Ghoul | `monstros-ghoul` | ASSIM-003-1 … 8 |
| 004 | MON-004 | Espectro | `monstros-espectro` | ASSIM-004-1 … 8 |
| 005 | MON-005 | Lich (Arquiliche) | `monstros-lich-arquiliche` | ASSIM-005-1 … 8 |
| 006 | MON-006 | Assombracao | `monstros-assombracao` | ASSIM-006-1 … 8 |
| 007 | MON-007 | Vampiro | `monstros-vampiro` | ASSIM-007-1 … 8 |
| 008 | MON-008 | Cavaleiro Espectral | `monstros-cavaleiro-espectral` | ASSIM-008-1 … 8 |
| 009 | MON-009 | Mumia | `monstros-mumia` | ASSIM-009-1 … 8 |
| 010 | MON-010 | Dragonete de Magma | `monstros-dragonete-de-magma` | ASSIM-010-1 … 8 |
| 011 | MON-011 | Wyvern | `monstros-wyvern` | ASSIM-011-1 … 8 |
| 012 | MON-012 | Dragão Jovem de Gelo | `monstros-dragao-jovem-de-gelo` | ASSIM-012-1 … 8 |
| 013 | MON-013 | Drake de Pedra | `monstros-drake-de-pedra` | ASSIM-013-1 … 8 |
| 014 | MON-014 | Dragão Anciao de Fogo | `monstros-dragao-anciao-de-fogo` | ASSIM-014-1 … 8 |
| 015 | MON-015 | Golem de Pedra | `monstros-golem-de-pedra` | ASSIM-015-1 … 8 |
| 016 | MON-016 | Armadura Animada | `monstros-armadura-animada` | ASSIM-016-1 … 8 |
| 017 | MON-017 | Golem de Ferro Vulcanico | `monstros-golem-de-ferro-vulcanico` | ASSIM-017-1 … 8 |
| 018 | MON-018 | Automato de Genio | `monstros-automato-de-genio` | ASSIM-018-1 … 8 |
| 019 | MON-019 | Minotauro | `monstros-minotauro` | ASSIM-019-1 … 8 |
| 020 | MON-020 | Basilisco | `monstros-basilisco` | ASSIM-020-1 … 8 |
| 021 | MON-021 | Manticora | `monstros-manticora` | ASSIM-021-1 … 8 |
| 022 | MON-022 | Grifo | `monstros-grifo` | ASSIM-022-1 … 8 |
| 023 | MON-023 | Cocatriz | `monstros-cocatriz` | ASSIM-023-1 … 8 |
| 024 | MON-024 | Aranha Tecerrochas | `monstros-aranha-tecerrochas` | ASSIM-024-1 … 8 |
| 025 | MON-025 | Escorpião Gigante | `monstros-escorpiao-gigante` | ASSIM-025-1 … 8 |
| 026 | MON-026 | Centopeia Caustica | `monstros-centopeia-caustica` | ASSIM-026-1 … 8 |
| 027 | MON-027 | Besouro-Diamante | `monstros-besouro-diamante` | ASSIM-027-1 … 8 |
| 028 | MON-028 | Sapo-Engolidor | `monstros-sapo-engolidor` | ASSIM-028-1 … 8 |
| 029 | MON-029 | Kraken Menor | `monstros-kraken-menor` | ASSIM-029-1 … 8 |
| 030 | MON-030 | Serpente-do-Abismo | `monstros-serpente-do-abismo` | ASSIM-030-1 … 8 |
| 031 | MON-031 | Tubarao-Cego | `monstros-tubarao-cego` | ASSIM-031-1 … 8 |
| 032 | MON-032 | Goblin de Caverna | `monstros-goblin-de-caverna` | ASSIM-032-1 … 8 |
| 033 | MON-033 | Hobgoblin Guerreiro | `monstros-hobgoblin-guerreiro` | ASSIM-033-1 … 8 |
| 034 | MON-034 | Orc de Masmorra | `monstros-orc-de-masmorra` | ASSIM-034-1 … 8 |
| 035 | MON-035 | Cogumelo-Rei | `monstros-cogumelo-rei` | ASSIM-035-1 … 8 |
| 036 | MON-036 | Treant Podre | `monstros-treant-podre` | ASSIM-036-1 … 8 |
| 037 | MON-037 | Planta Carnivora Gigante | `monstros-planta-carnivora-gigante` | ASSIM-037-1 … 8 |
| 038 | MON-038 | Slime Ácido | `monstros-slime-acido` | ASSIM-038-1 … 8 |
| 039 | MON-039 | Slime de Cristal | `monstros-slime-de-cristal` | ASSIM-039-1 … 8 |
| 040 | MON-040 | Elemental de Fogo | `monstros-elemental-de-fogo` | ASSIM-040-1 … 8 |
| 041 | MON-041 | Elemental de Gelo | `monstros-elemental-de-gelo` | ASSIM-041-1 … 8 |
| 042 | MON-042 | Yeti das Profundezas | `monstros-yeti-das-profundezas` | ASSIM-042-1 … 8 |
| 043 | MON-043 | Lobo do Inverno | `monstros-lobo-do-inverno` | ASSIM-043-1 … 8 |
| 044 | MON-044 | Mimico de Baul | `monstros-mimico-de-baul` | ASSIM-044-1 … 8 |
| 045 | MON-045 | Doppelganger | `monstros-doppelganger` | ASSIM-045-1 … 8 |
| 046 | MON-046 | Hidra das Cavernas | `monstros-hidra-das-cavernas` | ASSIM-046-1 … 8 |
| 047 | MON-047 | Quimera | `monstros-quimera` | ASSIM-047-1 … 8 |
| 048 | MON-048 | Anjo Caido | `monstros-anjo-caido` | ASSIM-048-1 … 8 |
| 049 | MON-049 | Gargula de Cristal | `monstros-gargula-de-cristal` | ASSIM-049-1 … 8 |
| 050 | MON-050 | Aberracao Tentacular | `monstros-aberracao-tentacular` | ASSIM-050-1 … 8 |
| 051 | MON-051 | Basilisco de Magma | `monstros-basilisco-de-magma` | ASSIM-051-1 … 8 |
| 052 | MON-052 | Sereia das Profundezas | `monstros-sereia-das-profundezas` | ASSIM-052-1 … 8 |
| 053 | MON-053 | Troll de Pedra | `monstros-troll-de-pedra` | ASSIM-053-1 … 8 |
| 054 | MON-054 | Ciclope | `monstros-ciclope` | ASSIM-054-1 … 8 |
| 055 | MON-055 | Harpia de Caverna | `monstros-harpia-de-caverna` | ASSIM-055-1 … 8 |
| 056 | MON-056 | Roper | `monstros-roper` | ASSIM-056-1 … 8 |
| 057 | MON-057 | Aboleth | `monstros-aboleth` | ASSIM-057-1 … 8 |
| 058 | MON-058 | Pudim Negro | `monstros-pudim-negro` | ASSIM-058-1 … 8 |
| 059 | MON-059 | Lagosta-Gigante Abissal | `monstros-lagosta-gigante-abissal` | ASSIM-059-1 … 8 |
| 060 | MON-060 | Caranguejo-Eremita Colossal | `monstros-caranguejo-eremita-colossal` | ASSIM-060-1 … 8 |
| 061 | MON-061 | Aranha-Cavaleira | `monstros-aranha-cavaleira` | ASSIM-061-1 … 8 |
| 062 | MON-062 | Mosca-Carniça Colossal | `monstros-mosca-carnica-colossal` | ASSIM-062-1 … 8 |
| 063 | MON-063 | Besouro-Trovão | `monstros-besouro-trovao` | ASSIM-063-1 … 8 |
| 064 | MON-064 | Verme Gigante de Pedra | `monstros-verme-gigante-de-pedra` | ASSIM-064-1 … 8 |
| 065 | MON-065 | Salamandra Gigante | `monstros-salamandra-gigante` | ASSIM-065-1 … 8 |
| 066 | MON-066 | Behemoth de Pedra | `monstros-behemoth-de-pedra` | ASSIM-066-1 … 8 |
| 067 | MON-067 | Fera da Sombra | `monstros-fera-da-sombra` | ASSIM-067-1 … 8 |
| 068 | MON-068 | Medusa | `monstros-medusa` | ASSIM-068-1 … 8 |
| 069 | MON-069 | Fênix de Caverna | `monstros-fenix-de-caverna` | ASSIM-069-1 … 8 |
| 070 | MON-070 | Gigante de Pedra | `monstros-gigante-de-pedra` | ASSIM-070-1 … 8 |
| 071 | MON-071 | Bruxa da Masmorra | `monstros-bruxa-da-masmorra` | ASSIM-071-1 … 8 |
| 072 | MON-072 | Fera Seminal | `monstros-fera-seminal` | ASSIM-072-1 … 8 |
| 073 | MON-073 | Carniçal Alado | `monstros-carnical-alado` | ASSIM-073-1 … 8 |
| 074 | MON-074 | Balor | `monstros-balor` | ASSIM-074-1 … 8 |
| 075 | MON-075 | Enxame de Ratos-Cadáveres | `monstros-enxame-de-ratos-cadaveres` | ASSIM-075-1 … 8 |
| 076 | MON-076 | Elemental de Terra | `monstros-elemental-de-terra` | ASSIM-076-1 … 8 |
| 077 | MON-077 | Banshee | `monstros-banshee` | ASSIM-077-1 … 8 |
| 078 | MON-078 | Morcego-Tirano | `monstros-morcego-tirano` | ASSIM-078-1 … 8 |
| 079 | MON-079 | Ooze Ocular | `monstros-ooze-ocular` | ASSIM-079-1 … 8 |
| 080 | MON-080 | Tarrasque (Bebê) | `monstros-tarrasque-bebe` | ASSIM-080-1 … 8 |

---

## Monstros — ficha estendida LM (061+)

| ID | MON | Nome |
| --- | --- | --- |
| 061 | MON-061 | ARANHA-CAVALEIRA (JINOBAKE) |
| 062 | MON-062 | MOSCA-CARNIÇA COLOSSAL |
| 063 | MON-063 | BESOURO-TROVÃO |
| 064 | MON-064 | VERME GIGANTE DE PEDRA |
| 065 | MON-065 | SALAMANDRA GIGANTE |
| 066 | MON-066 | BEHEMOTH DE PEDRA |
| 067 | MON-067 | FERA DA SOMBRA |
| 068 | MON-068 | MEDUSA |
| 069 | MON-069 | FÊNIX DE CAVERNA |
| 070 | MON-070 | GIGANTE DE PEDRA |
| 071 | MON-071 | BRUXA DA MASMORRA (HAG) |
| 072 | MON-072 | FERA SEMINAL (DESTIVORE) |
| 073 | MON-073 | CARNIÇAL ALADO (VROCK) |
| 074 | MON-074 | BALOR (ARQUIDEMÔNIO) |
| 075 | MON-075 | ENXAME DE RATOS-CADÁVERES |
| 076 | MON-076 | ELEMENTAL DE TERRA |
| 077 | MON-077 | BANSHEE |
| 078 | MON-078 | MORCEGO-TIRANO |
| 079 | MON-079 | OOZE OCULAR (OLHO FLUTUANTE) |
| 080 | MON-080 | TARRASQUE (BEBÊ) |


---

## Flora (40 especies)

| ID | Nome | Bioma típico |
| --- | --- | --- |
| P-01 | Musgo-Lanterna | Estômago Botanico, Arquivos |
| P-02 | Raiz-Relogio | Engrenagens, Cidadela Palida |
| P-03 | Broto de Veia | Qualquer Boca (superficie de tunel) |
| P-04 | Erva-Sino | Abatedouro Celestial, planicie |
| P-05 | Folha de Salmour | Pantano, costa |
| P-06 | Cogumelo-Bandeira | Fungos, Digestor |
| P-07 | Trevo de Obelisco | Cemiterio de Colossos |
| P-08 | Vinha de Grimwald | Cidadela Palida |
| P-09 | Liquen Frio | Boca Branca, gelo |
| P-10 | Flor de Espelho | Labirinto Prismatico |
| P-11 | Palma de Ferromur | Engrenagens |
| P-12 | Algas de Prata | Mar de Prata Cega |
| P-13 | Hera Sangrenta | Fornalhas, Deserto de Carne |
| P-14 | Samambaia de Cinza | Jardim de Cinzas |
| P-15 | Tubarao-Relva (alga rasteira) | Abismo Invertido |
| P-16 | Esporo-Madrugada | Estômago Botanico |
| P-17 | Raiz de Yeti | Montanhas geladas |
| P-18 | Cacto Roxo | Deserto Purpura |
| P-19 | Arvore-Raçao (nucleo) | Vale Podre, Digestor |
| P-20 | Mel de Xilema | Colmeia de insetos + flora |
| P-21 | Casca-Brilho | Aranhas, teias antigas |
| P-22 | Flor Narcotica | Ninho Crepuscular |
| P-23 | Planta Carnivora (bulbo) | Estômago Botanico |
| P-24 | Musgo de Lareth | Ruinas engolidas |
| P-25 | Semente de Vinha Guardia | Simbiose druidica |
| P-26 | Capim Eco | Fosso das Emocoes |
| P-27 | Broto de Treant Podre | Floresta podre |
| P-28 | Cristal-Mel (seiva) | Gargulas, cavernas de cristal |
| P-29 | Folha de Abismo | Boca Azul profunda |
| P-30 | Erva do Limiar | Boca Negra |
| P-31 | Tuberculo de Lobo | Norte, cavernas geladas |
| P-32 | Flor de Mira | Qualquer Boca (oferta) |
| P-33 | Raiz de Valdrun | Forjas, superficie |
| P-34 | Orquidea Sorn | Arquivos, Vesper |
| P-35 | Musgo Estelar | Boca Laranja (alto) |
| P-36 | Polen de Matriarca | Teias de aranha-rei |
| P-37 | Fruto de Hidra (sementes) | Cavernas aquaticas |
| P-38 | Liquen de Golem | Engrenagens vivas |
| P-39 | Broto Ancestral | Boss derrotado (1/semana) |
| P-40 | Flor do Chefe Final | Boca Vazia (andares 1-3) |


---

## Biomas (20)

| ID | Nome |
| --- | --- |
| BIO-01 | Cidadela Palida |
| BIO-02 | Mar de Prata Cega |
| BIO-03 | Estômago Botanico |
| BIO-04 | Fornalhas Douradas |
| BIO-05 | Prisao Gelida |
| BIO-06 | Labirinto Prismático |
| BIO-07 | Cemiterio de Colossos |
| BIO-08 | Engrenagens Esquecidas |
| BIO-09 | Abismo Invertido |
| BIO-10 | Pantano da Decomposicao |
| BIO-11 | Arquivos Soterrados |
| BIO-12 | Ninho Crepuscular |
| BIO-13 | Oasis Neon |
| BIO-14 | Matriz de Extrusao |
| BIO-15 | Deserto de Carne e Tendoes |
| BIO-16 | Jardim de Cinzas Petrificadas |
| BIO-17 | Arquipelago de Pedra |
| BIO-18 | Floresta de Fios de Prata |
| BIO-19 | Fosso das Emocoes |
| BIO-20 | Abatedouro Celestial |


---

## Onze masmorras (Bocas)

| ID | Nome | Tema |
| --- | --- | --- |
| MS-01 | Boca Vermelha | Fogo / vulcanico |
| MS-02 | Boca Azul | Aquatico / abissal |
| MS-03 | Boca Verde | Flora / fungos |
| MS-04 | Boca Dourada | Academia / ilusao |
| MS-05 | Boca Cinza | Construtos / industria |
| MS-06 | Boca Branca | Gelo / mortos-vivos |
| MS-07 | Boca Negra | Necrótico / vampiros |
| MS-08 | Boca Violeta | Aberração / psionico |
| MS-09 | Boca Laranja | Colmeias / enxames |
| MS-10 | Boca Prateada | Metal / cristal |
| MS-11 | Boca Vazia (anomalia) | Chefe final / Tarrasque |


---

## Classes, racas e linhagens

| ID | Nome |
| --- | --- |
| CLA-guerreiro | Guerreiro |
| CLA-patrulheiro | Patrulheiro |
| CLA-ladino | Ladino |
| CLA-mago | Mago |
| CLA-clérigo | Clérigo |
| CLA-bárbaro | Bárbaro |
| CLA-bardo | Bardo |
| CLA-druida | Druida |
| CLA-artífice | Artífice |
| RAC-humano | Humano |
| RAC-elfo | Elfo |
| RAC-anao | Anao |
| RAC-meio-elfo | Meio-elfo |
| RAC-meio-orc | Meio-orc |
| RAC-halfling | Halfling |
| RAC-meio-humano | Meio-humano (linhagem) |
| LIN-gato | Linhagem do Gato |
| LIN-cobra | Linhagem da Cobra |
| LIN-urso | Linhagem do Urso |
| LIN-tigre | Linhagem do Tigre |
| LIN-aguia | Linhagem da Aguia |
| LIN-lobo | Linhagem do Lobo |
| LIN-tubarao | Linhagem do Tubarao |
| LIN-corvo | Linhagem do Corvo |


---

## Especiarias (ESP-01–30)

| ID | Nome |
| --- | --- |
| ESP-01 | Sal de Veia |
| ESP-02 | Casca de Grimwald |
| ESP-03 | Po Draconico Fino |
| ESP-04 | Gelo Aromático |
| ESP-05 | Musgo Seco de Cinza |
| ESP-06 | Pimenta de Orc |
| ESP-07 | Tempero Goblin (picante) |
| ESP-08 | Salmour de Tunel |
| ESP-09 | Ferrão Picante |
| ESP-10 | Pluma Aromatica |
| ESP-11 | Oleo de Engrenagem |
| ESP-12 | Salmour Necro |
| ESP-13 | Sangue em Po (desidratado) |
| ESP-14 | Veneno Seco (comestivel trace) |
| ESP-15 | Ácido em Po |
| ESP-16 | Esporo Gourmet |
| ESP-17 | Xilema Doce |
| ESP-18 | Polen Caustico |
| ESP-19 | Poeira de Arquivo |
| ESP-20 | Cristal Triturado |
| ESP-21 | Seda em Po |
| ESP-22 | Resina Quente |
| ESP-23 | Incenso de Valdrun |
| ESP-24 | Eco de Lagrimas |
| ESP-25 | Resina de Embalsamo |
| ESP-26 | Essência Doppel |
| ESP-27 | Incenso Celestial |
| ESP-28 | Olho em Conserva |
| ESP-29 | Coral Aromático |
| ESP-30 | Orquidea Sorn (po) |


---

## Minérios (MIN-01–30)

| ID | Nome |
| --- | --- |
| MIN-01 | Ferro Vulcanico (bruto) |
| MIN-02 | Magnetita Flutuante |
| MIN-03 | Po de Osso Fossil |
| MIN-04 | Cobre de Masmorra |
| MIN-05 | Cristal Vivo (fragmento) |
| MIN-06 | Lasca de Aco Encantado |
| MIN-07 | Quartzo Fantasma |
| MIN-08 | Prata Viva |
| MIN-09 | Prata Viva (veio) |
| MIN-10 | Perola Turva |
| MIN-11 | Madreperola Abissal |
| MIN-12 | Obsidiana Vitrificada |
| MIN-13 | Lodo Solidificado |
| MIN-14 | Hematita Podre |
| MIN-15 | Enxofre Amarelo |
| MIN-16 | Gelo Eterno |
| MIN-17 | Diamante Bruto (besouro) |
| MIN-18 | Veneno Cristalizado |
| MIN-19 | Madeira Viva (no) |
| MIN-20 | Micelio Metalico |
| MIN-21 | Seda Fossilizada |
| MIN-22 | Nucleo de Mana (pequeno) |
| MIN-23 | Pena Metalica |
| MIN-24 | Ouro Liquido (frasco 50ml) |
| MIN-25 | Quartzo Acustico |
| MIN-26 | Cinza Petrificada |
| MIN-27 | Resina de Construto |
| MIN-28 | Elitro Condutor |
| MIN-29 | Sangue Coagulado (mineral) |
| MIN-30 | Fragmento de Altar |


---

## Tesouros (TES-01–20)

| ID | Nome |
| --- | --- |
| TES-01 | Moedas Valdremor (saco 50) |
| TES-02 | Moedas antigas (colecao) |
| TES-03 | Gema de vidro (falso tesouro) |
| TES-04 | Conteudo do Bau Falso |
| TES-05 | Gema lapidada (pequena) |
| TES-06 | Idolozinho de pedra |
| TES-07 | Cristal ornamentado |
| TES-08 | Reliquia de explorador |
| TES-09 | Medalha de ordem extinta |
| TES-10 | Joia de ouro (anel/col) |
| TES-11 | Saco de gemas mistas |
| TES-12 | Pergaminho selado (mapa/ritual) |
| TES-13 | Carteira de seda cheia |
| TES-14 | Obra de arte portable |
| TES-15 | Coroa fragmentada |
| TES-16 | Hoard draconico (mesa) |
| TES-17 | Kit de joias de Matriarca |
| TES-18 | Barra de platina |
| TES-19 | Grimorio vazio (casca) |
| TES-20 | Oferenda de Mira (flor preservada) |


---

## Objetos de cenário (amostra — lista completa no catálogo)

| ID | Nome |
| --- | --- |
| OBJ-G01 | Tunel Estreito (1,5m) |
| OBJ-G02 | Ponte de Corda Podre |
| OBJ-G03 | Fogueira de Masmorra |
| OBJ-G04 | Carcaca Esqueletica Antiga |
| OBJ-G05 | Cristal de Eco |
| OBJ-G06 | Altarete Quebrado |
| OBJ-G07 | Deposito de Sal Branco |
| OBJ-G08 | Veia de Agua Fria |
| OBJ-G09 | Estalactite Instavel |
| OBJ-G10 | Armadilha de Pressao (placa) |
| OBJ-G11 | Porta Selada de Bronze |
| OBJ-G12 | Plataforma Flutuante (mágica) |
| OBJ-G13 | Pilha de Ossos Instavel |
| OBJ-G14 | Nicho de Ofrenda Seca |
| OBJ-G15 | Bolha de Ar Fossilizada |
| OBJ-G16 | Pedra de Ancora Gravitacional |
| OBJ-G17 | Runa de Purificacao Fria |
| OBJ-G18 | Bancada de Extração Improvisada |
| OBJ-G19 | Sino de Alarme Enferrujado |
| OBJ-G20 | Tunel com Broto de Veia nativo |
| OBJ-B01-01 | Paralelepipedo Esfregadio |
| OBJ-B01-02 | Cortina de limo azul |
| OBJ-B01-03 | Armadilha de Fio Medieval |
| OBJ-B01-04 | Espelho Rachado de Salao |
| OBJ-B01-05 | Torre Inclinada (interior) |
| OBJ-B01-06 | Nevoa Desorientadora |
| OBJ-B02-01 | Agua Negra Bioluminescente |
| OBJ-B02-02 | Recife de Ossos Antigos |
| OBJ-B02-03 | Corrente de Sucao (1 quadro) |
| OBJ-B02-04 | Bolha de Ar Presa em Coral |
| OBJ-B02-05 | Banco de Algas Prata |
| OBJ-B02-06 | Fenda de Pressao Abissal |
| OBJ-B02-07 | Praia de Vidro Moido |
| OBJ-B03-01 | Chao Pulso Digestivo |
| OBJ-B03-02 | Rio de Ácido Gastrico |
| OBJ-B03-03 | Arvore-Carne (tronco) |
| OBJ-B03-04 | Nuvem de Esporos |
| OBJ-B03-05 | Ninho de Mosca-Carnica |
| OBJ-B03-06 | Bulbo Carnivoro Adormecido |
| OBJ-B04-01 | Cachoeira de Lava (borda) |
| OBJ-B04-02 | Ponte de Obsidiana |
| OBJ-B04-03 | Cristal Vermelho Pulsante |
| OBJ-B04-04 | Gases Sulfurosos |
| OBJ-B04-05 | Rio de Ouro Liquido (falso) |
| OBJ-B05-01 | Parede de Gelo com Besta Presa |
| OBJ-B05-02 | Nevasca de Fenda |
| OBJ-B05-03 | Lago Subglacial |
| OBJ-B05-04 | Pelo Cristalizado (deposito) |
| OBJ-B05-05 | Eco de Passo Congelado |
| OBJ-B06-01 | Parede-Espelho |
| OBJ-B06-02 | Reflexo Falso (ilusao) |
| OBJ-B06-03 | Cristal Vivo (veio) |
| OBJ-B06-04 | Camara de Luz Cegante |
| OBJ-B07-01 | Dunas de Po de Osso |
| OBJ-B07-02 | Cranio-Habitat (caverna) |
| OBJ-B07-03 | Coluna Osea Instavel |
| OBJ-B07-04 | Trevo de Obelisco (raro) |
| OBJ-B08-01 | Pistao Ritmico |
| OBJ-B08-02 | Esteira Rolante |
| OBJ-B08-03 | Vapor Toxico (tubulacao) |
| OBJ-B08-04 | Nucleo de Mana Inerte |
| OBJ-B08-05 | Armadura Animada Dormindo |
| OBJ-B09-01 | Plataforma Flutuante de Ruina |
| OBJ-B09-02 | Vento Ascendente |
| OBJ-B09-03 | Fio de Ancoragem (Tubarao-Relva) |
| OBJ-B09-04 | Vao sem Fundo (marcador) |
| OBJ-B09-05 | Ponte de Teia Ancora (rara) |
| OBJ-B09-06 | Plataforma Instavel (camada B) |
| OBJ-B10-01 | Lagoa de Ácido Colorido |
| OBJ-B10-02 | Bolha de Gas Letal |
| OBJ-B10-03 | Lama Viva |
| OBJ-B10-04 | Tronco Podre com Salmour |
| OBJ-B10-05 | Refugio de Pedra sem Gas |
| OBJ-B11-01 | Estante Viva (apodrecida) |
| OBJ-B11-02 | Grimorio Armadilha |
| OBJ-B11-03 | Silencio Magico (10m) |
| OBJ-B11-04 | Pergaminho Intacto |
| OBJ-B12-01 | Teia Estrutural (parede) |
| OBJ-B12-02 | Ovo de Aranha (carruagem) |
| OBJ-B12-03 | Casulo de Proteina |


*… e mais 43 IDs em `CATALOGO-OBJETOS-DE-CENARIO.md`.*


---

## Compêndio VTT — Armas (224)

| entryId | Nome | tipo |
| --- | --- | --- |
| armas-arc-l01 | Arco Longo de Vinha | arma |
| armas-arc-l01-mais-1 | Arco Longo de Vinha +1 | arma |
| armas-arc-l01-mais-2 | Arco Longo de Vinha +2 | arma |
| armas-arc-l01-mais-3 | Arco Longo de Vinha +3 | arma |
| armas-arc-l02 | Arco Longo de Teixo | arma |
| armas-arc-l02-mais-1 | Arco Longo de Teixo +1 | arma |
| armas-arc-l02-mais-2 | Arco Longo de Teixo +2 | arma |
| armas-arc-l02-mais-3 | Arco Longo de Teixo +3 | arma |
| armas-arc-l03 | Arco Longo de Grimwald | arma |
| armas-arc-l03-mais-1 | Arco Longo de Grimwald +1 | arma |
| armas-arc-l03-mais-2 | Arco Longo de Grimwald +2 | arma |
| armas-arc-l03-mais-3 | Arco Longo de Grimwald +3 | arma |
| armas-arc-l04 | Arco Longo de Prata | arma |
| armas-arc-l04-mais-1 | Arco Longo de Prata +1 | arma |
| armas-arc-l04-mais-2 | Arco Longo de Prata +2 | arma |
| armas-arc-l04-mais-3 | Arco Longo de Prata +3 | arma |
| armas-arc-l05 | Arco Longo de Cripta | arma |
| armas-arc-l05-mais-1 | Arco Longo de Cripta +1 | arma |
| armas-arc-l05-mais-2 | Arco Longo de Cripta +2 | arma |
| armas-arc-l05-mais-3 | Arco Longo de Cripta +3 | arma |
| armas-arc-l06 | Arco Longo de Osso de Grifo | arma |
| armas-arc-l06-mais-1 | Arco Longo de Osso de Grifo +1 | arma |
| armas-arc-l06-mais-2 | Arco Longo de Osso de Grifo +2 | arma |
| armas-arc-l06-mais-3 | Arco Longo de Osso de Grifo +3 | arma |
| armas-arc-l07 | Arco Longo de Dragão | arma |
| armas-arc-l07-mais-1 | Arco Longo de Dragão +1 | arma |
| armas-arc-l07-mais-2 | Arco Longo de Dragão +2 | arma |
| armas-arc-l07-mais-3 | Arco Longo de Dragão +3 | arma |
| armas-arc-l08 | Arco Longo de Abismo | arma |
| armas-arc-l08-mais-1 | Arco Longo de Abismo +1 | arma |
| armas-arc-l08-mais-2 | Arco Longo de Abismo +2 | arma |
| armas-arc-l08-mais-3 | Arco Longo de Abismo +3 | arma |
| armas-arc-l09 | Arco Longo de Valdrun | arma |
| armas-arc-l09-mais-1 | Arco Longo de Valdrun +1 | arma |
| armas-arc-l09-mais-2 | Arco Longo de Valdrun +2 | arma |
| armas-arc-l09-mais-3 | Arco Longo de Valdrun +3 | arma |
| armas-arc-c01 | Arco Curto de Caçador | arma |
| armas-arc-c01-mais-1 | Arco Curto de Caçador +1 | arma |
| armas-arc-c01-mais-2 | Arco Curto de Caçador +2 | arma |
| armas-arc-c01-mais-3 | Arco Curto de Caçador +3 | arma |
| armas-arc-c02 | Arco Curto de Teixo | arma |
| armas-arc-c02-mais-1 | Arco Curto de Teixo +1 | arma |
| armas-arc-c02-mais-2 | Arco Curto de Teixo +2 | arma |
| armas-arc-c02-mais-3 | Arco Curto de Teixo +3 | arma |
| armas-arc-c03 | Arco Curto de Goblin | arma |
| armas-arc-c03-mais-1 | Arco Curto de Goblin +1 | arma |
| armas-arc-c03-mais-2 | Arco Curto de Goblin +2 | arma |
| armas-arc-c03-mais-3 | Arco Curto de Goblin +3 | arma |
| armas-arc-c04 | Arco Curto de Cripta | arma |
| armas-arc-c04-mais-1 | Arco Curto de Cripta +1 | arma |
| armas-arc-c04-mais-2 | Arco Curto de Cripta +2 | arma |
| armas-arc-c04-mais-3 | Arco Curto de Cripta +3 | arma |
| armas-arc-c05 | Arco Curto de Costela | arma |
| armas-arc-c05-mais-1 | Arco Curto de Costela +1 | arma |
| armas-arc-c05-mais-2 | Arco Curto de Costela +2 | arma |
| armas-arc-c05-mais-3 | Arco Curto de Costela +3 | arma |
| armas-arc-c06 | Arco Curto de Matriarca | arma |
| armas-arc-c06-mais-1 | Arco Curto de Matriarca +1 | arma |
| armas-arc-c06-mais-2 | Arco Curto de Matriarca +2 | arma |
| armas-arc-c06-mais-3 | Arco Curto de Matriarca +3 | arma |
| armas-arc-c07 | Arco Curto de Ninho | arma |
| armas-arc-c07-mais-1 | Arco Curto de Ninho +1 | arma |
| armas-arc-c07-mais-2 | Arco Curto de Ninho +2 | arma |
| armas-arc-c07-mais-3 | Arco Curto de Ninho +3 | arma |
| armas-arc-c08 | Arco Curto de Marfim | arma |
| armas-arc-c08-mais-1 | Arco Curto de Marfim +1 | arma |
| armas-arc-c08-mais-2 | Arco Curto de Marfim +2 | arma |
| armas-arc-c08-mais-3 | Arco Curto de Marfim +3 | arma |
| armas-arc-c09 | Arco Curto de Valdrun | arma |
| armas-arc-c09-mais-1 | Arco Curto de Valdrun +1 | arma |
| armas-arc-c09-mais-2 | Arco Curto de Valdrun +2 | arma |
| armas-arc-c09-mais-3 | Arco Curto de Valdrun +3 | arma |
| armas-bst-01 | Besta Leve | arma |
| armas-bst-01-mais-1 | Besta Leve +1 | arma |
| armas-bst-01-mais-2 | Besta Leve +2 | arma |
| armas-bst-01-mais-3 | Besta Leve +3 | arma |
| armas-bst-02 | Besta de Mão | arma |
| armas-bst-02-mais-1 | Besta de Mão +1 | arma |
| armas-bst-02-mais-2 | Besta de Mão +2 | arma |
| armas-bst-02-mais-3 | Besta de Mão +3 | arma |
| armas-bst-03 | Besta Pesada | arma |
| armas-bst-03-mais-1 | Besta Pesada +1 | arma |
| armas-bst-03-mais-2 | Besta Pesada +2 | arma |
| armas-bst-03-mais-3 | Besta Pesada +3 | arma |
| armas-bst-04 | Besta de Repetição | arma |
| armas-bst-04-mais-1 | Besta de Repetição +1 | arma |
| armas-bst-04-mais-2 | Besta de Repetição +2 | arma |
| armas-bst-04-mais-3 | Besta de Repetição +3 | arma |
| armas-bst-05 | Besta de Assalto | arma |
| armas-bst-05-mais-1 | Besta de Assalto +1 | arma |
| armas-bst-05-mais-2 | Besta de Assalto +2 | arma |
| armas-bst-05-mais-3 | Besta de Assalto +3 | arma |
| armas-bst-06 | Besta de Caverna | arma |
| armas-bst-06-mais-1 | Besta de Caverna +1 | arma |
| armas-bst-06-mais-2 | Besta de Caverna +2 | arma |
| armas-bst-06-mais-3 | Besta de Caverna +3 | arma |
| armas-bst-07 | Besta de Alcance | arma |
| armas-bst-07-mais-1 | Besta de Alcance +1 | arma |
| armas-bst-07-mais-2 | Besta de Alcance +2 | arma |
| armas-bst-07-mais-3 | Besta de Alcance +3 | arma |
| armas-bst-08 | Besta de Engenharia | arma |
| armas-bst-08-mais-1 | Besta de Engenharia +1 | arma |
| armas-bst-08-mais-2 | Besta de Engenharia +2 | arma |
| armas-bst-08-mais-3 | Besta de Engenharia +3 | arma |
| armas-wpn-s01 | Lâmina de Vinha | arma |
| armas-wpn-s01-mais-1 | Lâmina de Vinha +1 | arma |
| armas-wpn-s01-mais-2 | Lâmina de Vinha +2 | arma |
| armas-wpn-s01-mais-3 | Lâmina de Vinha +3 | arma |
| armas-wpn-s02 | Espada Longa | arma |
| armas-wpn-s02-mais-1 | Espada Longa +1 | arma |
| armas-wpn-s02-mais-2 | Espada Longa +2 | arma |
| armas-wpn-s02-mais-3 | Espada Longa +3 | arma |
| armas-wpn-s03 | Espada Bastarda | arma |
| armas-wpn-s03-mais-1 | Espada Bastarda +1 | arma |
| armas-wpn-s03-mais-2 | Espada Bastarda +2 | arma |
| armas-wpn-s03-mais-3 | Espada Bastarda +3 | arma |
| armas-wpn-s04 | Montante | arma |
| armas-wpn-s04-mais-1 | Montante +1 | arma |
| armas-wpn-s04-mais-2 | Montante +2 | arma |
| armas-wpn-s04-mais-3 | Montante +3 | arma |
| armas-wpn-s05 | Rapieira | arma |
| armas-wpn-s05-mais-1 | Rapieira +1 | arma |
| armas-wpn-s05-mais-2 | Rapieira +2 | arma |
| armas-wpn-s05-mais-3 | Rapieira +3 | arma |
| armas-wpn-s06 | Sabre de Cavalaria | arma |
| armas-wpn-s06-mais-1 | Sabre de Cavalaria +1 | arma |
| armas-wpn-s06-mais-2 | Sabre de Cavalaria +2 | arma |
| armas-wpn-s06-mais-3 | Sabre de Cavalaria +3 | arma |
| armas-wpn-s07 | Cimitarra de Grimwald | arma |
| armas-wpn-s07-mais-1 | Cimitarra de Grimwald +1 | arma |
| armas-wpn-s07-mais-2 | Cimitarra de Grimwald +2 | arma |
| armas-wpn-s07-mais-3 | Cimitarra de Grimwald +3 | arma |
| armas-wpn-s08 | Gladius de Masmorra | arma |
| armas-wpn-s08-mais-1 | Gladius de Masmorra +1 | arma |
| armas-wpn-s08-mais-2 | Gladius de Masmorra +2 | arma |
| armas-wpn-s08-mais-3 | Gladius de Masmorra +3 | arma |
| armas-wpn-s09 | Claymore de Valdrun | arma |
| armas-wpn-s09-mais-1 | Claymore de Valdrun +1 | arma |
| armas-wpn-s09-mais-2 | Claymore de Valdrun +2 | arma |
| armas-wpn-s09-mais-3 | Claymore de Valdrun +3 | arma |
| armas-wpn-s10 | Espada de Cripta | arma |
| armas-wpn-s10-mais-1 | Espada de Cripta +1 | arma |
| armas-wpn-s10-mais-2 | Espada de Cripta +2 | arma |
| armas-wpn-s10-mais-3 | Espada de Cripta +3 | arma |
| armas-wpn-s11 | Lâmina de Teixo | arma |
| armas-wpn-s11-mais-1 | Lâmina de Teixo +1 | arma |
| armas-wpn-s11-mais-2 | Lâmina de Teixo +2 | arma |
| armas-wpn-s11-mais-3 | Lâmina de Teixo +3 | arma |
| armas-wpn-s12 | Espada de Prata | arma |
| armas-wpn-s12-mais-1 | Espada de Prata +1 | arma |
| armas-wpn-s12-mais-2 | Espada de Prata +2 | arma |
| armas-wpn-s12-mais-3 | Espada de Prata +3 | arma |
| armas-wpn-p01 | Lança Curta | arma |
| armas-wpn-p01-mais-1 | Lança Curta +1 | arma |
| armas-wpn-p01-mais-2 | Lança Curta +2 | arma |
| armas-wpn-p01-mais-3 | Lança Curta +3 | arma |
| armas-wpn-p02 | Lança Longa | arma |
| armas-wpn-p02-mais-1 | Lança Longa +1 | arma |
| armas-wpn-p02-mais-2 | Lança Longa +2 | arma |
| armas-wpn-p02-mais-3 | Lança Longa +3 | arma |
| armas-wpn-p03 | Pique de Falange | arma |
| armas-wpn-p03-mais-1 | Pique de Falange +1 | arma |
| armas-wpn-p03-mais-2 | Pique de Falange +2 | arma |
| armas-wpn-p03-mais-3 | Pique de Falange +3 | arma |
| armas-wpn-p04 | Azagaia | arma |
| armas-wpn-p04-mais-1 | Azagaia +1 | arma |
| armas-wpn-p04-mais-2 | Azagaia +2 | arma |
| armas-wpn-p04-mais-3 | Azagaia +3 | arma |
| armas-wpn-p05 | Tridente | arma |
| armas-wpn-p05-mais-1 | Tridente +1 | arma |
| armas-wpn-p05-mais-2 | Tridente +2 | arma |
| armas-wpn-p05-mais-3 | Tridente +3 | arma |
| armas-wpn-p06 | Alabarda | arma |
| armas-wpn-p06-mais-1 | Alabarda +1 | arma |
| armas-wpn-p06-mais-2 | Alabarda +2 | arma |
| armas-wpn-p06-mais-3 | Alabarda +3 | arma |
| armas-wpn-p07 | Lança de Cavalaria | arma |
| armas-wpn-p07-mais-1 | Lança de Cavalaria +1 | arma |
| armas-wpn-p07-mais-2 | Lança de Cavalaria +2 | arma |
| armas-wpn-p07-mais-3 | Lança de Cavalaria +3 | arma |
| armas-wpn-p08 | Javelin de Caça | arma |
| armas-wpn-p08-mais-1 | Javelin de Caça +1 | arma |
| armas-wpn-p08-mais-2 | Javelin de Caça +2 | arma |
| armas-wpn-p08-mais-3 | Javelin de Caça +3 | arma |
| armas-wpn-p09 | Lança de Teixo | arma |
| armas-wpn-p09-mais-1 | Lança de Teixo +1 | arma |
| armas-wpn-p09-mais-2 | Lança de Teixo +2 | arma |
| armas-wpn-p09-mais-3 | Lança de Teixo +3 | arma |
| armas-wpn-p10 | Lança de Valdrun | arma |
| armas-wpn-p10-mais-1 | Lança de Valdrun +1 | arma |
| armas-wpn-p10-mais-2 | Lança de Valdrun +2 | arma |
| armas-wpn-p10-mais-3 | Lança de Valdrun +3 | arma |
| armas-wpn-o01 | Adaga de Masmorra | arma |
| armas-wpn-o01-mais-1 | Adaga de Masmorra +1 | arma |
| armas-wpn-o01-mais-2 | Adaga de Masmorra +2 | arma |
| armas-wpn-o01-mais-3 | Adaga de Masmorra +3 | arma |
| armas-wpn-o02 | Adagas Gêmeas | arma |
| armas-wpn-o02-mais-1 | Adagas Gêmeas +1 | arma |
| armas-wpn-o02-mais-2 | Adagas Gêmeas +2 | arma |
| armas-wpn-o02-mais-3 | Adagas Gêmeas +3 | arma |
| armas-wpn-o03 | Machado de Batalha | arma |
| armas-wpn-o03-mais-1 | Machado de Batalha +1 | arma |
| armas-wpn-o03-mais-2 | Machado de Batalha +2 | arma |
| armas-wpn-o03-mais-3 | Machado de Batalha +3 | arma |
| armas-wpn-o04 | Machado Grande | arma |
| armas-wpn-o04-mais-1 | Machado Grande +1 | arma |
| armas-wpn-o04-mais-2 | Machado Grande +2 | arma |
| armas-wpn-o04-mais-3 | Machado Grande +3 | arma |
| armas-wpn-o05 | Maça de Guerra | arma |
| armas-wpn-o05-mais-1 | Maça de Guerra +1 | arma |
| armas-wpn-o05-mais-2 | Maça de Guerra +2 | arma |
| armas-wpn-o05-mais-3 | Maça de Guerra +3 | arma |
| armas-wpn-o06 | Martelo de Guerra | arma |
| armas-wpn-o06-mais-1 | Martelo de Guerra +1 | arma |
| armas-wpn-o06-mais-2 | Martelo de Guerra +2 | arma |
| armas-wpn-o06-mais-3 | Martelo de Guerra +3 | arma |
| armas-org-01 | Lâmina de Dente de Wyvern | arma |
| armas-org-02 | Maça de Fêmur Milenar | arma |
| armas-org-03 | Adaga de Quelícera | arma |
| armas-org-04 | Espada de Escama de Dragão | arma |
| armas-org-05 | Lança de Ferrão de Escorpião | arma |
| armas-org-06 | Martelo Fornalha | arma |
| armas-org-07 | Arco de Osso de Grifo | arma |
| armas-org-08 | Espada de Garra de Gelo | arma |


---

## Compêndio VTT — Habilidades (50)

| entryId | Nome | tipo |
| --- | --- | --- |
| habilidades-investida-hexagonal | Investida Hexagonal | habilidade |
| habilidades-golpe-flanqueador | Golpe Flanqueador | habilidade |
| habilidades-postura-defensiva | Postura Defensiva | habilidade |
| habilidades-reflexos-de-masmorra | Reflexos de Masmorra | habilidade |
| habilidades-olhar-do-cacador | Olhar do Caçador | habilidade |
| habilidades-investida-do-guerreiro | Investida do Guerreiro | habilidade |
| habilidades-golpe-devastador | Golpe Devastador | habilidade |
| habilidades-esquiva-tatica | Esquiva Tática | habilidade |
| habilidades-tiro-certeiro | Tiro Certeiro | habilidade |
| habilidades-emboscada | Emboscada | habilidade |
| habilidades-finta | Finta | habilidade |
| habilidades-passo-das-sombras | Passo das Sombras | habilidade |
| habilidades-raio-arcano | Raio Arcano | habilidade |
| habilidades-escudo-magico | Escudo Mágico | habilidade |
| habilidades-canalizar-energia | Canalizar Energia | habilidade |
| habilidades-furia-controlada | Fúria Controlada | habilidade |
| habilidades-investida-barbara | Investida Bárbara | habilidade |
| habilidades-inspiracao-de-batalha | Inspiração de Batalha | habilidade |
| habilidades-cancao-de-cura | Canção de Cura | habilidade |
| habilidades-forma-selvagem | Forma Selvagem | habilidade |
| habilidades-raizes-prendentes | Raízes Prendentes | habilidade |
| habilidades-disparo-de-artilheiro | Disparo de Artilheiro | habilidade |
| habilidades-barreira-de-cobre | Barreira de Cobre | habilidade |
| habilidades-imposicao-de-maos | Imposição de Mãos | habilidade |
| habilidades-golpe-sagrado | Golpe Sagrado | habilidade |
| habilidades-raio-do-pacto | Raio do Pacto | habilidade |
| habilidades-raio-do-pacto-psiquico | Raio do Pacto Psíquico | habilidade |
| habilidades-raio-do-pacto-ardente | Raio do Pacto Ardente | habilidade |
| habilidades-raio-do-pacto-salino | Raio do Pacto Salino | habilidade |
| habilidades-luz-penitente | Luz Penitente | habilidade |
| habilidades-escudo-solar | Escudo Solar | habilidade |
| habilidades-julgamento-ardente | Julgamento Ardente | habilidade |
| habilidades-coroa-de-fogo | Coroa de Fogo | habilidade |
| habilidades-lamina-dos-sepulcros | Lâmina dos Sepulcros | habilidade |
| habilidades-voto-de-caca | Voto de Caça | habilidade |
| habilidades-marca-do-limiar | Marca do Limiar | habilidade |
| habilidades-processao-silenciosa | Processão Silenciosa | habilidade |
| habilidades-mordida-do-voto | Mordida do Voto | habilidade |
| habilidades-fera-interior | Fera Interior | habilidade |
| habilidades-carga-do-juramento | Carga do Juramento | habilidade |
| habilidades-pele-de-quimera | Pele de Quimera | habilidade |
| habilidades-olhar-entre-dimensoes | Olhar Entre Dimensões | habilidade |
| habilidades-agarrao-do-pacto | Agarrão do Pacto | habilidade |
| habilidades-mente-partida | Mente Partida | habilidade |
| habilidades-sangue-do-patrono | Sangue do Patrono | habilidade |
| habilidades-pacto-de-ferro | Pacto de Ferro | habilidade |
| habilidades-correntes-infernais | Correntes Infernais | habilidade |
| habilidades-corrente-mental | Corrente Mental | habilidade |
| habilidades-manto-de-bruma | Manto de Bruma | habilidade |
| habilidades-puxao-abissal | Puxão Abissal | habilidade |


---

## Compêndio VTT — Magias (64)

| entryId | Nome | tipo |
| --- | --- | --- |
| magias-chama-de-fogareiro | Brasa Espectral | magia |
| magias-lamina-de-espirito | Lâmina de Espírito | magia |
| magias-detectar-veneno | Sentir Toxina | magia |
| magias-estabilizar | Estabilizar | magia |
| magias-maos-firmes | Mãos Estáveis | magia |
| magias-extracao-amplificada | Marca da Caçada | magia |
| magias-maos-gelidas | Mãos Gelidas | magia |
| magias-crescimento-acelerado | Crescimento Acelerado | magia |
| magias-purificar-veneno | Purificar Veneno | magia |
| magias-armadura-arcana | Armadura Arcana | magia |
| magias-onda-de-trovao | Onda de Trovão | magia |
| magias-curar-ferimentos | Curar Ferimentos | magia |
| magias-chama-de-vinha | Chama de Vinha | magia |
| magias-sussurro-de-masmorra | Sussurro de Masmorra | magia |
| magias-raios-de-enfraquecimento | Raios de Enfraquecimento | magia |
| magias-esfera-acida-de-monstro | Esfera Ácida de Monstro | magia |
| magias-transmutacao-de-carne | Transmutação de Carne | magia |
| magias-inspiracao-culinaria | Ímpeto Inspirador | magia |
| magias-forma-menor | Forma Menor | magia |
| magias-escudo-arcano | Escudo Arcano | magia |
| magias-ilusao-menor | Ilusão Menor | magia |
| magias-muralha-hexagonal | Muralha Hexagonal | magia |
| magias-animacao-de-mortos | Animação de Mortos | magia |
| magias-injecao-biomagica | Injeção Biomágica | magia |
| magias-bola-de-fogo | Bola de Fogo | magia |
| magias-nova-hex | Nova Hex | magia |
| magias-contagio-necrotico | Contágio Necrótico | magia |
| magias-ventania | Ventania | magia |
| magias-ler-mentes | Ler Mentes | magia |
| magias-relampago | Relâmpago | magia |
| magias-sono | Sono | magia |
| magias-raio-do-limiar | Raio do Limiar | magia |
| magias-visao-do-ecossistema | Visão do Ecossistema | magia |
| magias-murcha | Murcha | magia |
| magias-mutacao-forcada | Mutação Forçada | magia |
| magias-parede-de-fogo | Parede de Fogo | magia |
| magias-cura-em-massa | Cura em Massa | magia |
| magias-ressurreicao-incompleta | Ressurreição Incompleta | magia |
| magias-grande-transmutacao-biomagica | Grande Transmutação Biomágica | magia |
| magias-cone-de-frio | Cone de Frio | magia |
| magias-despertar | Despertar | magia |
| magias-salto-dimensional | Salto Dimensional | magia |
| magias-restaurar-vigor | Restaurar Vigor | magia |
| magias-causar-praga | Causar Praga | magia |
| magias-desintegrar | Desintegrar | magia |
| magias-cadeia-de-relampago | Cadeia de Relâmpago | magia |
| magias-forma-de-monstro | Forma de Monstro | magia |
| magias-prisao-de-gelo | Prisão de Gelo | magia |
| magias-regeneracao-biomagica | Regeneração Biomágica | magia |
| magias-invisibilidade-maior | Invisibilidade Maior | magia |
| magias-terremoto | Terremoto | magia |
| magias-biomancia-suprema-transcendencia | Biomancia Suprema — Transcendência | magia |
| magias-desejo-de-morte | Desejo de Morte | magia |
| magias-maos-ardentes | Mãos Ardentes | magia |
| magias-gelo-de-conservacao | Couraça de Gelo | magia |
| magias-fermentacao-acelerada | Fermentação Acelerada | magia |
| magias-purificacao-abencoada | Purificação Abençoada | magia |
| magias-esporos-necroticos | Esporos Necróticos | magia |
| magias-grande-decomposicao | Grande Decomposição | magia |
| magias-doce-confuso | Doce Confuso | magia |


---

## Compêndio VTT — Equipamentos (121)

| entryId | Nome | tipo |
| --- | --- | --- |
| equipamentos-arm-01 | Couro Curtido | equipamento |
| equipamentos-arm-01-mais-1 | Couro Curtido +1 | equipamento |
| equipamentos-arm-01-mais-2 | Couro Curtido +2 | equipamento |
| equipamentos-arm-01-mais-3 | Couro Curtido +3 | equipamento |
| equipamentos-arm-02 | Couro Acolchoado | equipamento |
| equipamentos-arm-02-mais-1 | Couro Acolchoado +1 | equipamento |
| equipamentos-arm-02-mais-2 | Couro Acolchoado +2 | equipamento |
| equipamentos-arm-02-mais-3 | Couro Acolchoado +3 | equipamento |
| equipamentos-arm-03 | Gibão de Peles | equipamento |
| equipamentos-arm-03-mais-1 | Gibão de Peles +1 | equipamento |
| equipamentos-arm-03-mais-2 | Gibão de Peles +2 | equipamento |
| equipamentos-arm-03-mais-3 | Gibão de Peles +3 | equipamento |
| equipamentos-arm-04 | Couro Batido | equipamento |
| equipamentos-arm-04-mais-1 | Couro Batido +1 | equipamento |
| equipamentos-arm-04-mais-2 | Couro Batido +2 | equipamento |
| equipamentos-arm-04-mais-3 | Couro Batido +3 | equipamento |
| equipamentos-arm-05 | Cota de Malha | equipamento |
| equipamentos-arm-05-mais-1 | Cota de Malha +1 | equipamento |
| equipamentos-arm-05-mais-2 | Cota de Malha +2 | equipamento |
| equipamentos-arm-05-mais-3 | Cota de Malha +3 | equipamento |
| equipamentos-arm-06 | Cota de Anéis | equipamento |
| equipamentos-arm-06-mais-1 | Cota de Anéis +1 | equipamento |
| equipamentos-arm-06-mais-2 | Cota de Anéis +2 | equipamento |
| equipamentos-arm-06-mais-3 | Cota de Anéis +3 | equipamento |
| equipamentos-arm-07 | Meia-armadura | equipamento |
| equipamentos-arm-07-mais-1 | Meia-armadura +1 | equipamento |
| equipamentos-arm-07-mais-2 | Meia-armadura +2 | equipamento |
| equipamentos-arm-07-mais-3 | Meia-armadura +3 | equipamento |
| equipamentos-arm-08 | Cota de Escamas | equipamento |
| equipamentos-arm-08-mais-1 | Cota de Escamas +1 | equipamento |
| equipamentos-arm-08-mais-2 | Cota de Escamas +2 | equipamento |
| equipamentos-arm-08-mais-3 | Cota de Escamas +3 | equipamento |
| equipamentos-arm-09 | Brigandina | equipamento |
| equipamentos-arm-09-mais-1 | Brigandina +1 | equipamento |
| equipamentos-arm-09-mais-2 | Brigandina +2 | equipamento |
| equipamentos-arm-09-mais-3 | Brigandina +3 | equipamento |
| equipamentos-arm-10 | Gibão de Placas | equipamento |
| equipamentos-arm-10-mais-1 | Gibão de Placas +1 | equipamento |
| equipamentos-arm-10-mais-2 | Gibão de Placas +2 | equipamento |
| equipamentos-arm-10-mais-3 | Gibão de Placas +3 | equipamento |
| equipamentos-arm-11 | Placas Parciais | equipamento |
| equipamentos-arm-11-mais-1 | Placas Parciais +1 | equipamento |
| equipamentos-arm-11-mais-2 | Placas Parciais +2 | equipamento |
| equipamentos-arm-11-mais-3 | Placas Parciais +3 | equipamento |
| equipamentos-arm-12 | Placas Completas | equipamento |
| equipamentos-arm-12-mais-1 | Placas Completas +1 | equipamento |
| equipamentos-arm-12-mais-2 | Placas Completas +2 | equipamento |
| equipamentos-arm-12-mais-3 | Placas Completas +3 | equipamento |
| equipamentos-arm-13 | Cota de Malha Pesada | equipamento |
| equipamentos-arm-13-mais-1 | Cota de Malha Pesada +1 | equipamento |
| equipamentos-arm-13-mais-2 | Cota de Malha Pesada +2 | equipamento |
| equipamentos-arm-13-mais-3 | Cota de Malha Pesada +3 | equipamento |
| equipamentos-arm-14 | Escamas de Dragonete | equipamento |
| equipamentos-arm-14-mais-1 | Escamas de Dragonete +1 | equipamento |
| equipamentos-arm-14-mais-2 | Escamas de Dragonete +2 | equipamento |
| equipamentos-arm-14-mais-3 | Escamas de Dragonete +3 | equipamento |
| equipamentos-arm-15 | Couro de Troll | equipamento |
| equipamentos-arm-15-mais-1 | Couro de Troll +1 | equipamento |
| equipamentos-arm-15-mais-2 | Couro de Troll +2 | equipamento |
| equipamentos-arm-15-mais-3 | Couro de Troll +3 | equipamento |
| equipamentos-arm-16 | Carapaça de Escorpião | equipamento |
| equipamentos-arm-16-mais-1 | Carapaça de Escorpião +1 | equipamento |
| equipamentos-arm-16-mais-2 | Carapaça de Escorpião +2 | equipamento |
| equipamentos-arm-16-mais-3 | Carapaça de Escorpião +3 | equipamento |
| equipamentos-arm-17 | Cota de Basilisco | equipamento |
| equipamentos-arm-17-mais-1 | Cota de Basilisco +1 | equipamento |
| equipamentos-arm-17-mais-2 | Cota de Basilisco +2 | equipamento |
| equipamentos-arm-17-mais-3 | Cota de Basilisco +3 | equipamento |
| equipamentos-arm-18 | Placas de Golem | equipamento |
| equipamentos-arm-18-mais-1 | Placas de Golem +1 | equipamento |
| equipamentos-arm-18-mais-2 | Placas de Golem +2 | equipamento |
| equipamentos-arm-18-mais-3 | Placas de Golem +3 | equipamento |
| equipamentos-arm-19 | Manto de Grimwald | equipamento |
| equipamentos-arm-19-mais-1 | Manto de Grimwald +1 | equipamento |
| equipamentos-arm-19-mais-2 | Manto de Grimwald +2 | equipamento |
| equipamentos-arm-19-mais-3 | Manto de Grimwald +3 | equipamento |
| equipamentos-arm-20 | Arnês de Valdrun | equipamento |
| equipamentos-arm-20-mais-1 | Arnês de Valdrun +1 | equipamento |
| equipamentos-arm-20-mais-2 | Arnês de Valdrun +2 | equipamento |
| equipamentos-arm-20-mais-3 | Arnês de Valdrun +3 | equipamento |
| equipamentos-poc-01 | Poção de Vida Menor | equipamento |
| equipamentos-poc-02 | Poção de Vida | equipamento |
| equipamentos-poc-03 | Poção de Vida Maior | equipamento |
| equipamentos-poc-04 | Antídoto Universal | equipamento |
| equipamentos-poc-05 | Antídoto de Masmorra | equipamento |
| equipamentos-poc-06 | Poção de Força de Touro | equipamento |
| equipamentos-poc-07 | Poção de Agilidade Felina | equipamento |
| equipamentos-poc-08 | Poção de Vigor de Urso | equipamento |
| equipamentos-poc-09 | Poção de Clarividência | equipamento |
| equipamentos-poc-10 | Poção de Resistência ao Fogo | equipamento |
| equipamentos-poc-11 | Poção de Resistência ao Gelo | equipamento |
| equipamentos-poc-12 | Poção de Resistência ao Ácido | equipamento |
| equipamentos-poc-13 | Elixir de Trinchar | equipamento |
| equipamentos-poc-14 | Elixir de Harmonização | equipamento |
| equipamentos-poc-15 | Tônico de Estômago de Ferro | equipamento |
| equipamentos-poc-16 | Soro de Mutação Estável | equipamento |
| equipamentos-poc-17 | Destilado de Wyvern | equipamento |
| equipamentos-poc-18 | Essência de Gelo Aromático | equipamento |
| equipamentos-poc-19 | Poção de Respiração Abissal | equipamento |
| equipamentos-poc-20 | Poção de Pele de Pedra | equipamento |
| equipamentos-poc-21 | Poção de Passo Silencioso | equipamento |
| equipamentos-poc-22 | Poção de Visão no Escuro | equipamento |
| equipamentos-poc-23 | Poção de Cura de Grupo | equipamento |
| equipamentos-poc-24 | Elixir Lendário de Valdrun | equipamento |
| equipamentos-mun-01 | Flecha Comum (20) | equipamento |
| equipamentos-mun-02 | Flecha de Caça (20) | equipamento |
| equipamentos-mun-03 | Flecha Cortante (20) | equipamento |
| equipamentos-mun-04 | Flecha Perfurante (20) | equipamento |
| equipamentos-mun-05 | Flecha de Fogo (10) | equipamento |
| equipamentos-mun-06 | Flecha de Gelo (10) | equipamento |
| equipamentos-mun-07 | Flecha de Veneno (10) | equipamento |
| equipamentos-mun-08 | Flecha de Esporo (3) | equipamento |
| equipamentos-mun-09 | Virote Comum (20) | equipamento |
| equipamentos-mun-10 | Virote Pesado (10) | equipamento |
| equipamentos-mun-11 | Virote Perfurante (10) | equipamento |
| equipamentos-mun-12 | Agulha de Zarabatana (10) | equipamento |
| equipamentos-kit-de-trinchar | Kit de Trinchar | equipamento |
| equipamentos-tocha-de-masmorra | Tocha de Masmorra | equipamento |
| equipamentos-corda-de-seda-de-aranha | Corda de Seda de Aranha | equipamento |
| equipamentos-kit-de-brasas-mágicas | Kit de Brasas Mágicas (6) | equipamento |
| equipamentos-forja-portátil-do-artífice | Forja Portátil do Artífice | equipamento |


---

## Compêndio VTT — Monstros (VTT) (83)

| entryId | Nome | tipo |
| --- | --- | --- |
| monstros-zumbi-de-masmorra | Zumbi de Masmorra | npc |
| monstros-esqueleto-armado | Esqueleto Armado | npc |
| monstros-ghoul | Ghoul | npc |
| monstros-espectro | Espectro | npc |
| monstros-lich-arquiliche | Lich (Arquiliche) | npc |
| monstros-assombracao | Assombração | npc |
| monstros-vampiro | Vampiro | npc |
| monstros-cavaleiro-espectral | Cavaleiro Espectral | npc |
| monstros-mumia | Múmia | npc |
| monstros-dragonete-de-magma | Dragonete de Magma | npc |
| monstros-wyvern | Wyvern | npc |
| monstros-dragao-jovem-de-gelo | Dragão Jovem de Gelo | npc |
| monstros-drake-de-pedra | Drake de Pedra | npc |
| monstros-dragao-anciao-de-fogo | Dragão Ancião de Fogo | npc |
| monstros-golem-de-pedra | Golem de Pedra | npc |
| monstros-armadura-animada | Armadura Animada | npc |
| monstros-golem-de-ferro-vulcanico | Golem de Ferro Vulcânico | npc |
| monstros-automato-de-genio | Autômato de Gênio | npc |
| monstros-minotauro | Minotauro | npc |
| monstros-basilisco | Basilisco | npc |
| monstros-manticora | Manticora | npc |
| monstros-grifo | Grifo | npc |
| monstros-cocatriz | Cocatriz | npc |
| monstros-aranha-tecerrochas | Aranha Tecerrochas | npc |
| monstros-escorpiao-gigante | Escorpião Gigante | npc |
| monstros-centopeia-caustica | Centopeia Cáustica | npc |
| monstros-besouro-diamante | Besouro-Diamante | npc |
| monstros-sapo-engolidor | Sapo-Engolidor | npc |
| monstros-kraken-menor | Kraken Menor | npc |
| monstros-serpente-do-abismo | Serpente-do-Abismo | npc |
| monstros-tubarao-cego | Tubarão-Cego | npc |
| monstros-goblin-de-caverna | Goblin de Caverna | npc |
| monstros-hobgoblin-guerreiro | Hobgoblin Guerreiro | npc |
| monstros-orc-de-masmorra | Orc de Masmorra | npc |
| monstros-cogumelo-rei | Cogumelo-Rei | npc |
| monstros-treant-podre | Treant Podre | npc |
| monstros-planta-carnivora-gigante | Planta Carnívora Gigante | npc |
| monstros-slime-acido | Slime Ácido | npc |
| monstros-slime-de-cristal | Slime de Cristal | npc |
| monstros-elemental-de-fogo | Elemental de Fogo | npc |
| monstros-elemental-de-gelo | Elemental de Gelo | npc |
| monstros-yeti-das-profundezas | Yeti das Profundezas | npc |
| monstros-lobo-do-inverno | Lobo do Inverno | npc |
| monstros-mimico-de-bau | Mímico de Baú | npc |
| monstros-doppelganger | Doppelganger | npc |
| monstros-hidra-das-cavernas | Hidra das Cavernas | npc |
| monstros-quimera | Quimera | npc |
| monstros-anjo-caido | Anjo Caído | npc |
| monstros-gargula-de-cristal | Gárgula de Cristal | npc |
| monstros-aberracao-tentacular | Aberração Tentacular | npc |
| monstros-basilisco-de-magma | Basilisco de Magma | npc |
| monstros-sereia-das-profundezas | Sereia das Profundezas | npc |
| monstros-troll-de-pedra | Troll de Pedra | npc |
| monstros-ciclope | Ciclope | npc |
| monstros-harpia-de-caverna | Harpia de Caverna | npc |
| monstros-roper | Roper | npc |
| monstros-aboleth | Aboleth | npc |
| monstros-pudim-negro | Pudim Negro | npc |
| monstros-lagosta-gigante-abissal | Lagosta-Gigante Abissal | npc |
| monstros-caranguejo-eremita-colossal | Caranguejo-Eremita Colossal | npc |
| monstros-aranha-cavaleira | Aranha-Cavaleira | npc |
| monstros-mosca-carnica-colossal | Mosca-Carniça Colossal | npc |
| monstros-besouro-trovao | Besouro-Trovão | npc |
| monstros-verme-gigante-de-pedra | Verme Gigante de Pedra | npc |
| monstros-salamandra-gigante | Salamandra Gigante | npc |
| monstros-behemoth-de-pedra | Behemoth de Pedra | npc |
| monstros-fera-da-sombra | Fera da Sombra | npc |
| monstros-medusa | Medusa | npc |
| monstros-fenix-de-caverna | Fênix de Caverna | npc |
| monstros-gigante-de-pedra | Gigante de Pedra | npc |
| monstros-bruxa-da-masmorra | Bruxa da Masmorra | npc |
| monstros-fera-seminal | Fera Seminal | npc |
| monstros-carnical-alado | Carniçal Alado | npc |
| monstros-balor | Balor | npc |
| monstros-enxame-de-ratos-cadaveres | Enxame de Ratos-Cadáveres | npc |
| monstros-elemental-de-terra | Elemental de Terra | npc |
| monstros-banshee | Banshee | npc |
| monstros-morcego-tirano | Morcego-Tirano | npc |
| monstros-ooze-ocular | Ooze Ocular | npc |
| monstros-tarrasque-bebe | Tarrasque (Bebê) | npc |
| monstros-goblin | Goblin | npc |
| monstros-esqueleto-de-guarda | Esqueleto de Guarda | npc |
| monstros-slime-de-masmorra | Slime de Masmorra | npc |


---

## Personagens e mesa (demo)

| ID | Papel |
| --- | --- |
| PC-pc-aventureiro | Jogador demo |
| PC-pc-mestre-demo | NPC demo mestre |
| USR-usr_demo_jogador | Conta jogador |
| USR-usr_demo_mestre | Conta mestre |
| ROOM-demo | Sala VTT padrão |

