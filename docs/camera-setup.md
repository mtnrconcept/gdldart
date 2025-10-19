# Configuration de la caméra pour la détection automatique

## Prérequis

1. **Serveur de détection DeepDarts**
   - Le serveur Python doit être démarré et accessible
   - Par défaut, il écoute sur le port 8000
   - Le téléphone et le serveur doivent être sur le même réseau WiFi

2. **Permissions caméra**
   - L'application demandera automatiquement l'accès à la caméra
   - Assurez-vous d'autoriser l'accès dans les paramètres de votre téléphone

## Configuration de l'URL du service

### Option 1: Serveur local

1. **Trouvez l'adresse IP de votre serveur:**

   **Sur Windows:**
   ```bash
   ipconfig
   ```
   Cherchez "Adresse IPv4" sous "Carte réseau sans fil Wi-Fi"

   **Sur macOS:**
   ```bash
   ifconfig
   ```
   Cherchez "inet" sous "en0" (WiFi)

   **Sur Linux:**
   ```bash
   ip addr
   ```
   Cherchez "inet" sous votre interface réseau (souvent wlan0)

2. **Configurez l'URL dans `.env`:**
   ```
   EXPO_PUBLIC_DART_DETECTION_URL=http://[VOTRE_IP]:8000/api/detect
   ```
   Exemple: `http://192.168.1.10:8000/api/detect`

3. **Démarrez le serveur Python:**
   ```bash
   cd deep-darts-master
   python serve.py
   ```

### Option 2: Serveur distant (par défaut)

Si vous n'avez pas configuré d'URL locale, l'application utilisera automatiquement le service hébergé:
```
https://deep-darts.fly.dev/api/detect
```

## Utilisation

1. **Ouvrir la détection automatique:**
   - Dans un match, appuyez sur le bouton "Comptage Automatique"
   - Ou utilisez le bouton "Comptage" depuis l'écran principal

2. **Autoriser la caméra:**
   - Si c'est la première fois, acceptez les permissions caméra
   - Attendez que la caméra soit prête (indicateur visuel)

3. **Démarrer la détection:**
   - Appuyez sur "Démarrer la détection"
   - Pointez la caméra vers la cible de fléchettes
   - Lancez vos fléchettes

4. **Validation automatique:**
   - Les fléchettes sont détectées automatiquement
   - Le score est calculé et affiché en temps réel
   - Après 3 fléchettes (ou le nombre configuré), validez le tour

## Optimisation de la détection

### Éclairage
- Assurez-vous que la cible est bien éclairée
- Évitez les contre-jours et les reflets
- L'éclairage naturel ou artificiel uniforme fonctionne mieux

### Distance et angle
- Placez-vous à environ 2-3 mètres de la cible
- Gardez la caméra perpendiculaire à la cible
- Essayez de cadrer toute la cible dans le cercle de visée

### Réseau
- Une connexion WiFi stable améliore les performances
- La détection nécessite l'envoi d'images au serveur
- Temps de réponse typique: 1-3 secondes par analyse

## Dépannage

### "Permission refusée"
**Solution:**
- Allez dans les paramètres de votre téléphone
- Trouvez l'application dans la liste des apps
- Activez la permission "Caméra"

### "Impossible de contacter le service"
**Solutions possibles:**
1. Vérifiez que le serveur Python est démarré
2. Vérifiez que téléphone et serveur sont sur le même WiFi
3. Testez l'URL dans un navigateur: `http://[IP]:8000/health`
4. Vérifiez le pare-feu de votre ordinateur

### "Caméra non prête"
**Solutions possibles:**
1. Fermez et rouvrez l'application
2. Redémarrez votre téléphone
3. Vérifiez qu'aucune autre app n'utilise la caméra

### "Délai dépassé (timeout)"
**Solutions possibles:**
1. Vérifiez votre connexion réseau
2. Le serveur peut être surchargé, réessayez
3. Réduisez la distance au serveur si en local

### Détections inexactes
**Solutions possibles:**
1. Améliorez l'éclairage de la cible
2. Stabilisez la caméra (ou attendez qu'elle se stabilise)
3. Assurez-vous que toute la cible est visible
4. Évitez les mouvements pendant la capture

## Logs et diagnostic

L'application affiche des logs détaillés dans la console:
- `[Permission]` - Gestion des permissions caméra
- `[Caméra]` - Initialisation et état de la caméra
- `[Capture]` - Capture et traitement d'images
- `[API]` - Communication avec le service de détection
- `[Détection]` - Résultats de détection
- `[Erreur]` - Messages d'erreur détaillés

Ces logs vous aideront à diagnostiquer les problèmes.

## Performances

### Optimisations implémentées
- Compression des images avant envoi (qualité 60%, max 480px)
- Détection de changement de frame (évite les analyses inutiles)
- Retry automatique en cas d'échec (jusqu'à 3 tentatives)
- Timeout adapté pour réseaux mobiles (30 secondes)
- Arrêt automatique après détection des 3 fléchettes

### Consommation réseau
- Environ 50-100 KB par image analysée
- 3-6 images par tour (selon la stabilité)
- Total: ~300-600 KB par tour de 3 fléchettes
