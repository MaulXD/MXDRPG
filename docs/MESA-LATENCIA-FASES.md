# MXDRPG — Latência da mesa (Fases 1–4)

Plano de otimização percebida BR→Contabo, validado com **grupo fixo** antes de deploy grande.

## Fases entregues

| Fase | Entrega |
|------|---------|
| **F1** | FX pending ≤300 ms, move/ataque/consume optimistic, pill sync visível, retry POST |
| **F2** | POST combate/mover/consume → **delta** (`kind: "delta"`), sync GET trim (chat 100, fichas alheias mínimas) |
| **F3** | Fila FX (sequência no chat), retry em background se POST falhar (mantém animação pending) |
| **F4** | SSR snapshot inicial na mesa, preload dice-box ao ativar combate |

## Delta de mutação

Resposta compacta em `POST /combat/attack`, `/ability`, `/consume`, `/tokens/move`:

```json
{
  "kind": "delta",
  "roomId": "...",
  "revision": 42,
  "tokens": [ { "id": "...", "vida": 8, "pa": 3 } ],
  "combat": { ... },
  "chatAppend": [ { "kind": "combat", ... } ]
}
```

Cliente faz merge via `applyRoomResponse` / `applyRoomApiPayload`.

## Sync GET

`GET /api/room/:id` retorna snapshot trimado:

- **Chat:** últimas 100 mensagens
- **Jogador:** ficha própria completa; colegas só nome/retrato/HP/PA
- **GM:** snapshot completo (com chat 100)

## Critérios de aceite (grupo fixo)

Teste: 1 GM + 2–3 jogadores, Chrome desktop, **mxdrpg.com.br** (Contabo).

| # | Cenário | Passa se… |
|---|---------|-----------|
| A1 | Primeiro ataque | Painel/dado visível em **≤ 300 ms** do clique |
| A2 | Ataque com acerto | Preview **~4–5 s**; HP no mapa **≤ 1 s** após POST |
| A3 | Ataque errado | ERROU + expulsão; sem slot de dano |
| A4 | 3 ataques seguidos | FX **enfileirados**, sem sobrepor dados |
| A5 | Mover token | Token na célula **≤ 200 ms** (optimistic) |
| A6 | Consumir item | Mesma lógica A5 |
| A7 | Jogador B vê A | Ação de A em B **≤ 2 s** |
| A8 | Queda rede 5 s | Pill “Reconectando”; recupera sem refresh |
| A9 | POST falha 1× | Retry ok; sem HP duplicado |
| A10 | Abrir mesa | Interativo **≤ 5 s** |
| A11 | Spawn GM | Token no mapa **≤ 800 ms** percepção |

**Go produção:** ≥ 9/11; **A1, A2, A5, A7** obrigatórios.

## Homolog local (opcional)

Ver [HOMOLOG.md](./HOMOLOG.md). Validação oficial = Contabo.

## Infra BR

Ver [INFRA-BR-AVALIACAO.md](./INFRA-BR-AVALIACAO.md).

## Sync incremental (Fase A)

Ver [MESA-SYNC-INCREMENTAL.md](./MESA-SYNC-INCREMENTAL.md) — delta via SSE/GET `?since=`, journal de revisions.

## Arquitetura mesa (Fases B–C)

Ver [MESA-ARQUITETURA.md](./MESA-ARQUITETURA.md) — store por slices, `MesaSyncProvider`, `MesaBattlefieldStage`.
