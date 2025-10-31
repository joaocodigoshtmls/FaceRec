@echo off
echo ========================================
echo  INSTALACAO RAPIDA - Sem compilacao
echo ========================================
echo.

REM Verificar ambiente virtual
if not exist "venv\Scripts\activate.bat" (
    echo ERRO: Ambiente virtual nao encontrado!
    echo Execute primeiro: setup-python311.bat
    pause
    exit /b 1
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat
echo.

echo [1/4] Atualizando pip e ferramentas...
python -m pip install --upgrade pip setuptools wheel --quiet
echo OK!
echo.

echo [2/4] Instalando dependencias basicas...
pip install numpy opencv-python pillow requests python-dotenv
echo OK!
echo.

echo [3/4] Instalando dlib pre-compilado...
echo (Isso evita a necessidade de CMake e compilacao)
pip install dlib-binary
echo OK!
echo.

echo [4/4] Instalando face_recognition...
pip install face_recognition
echo OK!
echo.

echo ========================================
echo  INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Testando instalacao...
python -c "import face_recognition; print('✓ face_recognition OK')"
python -c "import cv2; print('✓ OpenCV OK')"
python -c "import PIL; print('✓ Pillow OK')"
echo.
echo Agora voce pode executar:
echo   python reco_webcam_service.py
echo.
pause
