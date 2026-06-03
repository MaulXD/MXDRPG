# Divisão do material — Eldarin v4.0

> **Canônico para edição:** `livros/LIVRO-DO-JOGADOR.md` + `livros/LIVRO-DO-MESTRE.md` (depois sincronizar `Eldarin_Ecologia_de_Masmorra_COMPLETO_v4.md`).  
> Ficha: `FICHA_PERSONAGEM_ELDARIN_v4.md` (1–2 páginas).

## Livros principais

| Volume | Arquivo | Conteúdo |
|--------|---------|----------|
| **Livro do Jogador** | `LIVRO-DO-JOGADOR.md` | **Cap. 5B:** 40 plantas · **Cap. 6:** assimilacao **por especime** (001–060, 8 cada) · **60 magias** |
| **Assimilacao (completa)** | `ASSIMILACAO-POR-ESPECIME.md` | 60 monstros × 8 habilidades (espelho do bestiario) |
| **XP por especime** | `TABELA-XP-ESPECIMES.md` | 001–060 · 100×Nv (Cap. 2.5 Jogador) |
| **Flora (referencia)** | `CAPITULO-5B-FLORA-DE-ELDARIN.md` | Copia tambem embutida no Jogador apos Cap. 6 |
| **Biomas (profundo)** | `BIOMAS-APROFUNDADOS.md` | Origem, sobrevivencia flora/fauna, 20 biomas |
| **Objetos de cenario** | `CATALOGO-OBJETOS-DE-CENARIO.md` | Terreno, props, perigos por bioma (OBJ-G, OBJ-B##) |
| **Sobrevivencia (regras)** | `REGRAS-ECOLOGIA-DE-SOBREVIVENCIA.md` | 3 vias, pressao ambiental, composicao de mapa |
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
