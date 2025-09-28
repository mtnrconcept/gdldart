# Mise en place de l'outil de scoring automatique

Ce guide explique comment installer les dépendances nécessaires et lancer l'outil de scoring automatique de DeepDarts.

## 1. Installation des dépendances Python

1. Assurez-vous de disposer de Python 3.10 ou supérieur.
2. Installez les dépendances du projet et les bibliothèques d'inférence :
   ```bash
   pip install -r deep-darts-master/requirements.txt onnxruntime opencv-python
   ```
3. (Optionnel) Pour l'accélération GPU, installez `onnxruntime-gpu` et OpenCV avec support CUDA selon votre environnement.

## 2. Téléchargement des poids du modèle

1. Placez les poids entraînés (`.pt`, `.h5` ou checkpoints Darknet) dans `deep-darts-master/models/<nom_modele>/`.
2. Si nécessaire, convertissez vos poids TensorFlow/Keras en ONNX via `python export_to_onnx.py` (voir `docs/mobile-inference.md`).

## 3. Lancement du service de scoring

1. Depuis la racine du dépôt, démarrez le serveur :
   ```bash
   cd deep-darts-master
   python serve.py \
     --config deepdarts_d1 \
     --weights models/deepdarts_d1/weights \
     --port 8000
   ```
2. Le serveur expose un endpoint REST (`/predict`) qui retourne les scores détectés à partir d'une image.
3. Utilisez l'option `--reload` pour recharger automatiquement après modification du code (nécessite `watchfiles`).

## 4. Vérification avec le client de test

1. Dans un autre terminal, envoyez une image de fléchettes :
   ```bash
   curl -X POST "http://localhost:8000/predict" \
     -F "image=@/chemin/vers/image.jpg"
   ```
2. Le serveur renvoie les coordonnées détectées, le secteur et le score numérique de chaque fléchette. La somme des scores correspond au score total de la volée.

## 5. Intégration avec l'application mobile

1. Dans `components/AutomaticScoring.tsx`, configurez l'URL du service (par défaut `http://localhost:8000`).
2. Exposez le serveur sur le réseau local (par exemple via `ngrok` ou en utilisant l'adresse IP de votre machine) afin que l'application mobile puisse y accéder.
3. Vérifiez que les scores remontent automatiquement dans l'interface (`Modal` de scoring et tableau de bord joueurs).

## 6. Résolution des problèmes courants

| Problème | Solution |
| --- | --- |
| `ModuleNotFoundError` lors du lancement | Revoir l'installation des dépendances (`pip install -r deep-darts-master/requirements.txt`). |
| Serveur inaccessible depuis le mobile | Vérifier l'adresse IP, le pare-feu et que `serve.py` écoute sur `0.0.0.0`. |
| Prédictions erronées | S'assurer que l'éclairage est suffisant et que le modèle correspond au jeu de données utilisé. |

Avec ces étapes, l'outil de scoring automatique est opérationnel et prêt à être intégré dans vos sessions de jeu.
