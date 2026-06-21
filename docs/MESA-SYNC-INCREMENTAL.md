# Mesa — Sync incremental (Fase A)

Plano técnico para substituir **GET snapshot completo** por **delta incremental** quando o cliente já está sincronizado.

## Problema

1. SSE envia `{ type: "revision", revision: N }`.
2. Cliente debounce → `GET /api/room/:id?since=N`.
3. Servidor responde **snapshot JSON inteiro** (mesmo trimado).
4. Jogador B paga RTT + parse + re-render de `MesaWorkspace` / `Battlefield`.

POST do autor já retorna `kind: "delta"`; observadores ainda pagam snapshot full.

## Solução

| Camada | Comportamento |
|--------|----------------|
| **Journal** | Ring buffer (~80 rev) de `RoomSnapshot` por `revision` após cada `persistRoom` |
| **GET `?since=R`** | Se `R` no journal → `RoomDelta` viewer-safe; senão → snapshot full |
| **SSE** | Envia `{ type: "delta", delta }` em vez de só revision |
| **Cliente** | `applyRoomApiPayload` local; GET full só no connect / gap / fallback |

## Tipos

Reutiliza `RoomDelta` / `RoomApiPayload` em `lib/room/room-delta.ts`.

Resposta GET:

- **304** — `room.revision <= since`
- **200 + JSON snapshot** — connect, gap no journal, `since=0`
- **200 + JSON delta** — `{ kind: "delta", revision, tokens?, combat?, ... }`

Evento SSE:

```json
{ "type": "delta", "delta": { "kind": "delta", "roomId": "...", "revision": 42, ... } }
```

Fallback SSE (journal miss):

```json
{ "type": "refresh", "revision": 42 }
```

Header opcional: `X-Sync-Mode: delta | full`.

## Viewer-safe delta

Delta calculado com o mesmo pipeline do GET:

```
trimSnapshotForSync(snapshotForViewer(before), user)
  → buildRoomDelta
  → trimSnapshotForSync(snapshotForViewer(after), user)
```

Garante PA redigido, fog, HP de monstro e fichas alheias mínimas.

## Journal

```typescript
recordSnapshotAtRevision(roomId, snapshot)  // após persistRoom
getSnapshotAtRevision(roomId, revision)     // null se expirado
ensureJournalBaseline(roomId, snapshot)     // seed no load DB
```

Cap: **80 revisions** por sala. `since` apontando para rev expirada → snapshot full.

## Fluxo cliente

```
SSR / connect     → snapshot full (since=0 ou sem header)
SSE delta         → merge local, revisionRef = delta.revision
GET ?since=R      → delta ou 304 ou full
POST mutação      → delta (já existente)
Reconnect / gap   → refresh() → full
```

## Critérios de aceite

- A7: jogador B vê ação de A **sem GET full** quando `since` está no journal.
- Reconnect após >80 mutações: full snapshot, sem crash.
- GM e jogador recebem deltas coerentes com visibilidade (PA/HP/fog).

## Próximas fases (fora deste PR)

- **Fase B:** estado particionado no cliente (slices scene/combat/chat).
- **Fase C:** quebra de `Battlefield` / `MesaWorkspace`.
