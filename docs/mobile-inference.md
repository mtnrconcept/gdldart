# Intégration mobile hors-ligne de DeepDarts

Ce guide explique comment convertir le modèle DeepDarts au format ONNX puis l'intégrer dans une application React Native pour effectuer l'inférence directement sur l'appareil. Une alternative avec TensorFlow.js est également fournie.

## 1. Exporter les poids TensorFlow vers ONNX

1. Installez les dépendances Python nécessaires :
   ```bash
   pip install -r deep-darts-master/requirements.txt tf2onnx
   ```
2. Exportez le modèle vers ONNX avec le nouvel utilitaire :
   ```bash
   cd deep-darts-master
   python export_to_onnx.py \
     --config deepdarts_d1 \
     --weights models/deepdarts_d1/weights \
     --output ../exports/deepdarts_d1.onnx
   ```
   Arguments utiles :
   - `--config-path` pour charger un fichier YAML personnalisé.
   - `--weights`/`--weights-type` pour pointer vers des poids spécifiques (`.h5`, Darknet, etc.).
   - `--dynamic-batch` pour autoriser un batch dimension variable si vous comptez faire des batchs >1.

> 💡 Si vous ne disposez que d'un fichier Keras `.h5`, l'outil le chargera automatiquement et générera `exports/deepdarts.onnx` par défaut.

## 2. (Optionnel) Conversion supplémentaire

### Vers ONNX Runtime Mobile

1. Ajoutez `onnxruntime-tools` si vous souhaitez quantifier ou optimiser :
   ```bash
   pip install onnxruntime-tools
   ```
2. Utilisez `onnxruntime_tools.optimizer` ou `onnxruntime.quantization` pour alléger le modèle (par exemple `float16` ou `dynamic quantization`).
3. Copiez le fichier ONNX dans le dossier assets de votre projet React Native (ex. `app/assets/models/deepdarts_d1.onnx`).

### Vers TensorFlow.js

1. Convertissez depuis le modèle Keras ou ONNX :
   - Depuis Keras (`.h5`) :
     ```bash
     tensorflowjs_converter \
       --input_format=keras \
       models/deepdarts_d1/weights.h5 \
       ../exports/tfjs-deepdarts-d1
     ```
   - Depuis ONNX via `onnx-tf` ou `tfjs-onnx` si vous avez besoin de couches spécifiques.
2. Copiez les fichiers générés (`model.json` + shards) dans `app/assets/models/tfjs/`.

## 3. Configuration côté React Native

### Dépendances

Dans votre projet React Native, installez la caméra et la bibliothèque d'inférence souhaitée :

- **ONNX Runtime (recommandé pour les performances)**
  ```bash
  npm install onnxruntime-react-native react-native-vision-camera
  ```
- **TensorFlow.js**
  ```bash
  npm install @tensorflow/tfjs @tensorflow/tfjs-react-native react-native-vision-camera
  ```

Après l'installation, n'oubliez pas d'exécuter `npx pod-install` sur iOS et de reconstruire l'application (Expo Go ne supporte pas ces modules natifs ; créez une dev build ou utilisez `expo prebuild`).

### Accéder aux frames caméra

```ts
import { useFrameProcessor } from 'react-native-vision-camera';
import { runModel } from './model';

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const result = runModel(frame); // inférence locale
  console.log('Dart detected:', result);
}, []);
```

- Utilisez `useCameraDevices()` de Vision Camera pour choisir la caméra.
- Réduisez la résolution envoyée au modèle (ex. 224×224) pour diminuer le coût CPU/GPU.
- Exécutez l'inférence toutes les 300–500 ms plutôt qu'à chaque frame.

### Chargement du modèle

#### ONNX Runtime

```ts
import { InferenceSession } from 'onnxruntime-react-native';

let session: InferenceSession | null = null;

export async function loadModel() {
  session = await InferenceSession.create('models/deepdarts_d1.onnx');
}

export async function runModel(frame: Frame) {
  if (!session) {
    await loadModel();
  }
  const tensor = frame.toTensor({ width: 224, height: 224 }); // préprocess personnalisé
  const feeds = { images: tensor };
  const results = await session.run(feeds);
  return postProcess(results);
}
```

#### TensorFlow.js

```ts
import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

let model: tf.GraphModel | null = null;

export async function loadModel() {
  await tf.ready();
  model = await tf.loadGraphModel(bundleResourceIO(modelJson, weightShards));
}

export async function runModel(frame: Frame) {
  if (!model) {
    await loadModel();
  }
  const tensor = preprocess(frame);
  const prediction = model.execute(tensor) as tf.Tensor;
  return decodeDetections(prediction);
}
```

Adaptez `preprocess`, `postProcess` et `decodeDetections` pour reproduire la logique de `predict.py` (`bboxes_to_xy`, `get_dart_scores`).

## 4. Optimisations mobiles

- Préférez un modèle léger (YOLOv8n, MobileNet ou la version tiny de DeepDarts).
- Réduisez la taille d'entrée (224×224 ou 320×320) et normalisez entre `[-1, 1]` ou `[0, 1]` selon l'entraînement.
- Inférence 1–3 fois par seconde suffit pour suivre les lancers.
- Envisagez la quantification (`float16`, `int8`) via ONNX Runtime ou TensorFlow Lite si nécessaire.

## 5. Résumé du flux de travail

1. Exporter les poids TensorFlow → ONNX (`export_to_onnx.py`).
2. (Optionnel) Optimiser/quantifier le modèle.
3. Ajouter le modèle à votre projet React Native.
4. Installer `react-native-vision-camera` + bibliothèque d'inférence (ONNX ou TFJS).
5. Implémenter un frame processor qui appelle votre fonction d'inférence locale.
6. Calculer le score à partir des coordonnées `(x, y)` renvoyées.

Avec cette approche, toute la détection se fait hors-ligne, sans latence réseau.
