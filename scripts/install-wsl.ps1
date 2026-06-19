# Instala WSL2 + Ubuntu (requer PowerShell como Administrador).
# Clique direito no arquivo → "Executar com PowerShell" como admin,
# ou: Start-Process powershell -Verb RunAs -ArgumentList '-File', 'D:\Cursor\RPG\scripts\install-wsl.ps1'

$ErrorActionPreference = 'Stop'

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Write-Host "Este script precisa rodar como Administrador." -ForegroundColor Red
  Write-Host "Abra PowerShell como admin e execute:" -ForegroundColor Yellow
  Write-Host '  Set-ExecutionPolicy -Scope Process Bypass -Force; & "' + $PSCommandPath + '"' -ForegroundColor Cyan
  exit 1
}

Write-Host "=== Instalando WSL2 + Ubuntu ===" -ForegroundColor Green

# Recursos do Windows (WSL + plataforma de VM)
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "Baixando kernel WSL2..." -ForegroundColor Cyan
wsl --update

Write-Host "Definindo WSL2 como padrao..." -ForegroundColor Cyan
wsl --set-default-version 2

Write-Host "Instalando Ubuntu..." -ForegroundColor Cyan
wsl --install -d Ubuntu --no-launch

Write-Host ""
Write-Host "WSL instalado. REINICIE o PC antes de continuar." -ForegroundColor Yellow
Write-Host ""
Write-Host "Apos reiniciar, abra Ubuntu (menu Iniciar) e crie usuario/senha." -ForegroundColor White
Write-Host "Depois, no Ubuntu:" -ForegroundColor White
Write-Host '  curl -fsSL https://opencode.ai/install | bash' -ForegroundColor Cyan
Write-Host '  opencode --version' -ForegroundColor Cyan
