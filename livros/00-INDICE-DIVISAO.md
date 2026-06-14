# Divisão do material — Eldarin v4.0

> **Canônico para edição:** `livros/LIVRO-DO-JOGADOR.md` + `livros/LIVRO-DO-MESTRE.md` (depois sincronizar `Eldarin_Ecologia_de_Masmorra_COMPLETO_v4.md`).  
> Ficha: `FICHA_PERSONAGEM_ELDARIN_v4.md` (1–2 páginas).

## Livros principais

| Volume | Arquivo | Conteúdo |
|--------|---------|----------|
| **Livro do Jogador** | `LIVRO-DO-JOGADOR.md` | **Cap. 2.6 / 3.1:** Pontos de Acao (PA, mesa digital) · **Cap. 5.2.1:** cozinha automática · **Cap. 12.0:** talentos ±PA · **Cap. 5B:** 40 plantas · **Cap. 6:** assimilação **por espécime** (001–060, 8 cada) · **61 magias** · **Cap. 14.8** efeitos EFE no VTT |
| **Efeitos de equipamento** | `CATALOGO-EFEITOS-DE-EQUIPAMENTO.md` | EFE-01–10 · ORG-01–08 · `weapon.special` |
| **Site / VTT** | `app/`, `components/`, `data/compendiums/` | UI em PT-BR (`lang=pt-BR`); slugs VTT sem acento |
| **Site jogável (roteiro)** | `docs/ELDARIN-SITE-JOGAVEL.md` | Camadas, rotas, fases MVP→v1, DoD, pipeline livro→JSON |
| **Assimilação (completa)** | `ASSIMILACAO-POR-ESPECIME.md` | 60 monstros × 8 habilidades (espelho do bestiário) |
| **XP por espécime** | `TABELA-XP-ESPECIMES.md` | 001–060 · 100×Nv (Cap. 2.5 Jogador) |
| **Flora (referência)** | `CAPITULO-5B-FLORA-DE-ELDARIN.md` | Cópia também embutida no Jogador após Cap. 6 |
| **Biomas (profundo)** | `BIOMAS-APROFUNDADOS.md` | Origem, sobrevivência flora/fauna, 20 biomas |
| **Objetos de cenário** | `CATALOGO-OBJETOS-DE-CENARIO.md` | Terreno, props, perigos por bioma (OBJ-G, OBJ-B##) |
| **Sobrevivencia (regras)** | `REGRAS-ECOLOGIA-DE-SOBREVIVENCIA.md` | 3 vias, pressao ambiental, composicao de mapa |
| **Vertical, luz, brasas** | `SUPLEMENTO-BIOMAS-VERTICAIS-LUZ-E-BRASAS.md` | Biomas 9 e 12; escuro sem tocha; cozinha automática + Kit de Brasas |
| **Tesouros e minérios** | `CATALOGO-TESOUROS-MINERAIS-ESPECIARIAS.md` | 30 ESP · 30 MIN · 20 TES · saque por monstro 001–060 · OBJ-R |
| **Livro do Mestre** | `LIVRO-DO-MESTRE.md` | Biomas, 11 Bocas, bosses, **Magia na mesa** (NPC), **Comportamentos**, bestiário (~80) |

## Suplementos (opcionais)

| Volume | Arquivo | Conteúdo |
|--------|---------|----------|
| **Atlas de Eldarin** | `ATLAS-DE-ELDARIN.md` | Reinos, cidades, vilas, castelos, torres, rotas |
| **Guias de ecologia** | `guias-ecologia/` | Folhetos curtos por tipo (mesa rápida) |

## PDFs (layout para impressão)

Pasta `livros/pdf/` — `python scripts/build-pdfs.py` · **geral:** `--geral` ou `Eldarin-Edicao-Geral-v4.pdf` · ecologia: `--ecologia`.

## Regenerar os livros a partir do mestre

Se editar o MD completo, rode de novo o script de divisão (PowerShell + Python no repositório) ou peça ao assistente para “atualizar Livro do Jogador e Livro do Mestre”.

**Jogador:** linhas 25–1003, 1004–1116, 1118–1944 do arquivo mestre.  
**Mestre:** linhas 1946–fim + injeção de comportamentos.
