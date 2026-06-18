# P5 — Combate UX (Epic 9)

Preview de ações no tabuleiro célula: PA, alcance, área e alvos antes de confirmar.

## O que foi entregue

| Peça | Arquivo |
|------|---------|
| Formas de área (burst, wall, cone, line, cube) | `lib/vtt/grid-area.ts` |
| Preview PA / ataque / área | `lib/combat/action-preview.ts` |
| HUD flutuante | `components/vtt/BattlefieldActionHud.tsx` |
| Highlights + direção 2 cliques | `hooks/vtt/useBattlefieldHighlights.ts`, `useBattlefieldPointer.ts` |
| Célula inválido + chip PA no hover | `lib/vtt/draw-battlefield.ts` |
| Mesa integrada | `components/vtt/Battlefield.tsx` |
| API `areaDirection` | `POST /api/room/[id]/combat/area` |

## Fluxo do jogador

1. Selecionar token → ação (mover, ataque, magia de área).
2. **Movimento:** célula verde (caminhada) / âmbar (corrida); hover mostra distância, metros e `+0 PA` / `+1 PA`; inválido em vermelho.
3. **Ataque / habilidade:** alvos válidos com anel tracejado; hover no token → HUD com PA, modo de d20 e CA estimada.
4. **Área burst/cube/wall:** clique no centro dentro do alcance → conjura.
5. **Cone / linha:** 1º clique = centro; 2º clique = célula vizinho (direção 0–5); preview roxo/azul enquanto move o mouse.

## API

Corpo opcional em magia de área:

```json
{
  "casterTokenId": "...",
  "centerQ": 0,
  "centerR": 0,
  "actionEntryId": "...",
  "areaDirection": 2
}
```

`areaDirection` é obrigatório no servidor para `cone` e `line` (`resolveAreaSpell`).

## Verificação

```bash
npx tsc --noEmit
```

Na mesa: modo corrida com PA insuficiente → célula vermelho; magia cone → dois cliques e chat com células corretos.

## Compêndio (área)

`scripts/generate-compendium.mjs` preenche `system.spell.area` (`burst`, `wall`, `cone`, `line`, `cube`). Regenerar:

```bash
npm run sync:data
```

Magias com área no gerador: Bola de Fogo, Nova, Muralha, Parede de Fogo, Mãos Gelidas, Onda de Trovão, Ventania, Relâmpago, Cone de Frio, Terremoto, Esporos, Grande Decomposição, etc.

## Próximo

- P9 beta: [BETA-P9-CHECKLIST.md](./BETA-P9-CHECKLIST.md) após P0 Neon prod.
