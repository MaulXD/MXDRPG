#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       MXDRPG — Setup hospedagem local           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Verifica Docker ─────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "[ERRO] Docker não encontrado ou não está rodando."
  echo "       Instale em: https://www.docker.com/products/docker-desktop/"
  exit 1
fi
echo "[OK] Docker detectado."

# ── Gera SESSION_SECRET ─────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "[ERRO] Node.js não encontrado. Instale em https://nodejs.org"
  exit 1
fi
SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
echo "[OK] SESSION_SECRET gerado."

# ── Pergunta NGROK_AUTHTOKEN ────────────────────────────────────
echo ""
echo "Crie uma conta gratuita em https://ngrok.com"
echo "Copie seu authtoken em: Dashboard > Your Authtoken"
echo ""
read -rp "Cole seu NGROK_AUTHTOKEN aqui: " NGROK_TOKEN
if [[ -z "$NGROK_TOKEN" ]]; then
  echo "[ERRO] NGROK_AUTHTOKEN é obrigatório."
  exit 1
fi

# ── Gera .env.local ─────────────────────────────────────────────
cat > .env.local <<EOF
NGROK_AUTHTOKEN=$NGROK_TOKEN
SESSION_SECRET=$SECRET
DB_PASSWORD=mxdrpg_local
DB_ROOT_PASSWORD=mxdrpg_root
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
EOF

echo ""
echo "[OK] .env.local criado com sucesso."
echo ""
echo "════════════════════════════════════════════════════"
echo " Próximo passo: inicie a mesa com o comando abaixo"
echo ""
echo "   docker compose -f docker-compose.local.yml up --build"
echo ""
echo " Depois abra http://localhost:4040 para ver o link"
echo " público gerado pelo ngrok e compartilhe com os jogadores."
echo "════════════════════════════════════════════════════"
echo ""
