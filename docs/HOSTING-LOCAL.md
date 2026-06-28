# MXDRPG — Hospedagem local (modo Mestre)

O mestre pode rodar a mesa no próprio PC e compartilhar via túnel ngrok.  
Dados ficam no volume Docker local; save automático a cada 60 segundos.

## Início rápido

```bash
# 1. Configurar (apenas na primeira vez)
scripts\local\setup.bat          # Windows
bash scripts/local/setup.sh     # Mac / Linux

# 2. Subir o servidor
docker compose -f docker-compose.local.yml up --build   # 1ª vez (~5 min)
docker compose -f docker-compose.local.yml up           # próximas vezes (~30s)

# 3. Link dos jogadores
#    Abrir http://localhost:4040 → copiar URL https://
```

## Arquitetura

```
┌──────────────────────────────────────────┐
│  PC do mestre (Docker Desktop)           │
│                                          │
│  ┌──────────┐    ┌──────────┐           │
│  │ MariaDB  │◄───│ Next.js  │:3000      │
│  │  11.4    │    │  (app)   │           │
│  └──────────┘    └────┬─────┘           │
│                       │                 │
│                  ┌────▼─────┐           │
│                  │  ngrok   │:4040      │
│                  └────┬─────┘           │
└───────────────────────┼─────────────────┘
                        │  HTTPS túnel
                   ┌────▼──────────────┐
                   │  Jogadores (web)  │
                   └───────────────────┘
```

## Variáveis de ambiente (`.env.local`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NGROK_AUTHTOKEN` | Sim | Token da conta ngrok (gratuita) |
| `SESSION_SECRET` | Sim | 32 bytes hex — gerado pelo script setup |
| `DB_PASSWORD` | Não | Senha MariaDB local (padrão: `mxdrpg_local`) |
| `AUTH_URL` | Não | URL base (padrão: `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Não | OAuth Google (deixar vazio = desabilitado) |
| `DISCORD_CLIENT_ID` | Não | OAuth Discord (deixar vazio = desabilitado) |

## Volumes Docker

| Volume | Conteúdo |
|---|---|
| `mxdrpg_local_db` | Banco de dados MariaDB (aventuras, salas, personagens) |
| `mxdrpg_local_logs` | Logs da aplicação |

Para apagar tudo e recomeçar:
```bash
docker compose -f docker-compose.local.yml down -v
```

Para manter os dados entre sessões (parar sem apagar):
```bash
docker compose -f docker-compose.local.yml down
```

## Save periódico

A aplicação salva o estado das salas no banco a cada **60 segundos** via `lib/room/internal/periodic-save.ts`.  
Mutações de sala não bloqueiam mais no banco — o game loop retorna imediatamente.

## Guia visual passo a passo

Disponível como página interativa (checklist clicável) publicada em:  
`docs/HISTORICO.md` → entrada 2026-06-27 → link do Artifact
