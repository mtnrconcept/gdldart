"""FastAPI server exposing dart detection predictions."""
import base64
import logging
import os
import re
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from yacs.config import CfgNode as CN

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from train import build_model  # noqa: E402
from predict import bboxes_to_xy  # noqa: E402
from dataset.annotate import get_dart_scores  # noqa: E402


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CFG_NAME = os.getenv("DEEP_DARTS_CONFIG", "deepdarts_d1")
MAX_DARTS = int(os.getenv("DEEP_DARTS_MAX_DARTS", "3"))
DATA_URI_PATTERN = re.compile(r"^data:image/[^;]+;base64,(?P<data>.+)$", re.IGNORECASE)
LOGGER = logging.getLogger("deepdarts.serve")


class DetectRequest(BaseModel):
    image: str


class DetectionResult(BaseModel):
    x: float
    y: float
    score: Optional[float]
    baseScore: Optional[float]
    multiplier: Optional[str]
    ring: Optional[str]
    sector: Optional[str]
    confidence: Optional[float]
    normalized: bool = True


class DetectionResponse(BaseModel):
    detections: List[DetectionResult]


class _ModelBundle:
    def __init__(self) -> None:
        self.model = None
        self.cfg: Optional[CN] = None
        self.lock = threading.Lock()

    def load(self) -> None:
        with self.lock:
            if self.model is not None and self.cfg is not None:
                return

            cfg_path_env = os.getenv("DEEP_DARTS_CONFIG_PATH")
            if cfg_path_env:
                cfg_path = _resolve_path(Path(cfg_path_env))
            else:
                cfg_path = (BASE_DIR / "configs" / f"{DEFAULT_CFG_NAME}.yaml").resolve()
            if not cfg_path.exists():
                raise FileNotFoundError(
                    f"Configuration introuvable: {cfg_path}. "
                    "Utilisez DEEP_DARTS_CONFIG_PATH pour spécifier le chemin correct."
                )

            cfg = CN(new_allowed=True)
            cfg.merge_from_file(str(cfg_path))
            model_name = os.getenv("DEEP_DARTS_MODEL_NAME") or DEFAULT_CFG_NAME
            cfg.model.name = model_name

            weights_env = os.getenv("DEEP_DARTS_WEIGHTS")
            if weights_env:
                weights_path = _resolve_path(Path(weights_env))
            else:
                weights_path = (BASE_DIR / "models" / model_name / "weights").resolve()
                if not weights_path.exists() and getattr(cfg.model, "weights_path", ""):
                    weights_path = _resolve_path(Path(cfg.model.weights_path))
            if not weights_path.exists():
                raise FileNotFoundError(
                    f"Poids introuvables pour le modèle: {weights_path}. "
                    "Téléchargez les poids DeepDarts et définissez DEEP_DARTS_WEIGHTS si nécessaire."
                )

            yolo = build_model(cfg)
            yolo.load_weights(str(weights_path), cfg.model.weights_type)

            self.model = yolo
            self.cfg = cfg

    def predict(self, image: np.ndarray) -> List[DetectionResult]:
        if self.model is None or self.cfg is None:
            self.load()
        assert self.model is not None
        assert self.cfg is not None

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        raw_bboxes = self.model.predict(rgb_image)
        bboxes = _ensure_2d_array(raw_bboxes)
        xy = bboxes_to_xy(bboxes, max_darts=MAX_DARTS)

        dart_rows = bboxes[bboxes[:, 4] == 0][:MAX_DARTS] if bboxes.size else np.zeros((0, 5))
        confidences = _extract_confidences(dart_rows)

        labels = get_dart_scores(xy.copy(), self.cfg, numeric=False)
        numeric_scores = get_dart_scores(xy.copy(), self.cfg, numeric=True)

        detections: List[DetectionResult] = []
        for idx in range(MAX_DARTS):
            x, y, visibility = xy[4 + idx]
            if visibility <= 0:
                continue

            label = labels[idx] if idx < len(labels) else None
            numeric_score = numeric_scores[idx] if idx < len(numeric_scores) else None
            parsed = _parse_score_label(label, numeric_score)
            confidence = confidences[idx] if idx < len(confidences) else None

            detections.append(
                DetectionResult(
                    x=float(x),
                    y=float(y),
                    score=parsed["score"],
                    baseScore=parsed["base_score"],
                    multiplier=parsed["multiplier"],
                    ring=parsed["ring"],
                    sector=parsed["sector"],
                    confidence=confidence,
                )
            )

        return detections


