# Culinária e assimilação no VTT

Implementação inicial dos **Cap. 5–6** (Livro do Jogador).

## O que já funciona

| Regra | Onde |
|-------|------|
| Qualidade da refeição (Coccao) | `lib/culinary/meal-rules.ts` |
| Prato estruturado (Foco + d4) | `lib/culinary/apply-meal.ts` |
| 8 habilidades por espécime | `data/compendiums/monstros.json` (`assim-NNN-N`) |
| Mestre serve refeição | Menu mestre → aba **Culinária** |
| Assimilações na ficha | `culinaryProgress.activeAssimilations` |
| PA acúmulo **9** (Cap. 2.6) | `lib/combat/pa-economy.ts` |

## Fluxo na mesa

1. Mestre abre **Menu do mestre → Culinária**
2. Informa `entryId` do monstro (ex. `monstros-zumbi-de-masmorra`)
3. Rolagens: **Coccao** (total) e **d4** de aproveitamento
4. Escolhe **Foco** + extras conforme d4
5. Marca participantes → **Servir refeição**
6. HP/PA parcial restaurados; assimilações aparecem na ficha (24h)

## API

`POST /api/room/[roomId]/culinary/meal`

## Próximos passos (livro)

- Estudo de anatomia (Cap. 5.1) persistido
- Extração com CD (Cap. 5.2)
- Gororoba — save Fortitude CD 13
- Efeitos mecânicos das assimilações no combate (hoje: registro + UI)
- Cap. 5B plantas, exaustão por fome, descanso curto/longo

## Verificação

```bash
npm run test:culinary
```
