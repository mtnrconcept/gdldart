import os
import cv2
import numpy as np
import io
import base64
import json
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from starlette.responses import StreamingResponse
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Assurez-vous que les scripts sont dans le PYTHONPATH
# ou ajustez les imports si nécessaire.
# Pour cet exemple, nous supposons que les scripts sont importables.
try:
    from scripts.board_scoring import Dartboard
    from scripts.infer_and_score import (
        YOLOv8_Segmenter,
        get_arrow_tip_from_mask,
        draw_predictions,
    )
except ImportError as e:
    logger.error(f"Erreur d'importation: {e}. Assurez-vous que le dossier 'scripts' est dans votre PYTHONPATH.")
    logger.error("Vous pouvez lancer le serveur depuis la racine du projet avec: uvicorn server:app --reload")
    # Simuler les classes pour permettre au serveur de démarrer même si les imports échouent
    class YOLOv8_Segmenter: pass
    class Dartboard: pass
    def get_arrow_tip_from_mask(*args, **kwargs): pass
    def draw_predictions(*args, **kwargs): pass


app = FastAPI(
    title="Darts Arrow Counter API",
    description="API pour détecter les fléchettes et calculer les scores à partir d'une image.",
    version="1.0.0"
)

# --- Initialisation des modèles et de la calibration ---

# Poids du modèle YOLOv8 (à ajuster si nécessaire)
MODEL_WEIGHTS = "runs/segment/train/weights/best.pt"
# Fichier de calibration de la cible
CALIBRATION_FILE = "calibration/board_homography.npz"

segmenter = None
dartboard = None

@app.on_event("startup")
def load_model_and_calibration():
    """Charge le modèle et la calibration au démarrage de l'application."""
    global segmenter, dartboard
    
    if not os.path.exists(MODEL_WEIGHTS):
        logger.warning(f"Le fichier de poids du modèle '{MODEL_WEIGHTS}' n'a pas été trouvé. L'API ne fonctionnera pas correctement.")
    else:
        try:
            segmenter = YOLOv8_Segmenter(MODEL_WEIGHTS)
            logger.info("Modèle YOLOv8-seg chargé avec succès.")
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle YOLOv8: {e}")

    if not os.path.exists(CALIBRATION_FILE):
        logger.warning(f"Le fichier de calibration '{CALIBRATION_FILE}' n'a pas été trouvé. L'API ne fonctionnera pas sans calibration.")
    else:
        try:
            dartboard = Dartboard(calibration_file=CALIBRATION_FILE)
            logger.info("Fichier de calibration chargé avec succès.")
        except Exception as e:
            logger.error(f"Erreur lors du chargement de la calibration: {e}")

@app.post("/score", summary="Détecte les fléchettes, calcule le score et retourne le résultat avec l'image annotée")
async def score_image(file: UploadFile = File(...)):
    """
    Prend une image en entrée, détecte les fléchettes, estime la position de la pointe,
    et retourne une réponse multipart avec les données JSON du score et l'image annotée.
    """
    if not segmenter or not dartboard:
        raise HTTPException(status_code=503, detail="Le service n'est pas prêt. Modèle ou calibration manquant.")

    # Lire l'image envoyée
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Fichier image invalide.")

    # Inférence
    results = segmenter.predict(img_bgr)
    
    # Traitement des résultats
    total_score = 0
    arrows_data = []
    for r in results:
        if r.masks is not None:
            for i, mask_data in enumerate(r.masks.data):
                original_point = None
                mask = mask_data.cpu().numpy()
                tip_point = get_arrow_tip_from_mask(mask, dartboard.H_inv)
                if tip_point:
                    score, ring, sector = dartboard.get_score(tip_point)
                    total_score += score
                    # Re-projeter le point sur l'image originale pour le dessin
                    tip_on_warped = np.array([tip_point[0], tip_point[1], 1])
                    original_point_homogeneous = dartboard.H @ tip_on_warped
                    original_point = (original_point_homogeneous / original_point_homogeneous[2])[:2]

                    arrows_data.append({
                        "id": i + 1,
                        "score": score,
                        "ring": ring,
                        "sector": sector,
                        "tip_position_original": [int(original_point[0]), int(original_point[1])] if original_point is not None else None,
                    })
    
    # Dessiner les prédictions sur l'image
    annotated_img = draw_predictions(img_bgr.copy(), arrows_data)

    # Préparer la réponse JSON
    json_data = {
        "total_score": total_score,
        "arrows": arrows_data
    }
    json_bytes = json.dumps(json_data).encode('utf-8')

    # Encoder l'image annotée en JPEG
    _, img_encoded = cv2.imencode('.jpg', annotated_img)
    img_base64 = base64.b64encode(img_encoded.tobytes()).decode('utf-8')

    # Créer une réponse multipart
    response_content = b'--frame\r\nContent-Type: application/json\r\n\r\n' + json_bytes + b'\r\n--frame\r\nContent-Type: text/plain\r\n\r\n' + img_base64.encode('utf-8') + b'\r\n--frame--\r\n'
    return Response(content=response_content, media_type='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    # Pour lancer le serveur: uvicorn server:app --reload --host 0.0.0.0 --port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)