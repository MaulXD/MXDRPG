# P6 — Bestiário spawnável

## Validação

```bash
npm run sync:data:check
```

Inclui `scripts/verify-monster-spawn.mjs`: cada monstro em `monstros.json` precisa de vida, PA, defesa, movimento célula, ≥1 ação e `catalogId` MON-*.

## Mesa

- `MonsterSpawnPanel` + variante Elite/Colossal
- Mestre da sala invoca em célula clicado
- **69** entradas no gerador (`scripts/generate-compendium.mjs`)

## Próximo

- Expandir gerador com mais espécies do livro (meta PRD: 100% bestiário editorial)
- Loot tables por bioma (Epic 8+)
