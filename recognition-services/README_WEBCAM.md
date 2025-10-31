# 📹 Serviço de Reconhecimento Facial - WEBCAM

Serviço Python para reconhecimento facial em tempo real usando a **webcam do PC**.

## 🚀 Como usar

### 1. Instalar dependências

```bash
cd recognition-services
pip install -r requirements.txt
```

Se não tiver `requirements.txt`, instale manualmente:

```bash
pip install opencv-python face_recognition pillow requests python-dotenv numpy
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

Edite o arquivo `.env` e configure:

```env
API_BASE=http://localhost:3001
WEBCAM_INDEX=0
CLASSROOM_CODE=3AT.I
```

### 3. Executar o serviço

```bash
python reco_webcam_service.py
```

## ⚙️ Configurações importantes

### `WEBCAM_INDEX`

- `0` = Webcam padrão (integrada do notebook)
- `1` = Segunda câmera (USB externa)
- Se não funcionar, tente mudar o valor

### `FRAME_SAMPLER_FPS`

- `1` = Processa 1 frame por segundo (menos CPU)
- `2` = Processa 2 frames por segundo (**recomendado**)
- `5` = Processa 5 frames por segundo (mais rápido, usa mais CPU)

### `MATCH_TOLERANCE`

- `0.4` = Muito exigente (menos erros, mas pode não reconhecer)
- `0.5` = **Recomendado** (balanceado)
- `0.6` = Mais permissivo (detecta mais fácil, mas pode ter falsos positivos)

### `SHOW_VIDEO`

- `true` = Mostra janela com vídeo da webcam (**recomendado para testes**)
- `false` = Roda em background sem interface (para produção)

## 📊 Como funciona

1. **Carrega rostos conhecidos** da API (`/api/known-faces`)
2. **Abre a webcam** do PC
3. **Processa frames** a cada X segundos (configurável)
4. **Detecta rostos** usando face_recognition (HOG)
5. **Compara** com rostos conhecidos
6. **Envia presença** para API quando reconhece alguém
7. **Debounce** de 60s (não envia duplicatas do mesmo aluno)

## 🎯 Requisitos

- Python 3.8+
- Webcam funcionando
- Backend rodando em `http://localhost:3001`
- Alunos cadastrados com fotos no sistema

## 🐛 Troubleshooting

### Erro: "Não foi possível abrir a webcam"

- Verifique se a webcam está conectada
- Tente mudar `WEBCAM_INDEX=0` para `1` ou `2`
- Feche outros programas que usam a webcam (Zoom, Teams, etc.)

### Erro: "Nenhum rosto conhecido carregado"

- Verifique se o backend está rodando
- Verifique se há alunos cadastrados com fotos
- Confirme a URL da API no `.env`

### Reconhecimento não funciona

- Aumente `MATCH_TOLERANCE` (experimente 0.6)
- Melhore a iluminação
- Certifique-se que as fotos cadastradas são boas (rostos frontais, boa qualidade)

## 🔑 Comandos úteis

**Parar o serviço:**

- Pressione `Ctrl+C` no terminal
- Ou pressione `q` na janela de vídeo

**Ver logs em tempo real:**
Os logs aparecem no terminal automaticamente.

## 📦 Diferenças entre os serviços

| Serviço                  | Fonte              | Quando usar                              |
| ------------------------ | ------------------ | ---------------------------------------- |
| `reco_webcam_service.py` | **Webcam do PC**   | ✅ **Use este!** (ESP32 não está pronto) |
| `reco_stream_service.py` | Stream MJPEG ESP32 | Quando ESP32 estiver pronto              |
| `reco_service.py`        | Snapshots HTTP     | Debug/testes                             |

## ✅ Checklist antes de usar

- [ ] Backend rodando (`npm run dev` na pasta `backend`)
- [ ] Alunos cadastrados com fotos
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas (`pip install ...`)
- [ ] Webcam funcionando
- [ ] Nenhum outro programa usando a webcam

## 🎥 Interface visual

Se `SHOW_VIDEO=true`, você verá:

- 🟢 **Caixa verde** = Aluno reconhecido (nome + confiança)
- 🔴 **Caixa vermelha** = Rosto desconhecido
- 📊 **Informações no topo** = Rostos conhecidos, FPS, sala

Pressione **`q`** para sair.
