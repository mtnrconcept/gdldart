# Dev sur mobile avec detection automatique

1. **Lancer l'API Deep Darts**
   ```powershell
   cd deep-darts-master
   python serve.py
   ```
   Le serveur ecoute sur `http://localhost:8000/api/detect`.

2. **Ouvrir un tunnel vers le port 8000** (nouvelle invite PowerShell)
   ```powershell
   cd c:/Users/Pc/gdldart
   npm run tunnel:darts
   ```
   Le terminal affiche une URL `https://xxxxx.loca.lt`. Conservez-la.

3. **Exporter l'URL pour Expo** (remplacer `<tunnel>`)
   ```powershell
   $env:EXPO_PUBLIC_DART_DETECTION_URL = '<tunnel>/api/detect'
   $env:EXPO_NO_TELEMETRY = '1'
   ```

4. **Demarrer Expo en mode tunnel**
   ```powershell
   npx expo start --tunnel
   ```
   Scannez le QR code depuis Expo Go sur le telephone.

> Lorsque vous avez termine, vous pouvez supprimer la variable d'environnement avec `Remove-Item Env:EXPO_PUBLIC_DART_DETECTION_URL`.