def _extract_confidences(dart_rows: np.ndarray) -> List[Optional[float]]:
    if dart_rows.size == 0:
        return []
    if dart_rows.shape[1] > 5:
        confidences = dart_rows[:, 5]
    else:
        return []
    return [float(max(0.0, min(1.0, float(c)))) for c in confidences]


def _resolve_path(path: Path) -> Path:
    if path.is_absolute():
        return path.resolve()
    cwd_candidate = (Path.cwd() / path).resolve()
    if cwd_candidate.exists():
        return cwd_candidate
    return (BASE_DIR / path).resolve()


def _ensure_2d_array(bboxes: Any) -> np.ndarray:
    if bboxes is None:
        return np.zeros((0, 6), dtype=np.float32)
    array = np.asarray(bboxes)
    if array.size == 0:
        return np.zeros((0, 6), dtype=np.float32)
    if array.ndim == 1:
        array = array.reshape((1, -1))
    if array.ndim != 2:
        raise ValueError(f"Format de sorties YOLO inattendu: {array.shape}")
    return array.astype(np.float32, copy=False)


def _parse_score_label(label: Optional[str], numeric_score: Optional[float]) -> Dict[str, Optional[Any]]:
    if not label:
        return {
            "score": numeric_score,
            "base_score": numeric_score,
            "multiplier": None,
            "ring": None,
            "sector": None,
        }

    label = label.upper()
    multiplier: Optional[str]
    base_score: Optional[float]
    score: Optional[float] = numeric_score if numeric_score is not None else None
    ring: Optional[str]

    if label == "0":
        multiplier = "miss"
        base_score = 0.0
        score = 0.0
        ring = "miss"
        sector = "Miss"
    elif label == "B":
        multiplier = "bull"
        base_score = 25.0
        score = score if score is not None else 25.0
        ring = "bull"
        sector = "Bull simple"
    elif label == "DB":
        multiplier = "bull-double"
        base_score = 25.0
        score = score if score is not None else 50.0
        ring = "bull-double"
        sector = "Bull double"
    elif label.startswith("D") and label[1:].isdigit():
        base_score = float(label[1:])
        multiplier = "double"
        score = score if score is not None else base_score * 2
        ring = "double"
        sector = f"Double {int(base_score)}"
    elif label.startswith("T") and label[1:].isdigit():
        base_score = float(label[1:])
        multiplier = "triple"
        score = score if score is not None else base_score * 3
        ring = "triple"
        sector = f"Triple {int(base_score)}"
    elif label.isdigit():
        base_score = float(label)
        multiplier = "simple"
        score = score if score is not None else base_score
        ring = "simple"
        sector = f"Simple {int(base_score)}"
    else:
        base_score = score
        multiplier = None
        ring = None
        sector = None

    return {
        "score": score,
        "base_score": base_score,
        "multiplier": multiplier,
        "ring": ring,
        "sector": sector,
    }


def _decode_image(data: str) -> np.ndarray:
    match = DATA_URI_PATTERN.match(data)
    if match:
        data = match.group("data")
    try:
        image_bytes = base64.b64decode(data)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail="Image base64 invalide") from exc

    np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Impossible de décoder l'image fournie")
    return image


bundle = _ModelBundle()
app = FastAPI(title="DeepDarts Detection API", version="1.0.0")


@app.on_event("startup")
def _load_on_startup() -> None:
    try:
        bundle.load()
    except FileNotFoundError as error:
        # Différer l'erreur à la première requête tout en journalisant l'information.
        LOGGER.warning("Initialisation différée du modèle: %s", error)


@app.post("/api/detect", response_model=DetectionResponse)
def detect_darts(payload: DetectRequest) -> DetectionResponse:
    if not payload.image:
        raise HTTPException(status_code=400, detail="Le champ 'image' est requis")
    image = _decode_image(payload.image)
    try:
        detections = bundle.predict(image)
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except Exception as error:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Erreur interne: {error}")

    return DetectionResponse(detections=detections)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("serve:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
