# Dados e regras — pipeline Eldarin

Regra: **livros** = fonte; **JSON/TS gerados** = o que o app lê. Não editar `data/compendiums/*.json` à mão salvo exceção documentada.

## Comando único

```bash
npm run sync:data
```

Ordem:

| # | Script | Saída |
|---|--------|--------|
| 1 | `scripts/generate-compendium.mjs` | `monstros.json`, `magias.json`, `habilidades.json` |
| 2 | `scripts/gen-equipment-compendium.py` | `armas.json`, `equipamentos.json` |
| 3 | `scripts/gen-tabela-ids.py` | `livros/TABELA-IDS-ELDARIN.md` |
| 4 | `scripts/generate-subclass-tracks.mjs` | `data/character/subclass-tracks.json` |
| 5 | `scripts/gen-loot-catalog-ts.py` | `lib/character/loot-catalog.ts` |

Requisitos: Node 20+, Python 3.

## Verificação

```bash
npm run sync:data:check
```

Confere `catalogId` nos compêndios e que descrições HTML não exibem `ID:` ao jogador.

## IDs canônicos

| Onde | Uso |
|------|-----|
| `system.catalogId` em compêndios | MON-*, MAG-*, ARC-L*, ARM-*, HAB-* — **interno**, não na UI |
| `CLASS_CANON_ID`, `RACE_CANON_ID`, `LINHAGEM_CANON_ID` em `lib/character/rules.ts` | Classes/raças/linhagens |
| `livros/TABELA-IDS-ELDARIN.md` | Tabela mestra para autores e agentes |

Import único para código:

```ts
import { CLASS_CANON_ID, RACE_CANON_ID, LINHAGEM_CANON_ID } from "@/lib/character/canon-ids";
```

## Fluxo ao mudar regras

1. Editar `livros/*.md` (e `scripts/equipment_*.py` se equipamento).
2. `npm run sync:data`
3. `npm run sync:data:check`
4. `npm run build`
5. Commit livros + `data/` + `lib/character/loot-catalog.ts` + tabela IDs se mudou.

## O que não gerar aqui

- Comportamento de combate → `lib/combat/`, `lib/room/handlers/`
- Estado de sala → memória (`lib/room/`); DB no Passo 5 do [REFATORACAO.md](../REFATORACAO.md)
