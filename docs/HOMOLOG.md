# MXDRPG — homolog local (MariaDB interno)

Ambiente para testar o **hub MXDRPG** (mesa Eldarin, login, persistência) **sem** apontar para o banco de produção (Contabo).

> **Nomenclatura:** o projeto é **MXDRPG**. *Eldarin* é um RPG/módulo VTT dentro do hub. O banco local se chama `eldarin` por convenção técnica do schema (`eldarin_*`).

## Pré-requisitos

- Node 20+ (`npm ci`)
- **Um** destes para o banco:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/), ou
  - **MariaDB nativo no Windows:** `winget install MariaDB.Server` (sem Docker)

## Subir uma vez

```bash
npm run homolog:up
```

Isso:

1. Cria `.env.homolog` a partir de `.env.homolog.example` (se ainda não existir)
2. Sobe MariaDB 11 em `docker-compose.homolog.yml` (porta **3306**, container `mxdrpg-homolog-db`)
3. Aguarda o banco ficar saudável
4. Roda `npm run db:migrate` (schema + seeds)

## Rodar o app

```bash
npm run dev:homolog
```

Abra http://localhost:3000 — `/api/health` deve retornar `db: true` e `persistence: "mariadb"`.

O script carrega **`.env.homolog` antes de `.env.local`**, então o MariaDB local tem prioridade sobre qualquer `DATABASE_URL` que você tenha no `.env.local` de produção.

## Comandos úteis

| Comando | Ação |
|---------|------|
| `npm run homolog:up` | Sobe DB + migrate |
| `npm run dev:homolog` | Next dev com env homolog |
| `npm run homolog:down` | Para o container (dados no volume) |
| `npm run homolog:reset` | Apaga volume e recria DB do zero |

## Credenciais padrão (só local)

| Item | Valor |
|------|--------|
| Host | `127.0.0.1:3306` |
| Database (schema Eldarin) | `eldarin` |
| User / senha | `eldarin` / `eldarin_homolog` |
| Root | `root` / `root_homolog` |

Connection string (já no example):

```
mysql://eldarin:eldarin_homolog@127.0.0.1:3306/eldarin
```

## Diferença do `npm run dev` normal

| | `npm run dev` | `npm run dev:homolog` |
|--|---------------|------------------------|
| DB | Só se `DATABASE_URL` em `.env.local` | MariaDB Docker via `.env.homolog` |
| Sem DB | Memória + JSON (login limitado) | MariaDB sempre (após `homolog:up`) |

## Produção

Não use este compose em Contabo. Lá continua valendo [PERSISTENCIA.md](./PERSISTENCIA.md) e [DEPLOY.md](../DEPLOY.md).
