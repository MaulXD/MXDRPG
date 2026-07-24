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
2. Sobe MariaDB (Docker ou nativo no Windows, porta **3306**)
3. Aguarda o banco ficar saudável
4. Roda `npm run db:migrate` (schema)
5. Cria a mesa **`mesa-local`** persistida no banco

## Rodar o app

**Um comando (recomendado):**

```bash
npm run local
```

Ou em dois passos:

```bash
npm run homolog:up
npm run dev:homolog
```

Abra http://localhost:3000 — `/api/health` deve retornar `db: true` e `persistence: "mariadb"`.

**Mesa de teste no MariaDB local:**

| URL | Uso |
|-----|-----|
| http://localhost:3000/mesa/mesa-local | Combate, sync, tokens — **grava no DB** |

Convite da mesa local: **LOCALTST** (opcional em localhost).

Em **localhost**, `/mesa/mesa-local` abre sem login (só assistir). Para mover tokens e combate, cadastre uma conta
(e-mail/senha) e vincule-a à mesa pelo código de convite — não há mais login rápido sem cadastro.

> **Pendente:** `data/homolog/mesa-local.seed.json` ainda referencia os ids `usr_demo_mestre`/`usr_demo_jogador`
> como dono/membro (removidos do seed de usuários). Cadastre uma conta e ajuste `ownerId`/`memberIds` no arquivo
> (ou use `npm run admin` para trocar o dono da mesa) antes de depender deste fixture localmente.

O script carrega **`.env.homolog` antes de `.env.local`**, então o MariaDB local tem prioridade sobre qualquer `DATABASE_URL` de produção.

## Comandos úteis

| Comando | Ação |
|---------|------|
| `npm run local` | **Recomendado** — DB + mesa de teste + Next dev |
| `npm run homolog:up` | Sobe DB + migrate + mesa-local |
| `npm run dev:homolog` | Next dev com env homolog |
| `npm run local:seed` | Recria só a mesa `mesa-local` no DB |
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
