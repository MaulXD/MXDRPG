# Pré-beta (P9) — gate técnico

Use depois de features P1–P8 no ar. **MariaDB** já está na pilha atual; setup em [PERSISTENCIA.md](./PERSISTENCIA.md) e ambiente local em [HOMOLOG.md](./HOMOLOG.md).

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

Esperado com `DATABASE_URL` no servidor: `"db": true`, `"persistence": "mariadb"`.

## Env produção (mínimo beta)

| Variável | Obrigatório beta |
|----------|------------------|
| `DATABASE_URL` | Sim (URL `mysql://` ou `mariadb://`) |
| `SESSION_SECRET` | Sim (HMAC do cookie, mínimo 16 caracteres) |
| `AUTH_URL` ou `NEXT_PUBLIC_APP_URL` | Sim (origem dos callbacks OAuth) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Sim para login com Google |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Sim para login com Discord |

## Roteiro humano

[P9 no PRD](./PRD-ELDARIN-VTT.md) · checklist: [BETA-P9-CHECKLIST.md](./BETA-P9-CHECKLIST.md)

1. Grupo 2–8 + mestre, 30+ min.
2. Login → wizard ficha → sala + convite → 2 browsers.
3. Iniciativa, movimento PA, ataque preview, magia área (cone 2 cliques).
4. Reload: sala e ficha persistem.

## Se reprovar P9

Corrigir fase (P0 PA, P2 sync, P5 UX) → novo ciclo beta. Sem anúncio público até B1–B7 OK.
