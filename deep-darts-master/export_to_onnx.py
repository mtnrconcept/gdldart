"""Utility to export DeepDarts TensorFlow models to ONNX."""
from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Optional

import tensorflow as tf
import tf2onnx
from yacs.config import CfgNode as CN

from train import build_model

LOGGER = logging.getLogger("deepdarts.export")


def _resolve_path(path: Path) -> Path:
    if path.is_absolute():
        return path
    base_dir = Path(__file__).resolve().parent
    candidate = (base_dir / path).resolve()
    return candidate


def _load_config(config: str, config_path: Optional[str]) -> tuple[CN, Path]:
    base_dir = Path(__file__).resolve().parent
    if config_path:
        cfg_path = Path(config_path)
    else:
        cfg_path = base_dir / "configs" / f"{config}.yaml"

    cfg_path = _resolve_path(cfg_path)
    if not cfg_path.exists():
        raise FileNotFoundError(f"Configuration introuvable: {cfg_path}")

    cfg = CN(new_allowed=True)
    cfg.merge_from_file(str(cfg_path))
    cfg.model.name = config
    return cfg, cfg_path


def _load_weights(yolo, cfg: CN, weights_path: Optional[str], weights_type: Optional[str]) -> Path:
    if weights_path:
        raw_path = Path(weights_path)
    else:
        raw_path = Path(getattr(cfg.model, "weights_path", ""))
        if not raw_path:
            raise ValueError("Aucun chemin de poids n'a été fourni via la configuration ou --weights.")

    path = _resolve_path(raw_path)
    if not path.exists():
        raise FileNotFoundError(f"Fichier de poids introuvable: {path}")

    weights_type = weights_type or getattr(cfg.model, "weights_type", None)
    if weights_type is None and not path.suffix:
        raise ValueError("Impossible de déduire le type de poids, utilisez --weights-type.")

    if path.suffix == ".h5":
        LOGGER.info("Chargement des poids Keras depuis %s", path)
        yolo.model.load_weights(str(path), by_name=True, skip_mismatch=True)
    else:
        LOGGER.info("Chargement des poids YOLO (%s) depuis %s", weights_type, path)
        yolo.load_weights(str(path), weights_type)

    return path


def export_to_onnx(
    config: str,
    output: Path,
    config_path: Optional[str] = None,
    weights: Optional[str] = None,
    weights_type: Optional[str] = None,
    opset: int = 13,
    dynamic_batch: bool = False,
) -> Path:
    cfg, cfg_path = _load_config(config, config_path)
    LOGGER.info("Configuration chargée: %s", cfg_path)

    yolo = build_model(cfg)
    weights_path = _load_weights(yolo, cfg, weights, weights_type)

    dummy = tf.zeros(
        [1, cfg.model.input_size, cfg.model.input_size, 3],
        dtype=tf.float32,
    )
    _ = yolo.model(dummy, training=False)

    if dynamic_batch:
        batch_dim = None
    else:
        batch_dim = 1

    input_signature = [
        tf.TensorSpec(
            shape=[batch_dim, cfg.model.input_size, cfg.model.input_size, 3],
            dtype=tf.float32,
            name="images",
        )
    ]

    output_path = output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    LOGGER.info("Export ONNX vers %s (opset=%s, dynamic_batch=%s)", output_path, opset, dynamic_batch)

    model_proto, _ = tf2onnx.convert.from_keras(
        yolo.model,
        input_signature=input_signature,
        opset=opset,
        output_path=str(output_path),
    )

    LOGGER.info("Modèle ONNX exporté: %s (%d noeuds)", output_path, len(model_proto.graph.node))
    LOGGER.info("Poids utilisés: %s", weights_path)
    return output_path


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Exporter un modèle DeepDarts vers ONNX")
    parser.add_argument("--config", "-c", default="deepdarts_d1", help="Nom de la configuration à charger (sans .yaml)")
    parser.add_argument("--config-path", help="Chemin explicite vers le fichier de configuration")
    parser.add_argument("--weights", help="Chemin vers les poids du modèle à exporter")
    parser.add_argument("--weights-type", help="Type des poids (tf, darknet, etc.)")
    parser.add_argument("--opset", type=int, default=13, help="Version opset ONNX à utiliser")
    parser.add_argument("--dynamic-batch", action="store_true", help="Autoriser une taille de batch dynamique")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("exports") / "deepdarts.onnx",
        help="Fichier de sortie ONNX",
    )
    parser.add_argument("--verbose", action="store_true", help="Activer les logs détaillés")
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)
    export_to_onnx(
        config=args.config,
        output=args.output,
        config_path=args.config_path,
        weights=args.weights,
        weights_type=args.weights_type,
        opset=args.opset,
        dynamic_batch=args.dynamic_batch,
    )


if __name__ == "__main__":
    main()
