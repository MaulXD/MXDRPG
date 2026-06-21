# Mesa — Arquitetura de sync (Fases A–C)

## Fase A — Sync incremental

Ver [MESA-SYNC-INCREMENTAL.md](./MESA-SYNC-INCREMENTAL.md).

## Fase B — Estado particionado (cliente)

| Módulo | Papel |
|--------|--------|
| `hooks/vtt/mesa-room-store.ts` | Store externo + notificação por slice |
| `hooks/vtt/useMesaRoomSlice.ts` | `useMesaChat`, `useMesaMapSnapshot`, `useMesaActors`, … |
| `components/vtt/MesaSyncProvider.tsx` | `useRoomSync` → store + actions estáveis |

**Slices:** `chat` | `map` | `combat` | `actors` | `settings` | `meta`

Chat remoto **não** re-renderiza `MesaBattlefieldStage` (só escuta slice `map`).

## Fase C — Shell da mesa

| Componente | Papel |
|------------|--------|
| `components/vtt/mesa/MesaBattlefieldStage.tsx` | Mapa lazy + slice map |
| `components/vtt/mesa/MesaRoomChatPanel.tsx` | Chat + slice chat |
| `components/vtt/mesa/MesaCombatFlowHost.tsx` | Toasts de turno |
| `components/vtt/mesa/MesaCombatChatRevealBridge.tsx` | Reveal FX do chat de combate |

`MesaWorkspace` → `MesaSyncProvider` → `MesaWorkspaceInner` (rail, janelas, HUD).

## Próximo

- Extrair `MesaFoundryRail` / `MesaFloatingWindows` de `MesaWorkspace.tsx`
- Quebrar `Battlefield.tsx` em `MapCanvas`, `TokenLayer`, `CombatFxQueue`
