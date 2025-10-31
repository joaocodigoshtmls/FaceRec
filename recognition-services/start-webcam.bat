@echo off
echo ========================================
echo  RECONHECIMENTO FACIAL - WEBCAM
echo ========================================
echo.

REM Verificar se está na pasta correta
if not exist "reco_webcam_service.py" (
    echo ERRO: Execute este script na pasta recognition-services
    pause
    exit /b 1
)

REM Verificar se o .env existe
if not exist ".env" (
    echo AVISO: Arquivo .env nao encontrado!
    echo Copiando .env.example para .env...
    copy .env.example .env
    echo.
    echo Por favor, edite o arquivo .env com suas configuracoes
    echo e execute este script novamente.
    pause
    exit /b 1
)

echo Iniciando servico de reconhecimento...
echo.
echo Pressione Ctrl+C para parar
echo Ou pressione 'q' na janela de video
echo.

python reco_webcam_service.py

pause
