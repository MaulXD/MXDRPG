# P2 — SSE, convite e visitante

## SSE

| Rota | Função |
|------|--------|
| `GET /api/room/[roomId]/events?since=0&invite=CODE` | `text/event-stream` — eventos `connected`, `revision` |

Cliente: `hooks/useRoomSync.ts` usa `EventSource`; em erro cai em poll 4s.

`GET /api/room/[roomId]?invite=CODE` — snapshot com mesmo gate de visualização.

## Convite (mestre)

- Barra `RoomInviteBar` na mesa (dono): código + link mágico
- Link espectador/jogador: `/mesa/{roomId}?invite={CODE}`
- Logado + link válido → `joinRoomByInvite` automático → redirect sem query

## Visitante (PRD D22)

| Pode | Não pode |
|------|----------|
| Ver mapa, tokens, chat **leitura** | Chat, dados, editar ficha/token |
| SSE + snapshot com `?invite=` | POST combate/movimento (401/403 membro) |

Demo: `/mesa/demo` aberto; sem login = visitante.

## Teste rápido

1. Mestre cria mesa → copia link
2. Aba anônima abre link → banner visitante, chat sem input
3. Duas abas logadas → mover token → outra aba atualiza &lt; ~1s (SSE)

**Próximo:** P4 wizard / P5 combate UX.
