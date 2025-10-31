@echo off
echo ========================================
echo  SETUP - Python 3.11 + Ambiente Virtual
echo ========================================
echo.

REM Verificar se está na pasta recognition-services
if not exist "requirements.txt" (
    echo ERRO: Execute este script na pasta recognition-services
    pause
    exit /b 1
)

echo [1/5] Verificando Python 3.11...
py -3.11 --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python 3.11 nao encontrado!
    echo.
    echo Instale Python 3.11 de: https://www.python.org/downloads/
    echo Ou use: py --list para ver versoes instaladas
    pause
    exit /b 1
)

py -3.11 --version
echo.

echo [2/5] Criando ambiente virtual...
if exist "venv" (
    echo Ambiente virtual ja existe. Removendo...
    rmdir /s /q venv
)
py -3.11 -m venv venv
echo OK!
echo.

echo [3/5] Ativando ambiente virtual...
call venv\Scripts\activate.bat
echo OK!
echo.

echo [4/5] Atualizando pip...
python -m pip install --upgrade pip --quiet
echo OK!
echo.

echo [5/5] Instalando dependencias...
echo Isso pode demorar alguns minutos...
echo.
echo Instalando dependencias basicas...
pip install --upgrade pip setuptools wheel --quiet
pip install numpy opencv-python pillow requests python-dotenv --quiet
echo.
echo Instalando dlib pre-compilado (evita CMake)...
pip install dlib-binary
echo.
echo Instalando face_recognition...
pip install face_recognition
echo.
echo ========================================
echo  INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Para usar o servico:
echo   1. Ative o ambiente: venv\Scripts\activate
echo   2. Configure o .env
echo   3. Execute: python reco_webcam_service.py
echo.
echo Para desativar: deactivate
echo.
pause
