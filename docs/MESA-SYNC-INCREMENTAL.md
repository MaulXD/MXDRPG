# Mesa — Sync incremental (Fase A)

Plano técnico para substituir **GET snapshot completo** por **delta incremental** quando o cliente já está sincronizado.

## Problema

1. SSE avisa `{ revision }` → cliente faz `GET ?since=R`.
2. Resposta **snapshot JSON inteiro** (mesmo trimado) ou delta mal aplicado remontando mapa.
3. Jogador B paga RTT + parse + re-render de `Battlefield` (~3k linhas).

## Solução (v2 — pós-regressão)

| Camada | Comportamento |
|--------|----------------|
| **Journal** | Ring buffer (~80 rev): snapshot + **delta canonico** gravados em `persistRoom` |
| **SSE** | Só `{ type: "revision" }` — **leve** (sem `getRoom` + diff por tick) |
| **GET `?since=R`** | Delta viewer-safe quando `R` está no journal; senão snapshot full |
| **mergeRoomDelta** | Preserva refs de `scene` / `combat` / `settings` se inalterados |
| **Battlefield** | Ignora bump de revision se mapa/combate/settings iguais (delta só-chat) |
| **useRoomSync** | `immediate` só quando delta toca mapa/combate; chat usa `startTransition` |

### Por que SSE não envia delta

Enviar delta no SSE (v1) executava `getRoom()` + `buildViewerSyncDelta()` **a cada 400 ms × N clientes** — pior que o modelo anterior. O delta vai no **GET debounced** (1× por mudança por cliente).

## Tipos

Reutiliza `RoomDelta` em `lib/room/room-delta.ts`.

Helpers:

- `isChatOnlyDelta(delta)` — só `chatAppend`
- `deltaAffectsBattlefield(delta)` — tokens, combat, settings, actors, pings

## Fluxo cliente

```
Connect / SSR     → snapshot full
SSE revision      → debounce 80–120 ms → GET ?since=R → delta ou full
POST mutação      → delta (autor)
Chat remoto       → merge sem remontar scene (refs estáveis)
Combate remoto    → merge immediate no mapa
```

## Critérios de aceite

- A7: jogador B vê ação de A via GET delta (payload pequeno).
- Chat/combat log não remonta grid quando só mensagem nova.
- SSE não dispara `getRoom` pesado no poll.

## Próximas fases

- **Fase B:** Context/slices (`scene` | `combat` | `chat`) com subscribe seletivo.
- **Fase C:** Quebra de `Battlefield` / `MesaWorkspace`.
