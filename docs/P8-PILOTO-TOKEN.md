# P8 — Controle de token (parcial)

## Implementado

| Regra | Onde |
|-------|------|
| Mestre da sala pilota **qualquer** token | `canControlToken` → `canManageRoom` |
| Jogador só token linkado à **sua** ficha | `actor.ownerId === user.id` |
| Monstros: só mestre | `monsterEntryId` + UI `canControlCombat` |
| API combate valida token | `assertTokenControl` em attack/ability/area |

## UI

`MesaWorkspace` passa `canControlToken` → `Battlefield` habilita painel de ações só no token permitido.

## Pendente (P8 completo)

- Campo `delegateUserId` no token + UI “delegar controle”
- Indicador visual “mestre pilotando” no token
- Reconexão SSE + estado offline do jogador

Neon não é obrigatório para pilotar em memória; persistência melhora retomada após queda.
