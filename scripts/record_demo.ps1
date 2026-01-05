# scripts/record_demo.ps1
# Script de ayuda para grabar la demo (Windows PowerShell)
# Requerimientos: ffmpeg instalado y en PATH, permisos para capturar pantalla.

param(
  [string]$OutputFile = "demo.mp4",
  [int]$Framerate = 25
)

Write-Host "Iniciando grabación de demo en $OutputFile (Ctrl+C para detener)"

# Comando de ejemplo con ffmpeg (captura de todo el escritorio)
Write-Host "Ejecutando: ffmpeg -f gdigrab -framerate $Framerate -i desktop -preset ultrafast $OutputFile"
ffmpeg -f gdigrab -framerate $Framerate -i desktop -preset ultrafast $OutputFile

Write-Host "Grabación finalizada: $OutputFile"

# Recomendación: abrir el navegador, loguearse con 'alice'/'password1', crear un post, dar like y mostrar perfil mientras se graba.
