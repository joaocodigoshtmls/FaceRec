# reco_webcam_service.py
# Serviço de reconhecimento facial usando WEBCAM do PC
import os, io, time, logging
import requests
import face_recognition
import numpy as np
import cv2
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# Configurações da API
API_BASE = os.getenv("API_BASE", "http://localhost:3001").rstrip("/")
API_KEY  = os.getenv("API_KEY", "")
KNOWN_FACES_ENDPOINT = os.getenv("KNOWN_FACES_ENDPOINT", "/api/known-faces")

# Configurações da webcam
WEBCAM_INDEX = int(os.getenv("WEBCAM_INDEX", "0"))  # 0 = webcam padrão, 1 = segunda câmera, etc.
FRAME_SAMPLER_FPS = float(os.getenv("FRAME_SAMPLER_FPS", "2"))  # processar 2 frames por segundo

# Configurações de reconhecimento
MATCH_TOLERANCE = float(os.getenv("MATCH_TOLERANCE", "0.5"))  # menor = mais exigente
DEDUP_MIN_SECONDS = int(os.getenv("DEDUP_MIN_SECONDS", "60"))  # 60s entre detecções do mesmo usuário
CLASSROOM_CODE = os.getenv("CLASSROOM_CODE", "3AT.I")

# Configurações de display
SHOW_VIDEO = os.getenv("SHOW_VIDEO", "true").lower() == "true"  # Mostrar janela com vídeo
DRAW_BOXES = os.getenv("DRAW_BOXES", "true").lower() == "true"  # Desenhar caixas nos rostos

logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s [%(levelname)s] %(message)s"
)

session = requests.Session()
session.headers.update({"User-Agent": "reco-webcam/1.0"})

def fetch_known_faces():
    """Busca rostos conhecidos da API"""
    url = API_BASE + KNOWN_FACES_ENDPOINT
    logging.info(f"📥 Buscando rostos conhecidos de: {url}")
    r = session.get(url, timeout=20)
    r.raise_for_status()
    faces = r.json().get("faces", [])
    logging.info(f"✅ {len(faces)} rostos encontrados na base de dados")
    return faces

def build_known_set():
    """Constrói conjunto de rostos conhecidos com seus encodings"""
    faces = fetch_known_faces()
    names, ids, encs = [], [], []
    
    logging.info("🔄 Gerando encodings faciais...")
    for f in faces:
        try:
            # Download da foto do usuário
            img = session.get(f["photo_url"], timeout=20).content
            pil = Image.open(io.BytesIO(img)).convert("RGB")
            image = np.array(pil)
            
            # Detectar rosto na imagem
            locs = face_recognition.face_locations(image, model="hog")
            if not locs:
                logging.warning(f"⚠️ Nenhum rosto detectado em: {f['name']}")
                continue
            
            # Gerar encoding facial
            e = face_recognition.face_encodings(image, known_face_locations=locs)
            if not e: 
                continue
            
            encs.append(e[0])
            names.append(f["name"])
            ids.append(f["user_id"])
            logging.info(f"✅ Encoding gerado: {f['name']}")
            
        except Exception as e:
            logging.warning(f"⚠️ Erro ao processar {f.get('name')}: {e}")
    
    enc_matrix = np.vstack(encs) if encs else np.zeros((0, 128), dtype=np.float64)
    logging.info(f"🎉 Total de encodings prontos: {len(encs)}")
    
    return {
        "names": names, 
        "ids": ids, 
        "enc": enc_matrix
    }

def post_detection(user_id, name, confidence):
    """Envia detecção para a API"""
    headers = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
    payload = {
        "user_id": int(user_id), 
        "confidence": float(confidence), 
        "classroom_code": CLASSROOM_CODE
    }
    
    try:
        # 1) Registra presença com debounce
        r1 = session.post(
            API_BASE + "/api/attendance", 
            headers=headers, 
            json=payload, 
            timeout=10
        )
        
        # 2) Consolida e emite evento realtime
        r2 = session.post(
            API_BASE + "/api/_internal/consolidate", 
            json=payload, 
            timeout=10
        )
        
        if r1.status_code == 200:
            logging.info(f"✅ Presença registrada: {name} (conf: {confidence:.2%})")
        else:
            logging.error(f"❌ Erro ao registrar presença: {r1.status_code}")
            
    except Exception as e:
        logging.error(f"❌ Erro ao enviar detecção: {e}")

def draw_detection(frame, top, right, bottom, left, name, confidence, color):
    """Desenha caixa e texto no frame"""
    # Desenhar retângulo
    cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
    
    # Desenhar fundo do texto
    cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
    
    # Desenhar texto
    font = cv2.FONT_HERSHEY_DUPLEX
    text = f"{name} ({confidence:.0%})"
    cv2.putText(frame, text, (left + 6, bottom - 6), font, 0.6, (255, 255, 255), 1)

