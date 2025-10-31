# 🚀 GUIA DE INSTALAÇÃO RÁPIDA - WEBCAM

## ⚡ Setup Rápido (5 minutos)

### 1. Instalar Python (se não tiver)

- Download: https://www.python.org/downloads/
- ✅ Marcar "Add Python to PATH" durante instalação

### 2. Instalar dependências

```bash
cd recognition-services
pip install -r requirements.txt
```

**⏱️ Isso pode demorar uns 5-10 minutos** (face_recognition é pesado)

### 3. Configurar

```bash
copy .env.example .env
```

Edite `.env` e configure:

```env
API_BASE=http://localhost:3001
WEBCAM_INDEX=0
CLASSROOM_CODE=3AT.I
SHOW_VIDEO=true
```

### 4. Executar

**Opção 1 - Script pronto (Windows):**

```bash
start-webcam.bat
```

**Opção 2 - Comando direto:**

```bash
python reco_webcam_service.py
```

## ✅ Pré-requisitos

Antes de rodar o reconhecimento facial:

1. ✅ **Backend rodando**

   ```bash
   cd backend
   npm run dev
   ```

2. ✅ **Frontend rodando** (opcional, para cadastrar alunos)

   ```bash
   npm run dev
   ```

3. ✅ **Alunos cadastrados com fotos**
   - Entre no sistema como admin
   - Cadastre alunos em "Administração"
   - Certifique-se que as fotos são boas (rosto frontal, boa iluminação)

## 🎯 Fluxo completo

```
1. Abrir terminal → cd backend → npm run dev
2. Abrir novo terminal → cd recognition-services
3. python reco_webcam_service.py
4. Olhar para a webcam
5. Sistema detecta e registra presença automaticamente
```

## 🐛 Problemas comuns

### "ModuleNotFoundError: No module named 'cv2'"

```bash
pip install opencv-python
```

### "face_recognition não instala"

**Windows:** Instale Visual C++ Build Tools

- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Instale "Desktop development with C++"
- Depois: `pip install face_recognition`

**Alternativa:** Use dlib pré-compilado

```bash
pip install dlib-binary
pip install face_recognition
```

### "Webcam não abre"

1. Feche Chrome, Zoom, Teams (podem estar usando a câmera)
2. Tente mudar `WEBCAM_INDEX=1` no `.env`
3. Teste a câmera em outro app antes

### "Backend não responde"

```bash
cd backend
npm install
npm run dev
```

Verifique se está rodando em `http://localhost:3001`

## 📊 Testando

**Ver se backend está ok:**

```
Abra navegador: http://localhost:3001/api/known-faces
```

Deve retornar JSON com lista de alunos.

**Ver se webcam funciona:**

```python
import cv2
cap = cv2.VideoCapture(0)
print("Webcam OK" if cap.isOpened() else "Erro")
cap.release()
```

## 🎓 Dicas para melhor reconhecimento

1. **Iluminação:** Ambiente bem iluminado
2. **Posição:** Rostos frontais, olhando para câmera
3. **Distância:** 50cm a 1m da câmera
4. **Fotos cadastradas:** Devem ser similares às condições de uso
5. **Óculos/máscara:** Evitar na foto E no uso (ou usar em ambos)

## 📝 Comandos úteis

**Instalar tudo de uma vez:**

```bash
pip install opencv-python face_recognition pillow requests python-dotenv numpy
```

**Atualizar dependências:**

```bash
pip install --upgrade -r requirements.txt
```

**Ver versões instaladas:**

```bash
pip list
```

**Desinstalar (se precisar):**

```bash
pip uninstall opencv-python face_recognition pillow requests python-dotenv numpy
```

## 🔥 Se nada funcionar

**Reset completo:**

```bash
# 1. Desinstalar tudo
pip uninstall -y opencv-python face_recognition pillow requests python-dotenv numpy dlib

# 2. Reinstalar um por um
pip install numpy
pip install opencv-python
pip install pillow
pip install requests
pip install python-dotenv
pip install face_recognition

# 3. Testar
python reco_webcam_service.py
```

## 📞 Suporte

- **Erro na API:** Verifique backend
- **Erro na webcam:** Verifique hardware/drivers
- **Erro no Python:** Reinstale dependências
- **Reconhecimento ruim:** Ajuste MATCH_TOLERANCE no .env
