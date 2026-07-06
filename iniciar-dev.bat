@echo off
cd /d "%~dp0"
echo Iniciando Scaleit App en modo desarrollo...
where node >nul 2>nul || (
  echo Node.js no esta instalado o no esta en PATH.
  pause
  exit /b 1
)
where npm.cmd >nul 2>nul || (
  echo npm no esta disponible en PATH.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias...
  npm.cmd install || (
    echo No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)
npm.cmd run dev -- --host 127.0.0.1
pause
