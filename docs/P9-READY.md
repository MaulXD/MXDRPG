# Pré-beta (P9) — gate técnico

Use depois de features P1–P8 no ar. **Neon/postgres** pode entrar antes do beta ou na mesma semana — ver [P0-NEON-SETUP.md](./P0-NEON-SETUP.md) quando for prioridade.

## Smoke automático

```powershell
# Local (app rodando)
npm run dev
# outro terminal:
npm run smoke:p0

# Produção
$env:SMOKE_BASE_URL="https://www.mxdrpg.com.br"
npm run smoke:p0
```

Esperado com `DATABASE_URL` no servidor: `"db": true`, `"persistence": "postgres"`.

## Env produção (mínimo beta)

| Variável | Obrigatório beta |
|----------|------------------|
| `DATABASE_URL` | Sim (Neon pooler) |
| `SESSION_SECRET` | Sim |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sim (login real) |
| `CLERK_SECRET_KEY` | Sim |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Sim (apelido/sync) |

## Roteiro humano

[P9 no PRD](./PRD-ELDARIN-VTT.md) · checklist: [BETA-P9-CHECKLIST.md](./BETA-P9-CHECKLIST.md)

1. Grupo 2–8 + mestre, 30+ min.
2. Login → wizard ficha → sala + convite → 2 browsers.
3. Iniciativa, movimento PA, ataque preview, magia área (cone 2 cliques).
4. Reload: sala e ficha persistem.

## Se reprovar P9

Corrigir fase (P0 PA, P2 sync, P5 UX) → novo ciclo beta. Sem anúncio público até B1–B7 OK.
