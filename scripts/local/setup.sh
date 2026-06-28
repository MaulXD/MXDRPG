#!/usr/bin/env bash
set -euo pipefail

echo ""
echo " ╔══════════════════════════════════════════════════════════════╗"
echo " ║              MXDRPG — Assistente do Mestre                 ║"
echo " ║          Hospedagem local · Docker + ngrok                 ║"
echo " ╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Passo 1: Docker ─────────────────────────────────────────────────────────
echo " [1/4] Verificando Docker Desktop..."
if ! docker info > /dev/null 2>&1; then
  echo ""
  echo " [ERRO] Docker Desktop não está rodando."
  echo ""
  echo " O que fazer:"
  echo "   1. Abra o Docker Desktop (ícone da baleia na barra de tarefas)"
  echo "   2. Aguarde o status ficar 'Running'"
  echo "   3. Rode este script novamente"
  echo ""
  echo " Não tem Docker? Baixe em: https://www.docker.com/products/docker-desktop/"
  echo ""
  exit 1
fi
echo " [OK] Docker Desktop detectado."

# ── Verifica se já tem .env.local ───────────────────────────────────────────
if [[ -f .env.local ]]; then
  echo ""
  echo " [INFO] Configuração encontrada (.env.local). Já foi configurado antes."
  echo ""
  read -rp " Deseja ir direto para a inicialização? [S/N]: " SKIP
  if [[ "${SKIP,,}" == "s" ]]; then
    goto_launch=true
  else
    goto_launch=false
    echo ""
  fi
else
  goto_launch=false
fi

if [[ "$goto_launch" != "true" ]]; then
  # ── Passo 2: SESSION_SECRET ─────────────────────────────────────────────────
  echo " [2/4] Gerando chave de segurança..."
  if ! command -v node &> /dev/null; then
    echo ""
    echo " [ERRO] Node.js não encontrado."
    echo " Instale em: https://nodejs.org (LTS recomendado)"
    exit 1
  fi
  SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
  echo " [OK] Chave de segurança gerada."

  # ── Passo 3: Token ngrok ───────────────────────────────────────────────────
  echo ""
  echo " [3/4] Configurando ngrok (link público para jogadores)"
  echo ""
  echo " O ngrok cria um endereço HTTPS que os jogadores abrem no browser."
  echo " É gratuito e não precisa de cartão de crédito."
  echo ""
  echo " Para obter seu token:"
  echo "   1. Acesse: https://ngrok.com/signup"
  echo "   2. Crie a conta gratuita"
  echo "   3. Vá em Dashboard > Your Authtoken"
  echo "   4. Copie o token (parece: 2aBc123XYZ_...)"
  echo ""
  read -rp " Cole o token aqui: " NGROK_TOKEN
  if [[ -z "$NGROK_TOKEN" ]]; then
    echo ""
    echo " [ERRO] Token obrigatório para gerar o link dos jogadores."
    exit 1
  fi

  # ── Passo 4: Criar .env.local ───────────────────────────────────────────────
  echo ""
  echo " [4/4] Criando arquivo de configuração..."
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
  echo " [OK] .env.local criado."
fi

# ── Iniciar ──────────────────────────────────────────────────────────────────
echo ""
echo " ════════════════════════════════════════════════════════════════"
echo ""
read -rp " Tudo pronto! Deseja iniciar a mesa agora? [S/N]: " LAUNCH_NOW

if [[ "${LAUNCH_NOW,,}" != "s" ]]; then
  echo ""
  echo " Para iniciar depois, rode:"
  echo "   docker compose -f docker-compose.local.yml up --build"
  echo ""
  echo " Na primeira vez demora ~5 minutos."
  echo " Nas próximas: ~30 segundos."
  echo ""
  exit 0
fi

# Determina se é primeira execução
BUILD_FLAG="--build"
if [[ -f .env.local.first_run ]]; then
  BUILD_FLAG=""
else
  touch .env.local.first_run
  echo ""
  echo " Primeira execução — build completo (~5 min). Aguarde..."
fi

echo ""
echo " Iniciando servidor em background..."
docker compose -f docker-compose.local.yml up $BUILD_FLAG &
DOCKER_PID=$!

# ── Aguarda ngrok ────────────────────────────────────────────────────────────
echo " Aguardando servidores inicializarem..."
echo " (isso pode levar alguns minutos na primeira vez)"
echo ""

NGROK_URL=""
ATTEMPTS=0
while [[ -z "$NGROK_URL" ]]; do
  sleep 5
  ATTEMPTS=$((ATTEMPTS + 1))
  ELAPSED=$((ATTEMPTS * 5))

  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null \
    | python3 -c "import sys,json; t=[x for x in json.load(sys.stdin).get('tunnels',[]) if x['proto']=='https']; print(t[0]['public_url'] if t else '')" 2>/dev/null || true)

  if [[ -z "$NGROK_URL" ]]; then
    if [[ $ATTEMPTS -ge 36 ]]; then
      echo ""
      echo " [AVISO] Timeout esperando o ngrok. Verifique:"
      echo "   - Se o token no .env.local está correto"
      echo "   - O painel em: http://localhost:4040"
      echo ""
      wait $DOCKER_PID
      exit 0
    fi
    echo " Aguardando... (${ELAPSED}s)"
  fi
done

# ── Exibe link ───────────────────────────────────────────────────────────────
echo ""
echo " ╔══════════════════════════════════════════════════════════════╗"
echo " ║                    MESA PRONTA!                             ║"
echo " ╠══════════════════════════════════════════════════════════════╣"
echo " ║                                                              ║"
echo " ║  Link dos jogadores (copie e mande no grupo):               ║"
echo " ║                                                              ║"
echo " ║   $NGROK_URL"
echo " ║                                                              ║"
echo " ║  Seu acesso (mestre, local): http://localhost:3000          ║"
echo " ║  Painel ngrok:               http://localhost:4040          ║"
echo " ║                                                              ║"
echo " ╚══════════════════════════════════════════════════════════════╝"
echo ""

# Tenta abrir no browser
if command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:3000" &>/dev/null &
elif command -v open &>/dev/null; then
  open "http://localhost:3000"
fi

echo " Para encerrar: pressione Ctrl+C"
echo " Os dados são salvos automaticamente a cada 60 segundos."
echo ""

wait $DOCKER_PID
