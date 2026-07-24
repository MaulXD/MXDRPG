# API da sala

> Estado: memória por padrão; com `DATABASE_URL`, salas persistem em Postgres — ver [POSTGRES.md](POSTGRES.md).

Estado: `globalThis.__eldarinRooms` — reinicia a cada deploy/serverless cold start.

## Snapshot

`GET /api/room/[roomId]` → `RoomSnapshot` (`scene`, `actors`, `combat`, `chat`, `revision`)

Query opcional: `?invite=CODE` (visitante com código do mestre).

## SSE (P2)

`GET /api/room/[roomId]/events?since={revision}&invite=CODE`

Eventos JSON: `{ type: "connected", revision }`, `{ type: "revision", revision }`.

## Handlers (`lib/room/handlers/`)

| Módulo | Funções |
|--------|---------|
| `room-lifecycle` | `createRoom`, `joinRoomByInvite`, `listRoomsForUser`, `getRoomSnapshot`, `getRoomMeta`, `getRoomActor` |
| `actors` | `updateRoomActor`, `levelUpRoomActor` |
| `tokens` | `updateRoomToken`, `moveRoomToken`, `spawnRoomMonster` |
| `combat-turn` | `rollRoomInitiative`, `advanceRoomTurn`, `setRoomCombatOrder` |
| `chat` | `addRoomChatMessage` |
| `combat-attack` | `executeRoomAttack` |
| `combat-ability` | `executeRoomAbility` |
| `combat-area` | `executeRoomAreaSpell` |

Fachada: `lib/room/store.ts` (re-export).

## Rotas HTTP

| Método | Rota | Handler |
|--------|------|---------|
| GET | `/api/room/[roomId]` | snapshot |
| PATCH | `/api/room/[roomId]/actors/[actorId]` | `updateRoomActor` |
| POST | `/api/room/[roomId]/actors/[actorId]/level-up` | `levelUpRoomActor` |
| PATCH | `/api/room/[roomId]/tokens/[tokenId]` | `updateRoomToken` |
| POST | `/api/room/[roomId]/tokens/move` | `moveRoomToken` |
| POST | `/api/room/[roomId]/tokens/spawn` | `spawnRoomMonster` |
| POST | `/api/room/[roomId]/chat` | `addRoomChatMessage` |
| POST | `/api/room/[roomId]/combat/attack` | `executeRoomAttack` |
| POST | `/api/room/[roomId]/combat/ability` | `executeRoomAbility` |
| POST | `/api/room/[roomId]/combat/area` | `executeRoomAreaSpell` |
| POST | `/api/room/[roomId]/combat/roll-initiative` | `rollRoomInitiative` |
| POST | `/api/room/[roomId]/combat/next-turn` | `advanceRoomTurn` |

Auth: `lib/auth/authorize-room.ts` usa `getRoom`.
