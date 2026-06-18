# MariaDB — Eldarin VTT

Persistência exclusiva em **MariaDB** (`mysql2`). Postgres/Neon **não** são suportados.

Setup rápido: [PERSISTENCIA.md](./PERSISTENCIA.md).

## Local

```bash
# .env.local
DATABASE_URL=mysql://root:senha@127.0.0.1:3306/eldarin

npm run db:migrate
npm run smoke:a1
```

## Contabo

- `DATABASE_URL=mysql://user:pass@host:3306/eldarin?ssl=true`
- Rodar `npm run db:migrate` após deploy
- `/api/health` → `"db": true`, `"persistence": "mariadb"`

Sala `demo` não grava no banco.
