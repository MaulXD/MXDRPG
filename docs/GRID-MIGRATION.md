# Migração hex → grid quadrado (VTT)

> **Status:** motor do VTT migrado para **grid quadrado** (jun/2026).  
> Coordenadas na API permanecem `{ q, r }` e `axial` nos tokens — **1 hex legado = 1 célula**.

## Canon (livros + mesa)

| Regra | Valor |
|-------|--------|
| Escala | 1 célula = 1,5 m |
| Alcance numérico | 1:1 (walk 4 = 4 células; `rangeHex` = células) |
| Movimento / PA | Cada passo = 1 célula (8 direções; PA igual ao hex) |
| Mapa | Quadrado `-R…R` em q e r |
| Pequeno / Médio | 1 célula |
| Grande | 2×2 (âncora NW) |
| Enorme / Gigante | 3×3 |
| Imenso | 4×4 |
| Colossal | 5×5 |
| Áreas | Raio Chebyshev; cone/linha em 8 direções |

## Código alterado

- `lib/vtt/hex-math.ts` — projeção pixel, distância, vizinhos, desenho quadrado
- `lib/vtt/hex-grid.ts` — grade retangular
- `lib/vtt/hex-area.ts` — burst, cone, linha, muralha
- `lib/vtt/creature-size.ts` — footprints 2×2 … 5×5
- `lib/vtt/token-occupancy.ts`, `dungeon-layer.ts` — limites do mapa
- `lib/combat/ability.ts` — flanquear (oposto em 8 dirs)
- `app/api/room/.../combat/area/route.ts` — direção 0–7
- `livros/LIVRO-DO-JOGADOR.md` §3.1.3

## Nomes legados (não quebrar save/API)

Mantidos de propósito: `hexSize`, `Axial`, `hexNeighbors`, `rangeHex`, `revealedHexes`, `HexBattlefield`, `movementSpentHex`.

## Pendente (fases seguintes)

- Renomear magias “Hex” no compendium (caso a caso)
- Atualizar catálogos `livros/*.md` restantes e regerar JSON onde diga “hex”
- `HexPreview.tsx` (home) — grid quadrado
- Renomear componentes `Hex*` → `Grid*` (cosmético)
- Mesas antigas: coordenadas q/r **mantidas** (mesma escala 1:1); GM pode reposicionar tokens grandes (footprint mudou)

## Teste rápido

```bash
npm run build
npm run verify:hex-path   # se existir — validar pathfinding
```

Na mesa: mover token, área cone/linha, spawn monstro Grande, iniciativa.
