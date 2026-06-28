@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║       MXDRPG — Setup hospedagem local           ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ── Verifica Docker Desktop ─────────────────────────────────────
docker info > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker Desktop nao encontrado ou nao esta rodando.
    echo        Instale em: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo [OK] Docker Desktop detectado.

:: ── Gera SESSION_SECRET ─────────────────────────────────────────
for /f %%i in ('node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"') do set SECRET=%%i
if "%SECRET%"=="" (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)
echo [OK] SESSION_SECRET gerado.

:: ── Pergunta NGROK_AUTHTOKEN ────────────────────────────────────
echo.
echo Crie uma conta gratuita em https://ngrok.com
echo Copie seu authtoken em: Dashboard ^> Your Authtoken
echo.
set /p NGROK_TOKEN="Cole seu NGROK_AUTHTOKEN aqui: "
if "%NGROK_TOKEN%"=="" (
    echo [ERRO] NGROK_AUTHTOKEN e obrigatorio.
    pause
    exit /b 1
)

:: ── Gera .env.local ─────────────────────────────────────────────
(
    echo NGROK_AUTHTOKEN=%NGROK_TOKEN%
    echo SESSION_SECRET=%SECRET%
    echo DB_PASSWORD=mxdrpg_local
    echo DB_ROOT_PASSWORD=mxdrpg_root
    echo AUTH_URL=http://localhost:3000
    echo GOOGLE_CLIENT_ID=
    echo GOOGLE_CLIENT_SECRET=
    echo DISCORD_CLIENT_ID=
    echo DISCORD_CLIENT_SECRET=
) > .env.local

echo.
echo [OK] .env.local criado com sucesso.
echo.
echo ════════════════════════════════════════════════════
echo  Proximo passo: inicie a mesa com o comando abaixo
echo.
echo    docker compose -f docker-compose.local.yml up --build
echo.
echo  Depois abra http://localhost:4040 para ver o link
echo  publico gerado pelo ngrok e compartilhe com os jogadores.
echo ════════════════════════════════════════════════════
echo.
pause