def main():
    """Loop principal de reconhecimento"""
    logging.info("=" * 60)
    logging.info("🚀 SERVIÇO DE RECONHECIMENTO FACIAL - WEBCAM")
    logging.info("=" * 60)
    
    # Carregar rostos conhecidos
    known = build_known_set()
    
    if known["enc"].shape[0] == 0:
        logging.error("❌ Nenhum rosto conhecido carregado! Encerrando...")
        return
    
    # Abrir webcam
    logging.info(f"📹 Abrindo webcam (índice: {WEBCAM_INDEX})...")
    cap = cv2.VideoCapture(WEBCAM_INDEX)
    
    if not cap.isOpened():
        logging.error(f"❌ Não foi possível abrir a webcam {WEBCAM_INDEX}")
        logging.info("💡 Dica: Tente mudar WEBCAM_INDEX=0 ou 1 no .env")
        return
    
    # Configurar resolução (opcional)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    # Controle de taxa de amostragem
    period = 1.0 / FRAME_SAMPLER_FPS
    last_process_time = 0.0
    
    # Controle de debounce por usuário
    last_seen = {}
    
    logging.info("=" * 60)
    logging.info(f"✅ Webcam aberta! Processando {FRAME_SAMPLER_FPS} frames/segundo")
    logging.info(f"📊 Tolerância de match: {MATCH_TOLERANCE}")
    logging.info(f"⏱️ Debounce: {DEDUP_MIN_SECONDS}s entre detecções")
    logging.info(f"🏫 Sala: {CLASSROOM_CODE}")
    logging.info("=" * 60)
    logging.info("👁️ Olhando para a câmera...")
    logging.info("❌ Pressione 'q' ou Ctrl+C para sair")
    logging.info("=" * 60)
    
    try:
        while True:
            # Capturar frame
            ok, frame = cap.read()
            if not ok:
                logging.warning("⚠️ Falha ao capturar frame")
                time.sleep(0.1)
                continue
            
            now = time.time()
            
            # Controle de taxa de processamento
            if (now - last_process_time) < period:
                if SHOW_VIDEO:
                    cv2.imshow('Reconhecimento Facial - Webcam', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                continue
            
            last_process_time = now
            
            # Converter BGR (OpenCV) para RGB (face_recognition)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Redimensionar para processar mais rápido (opcional)
            small_frame = cv2.resize(rgb, (0, 0), fx=0.5, fy=0.5)
            
            # Detectar rostos
            locs = face_recognition.face_locations(small_frame, model="hog")
            encs = face_recognition.face_encodings(small_frame, known_face_locations=locs)
            
            # Processar cada rosto detectado
            for (top, right, bottom, left), enc in zip(locs, encs):
                # Reescalar coordenadas para frame original
                top *= 2
                right *= 2
                bottom *= 2
                left *= 2
                
                # Comparar com rostos conhecidos
                distances = face_recognition.face_distance(known["enc"], enc)
                idx = int(np.argmin(distances))
                dist = float(distances[idx])
                
                if dist <= MATCH_TOLERANCE:
                    # Rosto reconhecido!
                    uid = known["ids"][idx]
                    name = known["names"][idx]
                    confidence = max(0.0, 1.0 - dist)
                    
                    # Verificar debounce
                    if (now - last_seen.get(uid, 0)) >= DEDUP_MIN_SECONDS:
                        post_detection(uid, name, confidence)
                        last_seen[uid] = now
                    
                    # Desenhar caixa verde (reconhecido)
                    if SHOW_VIDEO and DRAW_BOXES:
                        draw_detection(frame, top, right, bottom, left, name, confidence, (0, 255, 0))
                else:
                    # Rosto desconhecido
                    if SHOW_VIDEO and DRAW_BOXES:
                        draw_detection(frame, top, right, bottom, left, "Desconhecido", 0.0, (0, 0, 255))
            
            # Mostrar frame com detecções
            if SHOW_VIDEO:
                # Adicionar informações no topo
                info_text = f"Rostos conhecidos: {len(known['ids'])} | FPS: {FRAME_SAMPLER_FPS} | Sala: {CLASSROOM_CODE}"
                cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                cv2.imshow('Reconhecimento Facial - Webcam', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
    
    except KeyboardInterrupt:
        logging.info("\n🛑 Interrompido pelo usuário")
    
    finally:
        # Limpar recursos
        logging.info("🔒 Fechando webcam...")
        cap.release()
        if SHOW_VIDEO:
            cv2.destroyAllWindows()
        logging.info("✅ Serviço encerrado com sucesso")

if __name__ == "__main__":
    main()
