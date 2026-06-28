@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║              MXDRPG — Assistente do Mestre                 ║
echo  ║          Hospedagem local · Docker + ngrok                 ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: ── Passo 1: Docker ─────────────────────────────────────────────────────────
echo  [1/4] Verificando Docker Desktop...
docker info > nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERRO] Docker Desktop nao esta rodando.
    echo.
    echo  O que fazer:
    echo    1. Abra o Docker Desktop ^(icone da baleia na barra de tarefas^)
    echo    2. Aguarde o status ficar "Running"
    echo    3. Rode este script novamente
    echo.
    echo  Nao tem Docker? Baixe em: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)
echo  [OK] Docker Desktop detectado.

:: ── Verifica se ja tem .env.local ───────────────────────────────────────────
if exist .env.local (
    echo.
    echo  [INFO] Configuracao encontrada ^(.env.local^). Ja foi configurado antes.
    echo.
    echo  Deseja ir direto para a inicializacao? [S/N]
    echo  ^(N = reconfigurar do zero^)
    set /p SKIP="  > "
    if /i "!SKIP!"=="S" goto :LAUNCH
    echo.
)

:: ── Passo 2: SESSION_SECRET ──────────────────────────────────────────────────
echo  [2/4] Gerando chave de seguranca...
for /f %%i in ('node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"') do set SECRET=%%i
if "!SECRET!"=="" (
    echo.
    echo  [ERRO] Node.js nao encontrado.
    echo  Instale em: https://nodejs.org ^(LTS recomendado^)
    pause
    exit /b 1
)
echo  [OK] Chave de seguranca gerada.

:: ── Passo 3: Token ngrok ─────────────────────────────────────────────────────
echo.
echo  [3/4] Configurando ngrok ^(link publico para jogadores^)
echo.
echo  O ngrok cria um endereco HTTPS que os jogadores abrem no browser.
echo  E gratuito e nao precisa de cartao de credito.
echo.
echo  Para obter seu token:
echo    1. Acesse: https://ngrok.com/signup
echo    2. Crie a conta gratuita
echo    3. Va em Dashboard ^> Your Authtoken
echo    4. Copie o token ^(parece: 2aBc123XYZ_...)
echo.
set /p NGROK_TOKEN="  Cole o token aqui: "
if "!NGROK_TOKEN!"=="" (
    echo.
    echo  [ERRO] Token obrigatorio para gerar o link dos jogadores.
    pause
    exit /b 1
)

:: ── Passo 4: Criar .env.local ────────────────────────────────────────────────
echo.
echo  [4/4] Criando arquivo de configuracao...
(
    echo NGROK_AUTHTOKEN=!NGROK_TOKEN!
    echo SESSION_SECRET=!SECRET!
    echo DB_PASSWORD=mxdrpg_local
    echo DB_ROOT_PASSWORD=mxdrpg_root
    echo AUTH_URL=http://localhost:3000
    echo GOOGLE_CLIENT_ID=
    echo GOOGLE_CLIENT_SECRET=
    echo DISCORD_CLIENT_ID=
    echo DISCORD_CLIENT_SECRET=
) > .env.local
echo  [OK] .env.local criado.

:LAUNCH
echo.
echo  ════════════════════════════════════════════════════════════════
echo.
echo  Tudo pronto! Deseja iniciar a mesa agora? [S/N]
echo.
set /p LAUNCH_NOW="  > "
if /i "!LAUNCH_NOW!" neq "S" (
    echo.
    echo  Para iniciar depois, rode:
    echo    docker compose -f docker-compose.local.yml up --build
    echo.
    echo  Na primeira vez demora ~5 minutos.
    echo  Nas proximas: ~30 segundos.
    echo.
    pause
    exit /b 0
)

:: ── Inicia servidor em janela separada ───────────────────────────────────────
echo.
echo  Abrindo o servidor em uma nova janela...
echo  Aguarde a mensagem: "Ready on http://0.0.0.0:3000"
echo.

if exist .env.local.first_run (
    start "MXDRPG — Servidor" cmd /k "echo Subindo servidor... && docker compose -f docker-compose.local.yml up"
) else (
    echo. > .env.local.first_run
    start "MXDRPG — Servidor" cmd /k "echo Primeira execucao — build completo, aguarde ~5 min && docker compose -f docker-compose.local.yml up --build"
)

:: ── Aguarda ngrok ficar disponivel ───────────────────────────────────────────
echo  Aguardando servidores inicializarem...
echo  ^(isso pode levar alguns minutos na primeira vez^)
echo.

set NGROK_URL=
set ATTEMPTS=0
:POLL_LOOP
timeout /t 5 /nobreak > nul
set /a ATTEMPTS+=1

for /f "delims=" %%u in ('powershell -NoProfile -Command "(Invoke-RestMethod http://localhost:4040/api/tunnels -ErrorAction SilentlyContinue).tunnels | Where-Object {$_.proto -eq 'https'} | Select-Object -First 1 -ExpandProperty public_url" 2^>nul') do set NGROK_URL=%%u

if "!NGROK_URL!"=="" (
    if !ATTEMPTS! lss 36 (
        set /a ELAPSED=!ATTEMPTS! * 5
        echo  Aguardando... ^(!ELAPSED!s^)
        goto :POLL_LOOP
    )
    echo.
    echo  [AVISO] Timeout esperando o ngrok. Verifique:
    echo    - Se o token no .env.local esta correto
    echo    - O painel em: http://localhost:4040
    echo.
    pause
    exit /b 0
)

:: ── Exibe link dos jogadores ─────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    MESA PRONTA!                             ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                              ║
echo  ║  Link dos jogadores ^(copie e mande no grupo^):              ║
echo  ║                                                              ║
echo  ║   !NGROK_URL!
echo  ║                                                              ║
echo  ║  Seu acesso ^(mestre, local^): http://localhost:3000         ║
echo  ║  Painel ngrok:              http://localhost:4040           ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Abre o browser para o mestre
start "" "http://localhost:3000"
echo  Abrindo a mesa no browser...
echo.
echo  Para encerrar: feche a janela "MXDRPG — Servidor" ou pressione Ctrl+C nela.
echo  Os dados sao salvos automaticamente a cada 60 segundos.
echo.
pause
