# Grid quadrado (VTT) — Eldarin

> **Status:** concluído (jun/2026). Terminologia legada removida do produto; saves antigos migrados na leitura.

## Canon (livros + mesa)

| Regra | Valor |
|-------|--------|
| Escala | 1 célula = 1,5 m |
| Alcance | `rangeCells` = células no mapa |
| Movimento / PA | Cada passo = 1 célula (8 direções) |
| Mapa | Quadrado `-R…R` em q e r |
| Pequeno / Médio | 1 célula |
| Grande | 2×2 (âncora NW) |
| Enorme / Gigante | 3×3 |
| Imenso | 4×4 |
| Colossal | 5×5 |

## Código

| Antigo | Atual |
|--------|--------|
| `grid-math.ts` (legado) | `lib/vtt/grid-math.ts` |
| `Battlefield.tsx` (legado) | `components/vtt/Battlefield.tsx` |
| `cellSize` | `cellSize` |
| `rangeCells` | `rangeCells` |
| `revealedCells` | `revealedCells` |
| `movementSpentCells` | `movementSpentCells` |

**Compatibilidade:** `lib/vtt/scene-normalize.ts` lê campos legados ao carregar sala.

**Nomes de magia/habilidade** (lore geométrico, não grid): Investida em Linha, Nova Radiante, Muralha Segmentada — mantidos no compendium.

## Teste

```bash
npm run test:move
node scripts/verify-grid-path.mjs
npx tsc --noEmit
```
