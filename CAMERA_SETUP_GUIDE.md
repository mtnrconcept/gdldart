# 📸 Guide de configuration de la détection automatique par caméra

## 🎯 Vue d'ensemble

Le module de scoring automatique utilise la caméra de votre téléphone pour détecter les fléchettes sur la cible et calculer automatiquement les scores. Ce guide vous aidera à configurer et utiliser cette fonctionnalité.

## ✅ Prérequis

### 1. Serveur de détection

Le système nécessite un serveur Python DeepDarts pour analyser les images. Deux options:

**Option A: Serveur distant (par défaut)**
- URL: `https://deep-darts.fly.dev/api/detect`
- Aucune configuration nécessaire
- Toujours disponible

**Option B: Serveur local**
- Plus rapide et privé
- Nécessite Python 3.10+ et les dépendances
- Votre téléphone et serveur doivent être sur le même réseau WiFi

### 2. Permissions

L'application demandera automatiquement l'accès à la caméra au premier lancement.

## 🚀 Configuration rapide

### Étape 1: Configurer l'URL du service (optionnel pour serveur local)

1. **Trouvez votre adresse IP locale:**

```bash
# Windows
ipconfig

# macOS
ifconfig

# Linux
ip addr
```

Cherchez votre adresse IPv4 (ex: `192.168.1.10`)

2. **Créez un fichier `.env` à la racine du projet:**

```bash
cp .env.example .env
```

3. **Modifiez `.env` avec votre IP:**

```env
EXPO_PUBLIC_DART_DETECTION_URL=http://192.168.1.10:8000/api/detect
```

### Étape 2: Démarrer le serveur local (si utilisé)

```bash
cd deep-darts-master
python serve.py
```

Le serveur démarrera sur le port 8000.

### Étape 3: Vérifier la connectivité

```bash
npm run check-backend
```

Ce script testera automatiquement:
- Toutes vos adresses IP locales
- Le service distant par défaut
- Affichera quelle URL utiliser dans `.env`

## 📱 Utilisation

### Démarrer une détection

1. **Dans un match:**
   - Ouvrez un match de tournoi
   - Appuyez sur "Comptage Automatique"

2. **Ou depuis l'accueil:**
   - Appuyez sur le bouton "Comptage" (vert)

### Processus de détection

1. **Autorisation caméra:**
   - Acceptez la permission si c'est la première fois
   - L'indicateur "Caméra prête" apparaîtra

2. **Démarrer:**
   - Appuyez sur "Démarrer la détection"
   - Pointez la caméra vers la cible

3. **Lancer les fléchettes:**
   - Lancez vos 3 fléchettes
   - Les scores sont détectés automatiquement
   - Un cercle de visée aide au cadrage

4. **Valider:**
   - Vérifiez les scores détectés
   - Appuyez sur "Terminer le tour"
   - Ou "Annuler" pour retirer la dernière fléchette

### Interface de détection

- **En-tête:**
  - Mode de jeu (501, 301, Cricket)
  - Bouton pour changer de caméra
  - Scores des joueurs

- **Centre:**
  - Cercle de visée (gardez la cible dans ce cercle)
  - Marqueurs rouges sur les fléchettes détectées

- **Bas:**
  - Scores détectés (3 emplacements)
  - Total du tour
  - Instructions
  - Boutons de contrôle

## 🎨 Optimisation de la détection

### Éclairage optimal

✅ **Bon:**
- Éclairage uniforme de la cible
- Lumière naturelle indirecte
- Éclairage LED blanc

❌ **Éviter:**
- Contre-jour (lumière derrière la cible)
- Reflets sur la cible
- Ombres portées des fléchettes

### Positionnement

✅ **Bon:**
- Distance: 2-3 mètres de la cible
- Caméra perpendiculaire à la cible
- Toute la cible visible dans le cercle
- Téléphone stable

❌ **Éviter:**
- Trop proche (< 1m) ou trop loin (> 5m)
- Angle trop oblique
- Cible partiellement visible
- Mouvements pendant la capture

### Réseau

✅ **Bon:**
- WiFi stable 4-5 barres
- Serveur local sur même réseau
- Ping < 100ms

❌ **Éviter:**
- Données cellulaires (lent et coûteux)
- WiFi public instable
- Réseaux surchargés

## 🔧 Résolution de problèmes

### "Permission refusée"

**Cause:** L'accès caméra n'est pas autorisé

**Solution:**
1. Allez dans Paramètres de votre téléphone
2. Trouvez l'application
3. Activez la permission "Caméra"
4. Redémarrez l'application

### "Impossible de contacter le service"

**Cause:** Le serveur n'est pas accessible

**Solutions:**

1. **Vérifiez que le serveur est démarré:**
   ```bash
   cd deep-darts-master
   python serve.py
   ```

2. **Testez la connectivité:**
   ```bash
   npm run check-backend
   ```

3. **Vérifiez le WiFi:**
   - Téléphone et serveur sur le même réseau ?
   - Testez avec `curl http://[IP]:8000/api/detect`

4. **Vérifiez le pare-feu:**
   - Autorisez Python sur le port 8000
   - Windows: Pare-feu Windows Defender
   - macOS: Préférences Système > Sécurité > Pare-feu

5. **Utilisez le service distant:**
   - Supprimez ou commentez `EXPO_PUBLIC_DART_DETECTION_URL` dans `.env`
   - Redémarrez l'application

### "Caméra non prête"

**Cause:** La caméra n'a pas pu s'initialiser

**Solutions:**
1. Fermez complètement l'application
2. Vérifiez qu'aucune autre app n'utilise la caméra
3. Redémarrez votre téléphone
4. Réinstallez l'application

### "Délai dépassé (timeout)"

**Cause:** Le serveur est trop lent ou inaccessible

**Solutions:**
1. Vérifiez votre connexion WiFi (signal faible ?)
2. Le serveur distant peut être surchargé, réessayez
3. Utilisez un serveur local pour de meilleures performances
4. Rapprochez-vous du routeur WiFi

### Détections inexactes ou manquées

**Cause:** Conditions non optimales

**Solutions:**
1. **Améliorez l'éclairage:**
   - Ajoutez une source de lumière
   - Éliminez les ombres

2. **Ajustez la position:**
   - Reculez ou avancez légèrement
   - Centrez la cible dans le cercle
   - Stabilisez le téléphone

3. **Attendez la stabilisation:**
   - La caméra capture périodiquement (toutes les 2 secondes)
   - Gardez la caméra immobile quelques secondes

4. **Qualité des fléchettes:**
   - Fléchettes bien plantées (non inclinées)
   - Couleurs contrastées avec la cible

### Consommation de batterie élevée

**Cause:** Utilisation intensive de la caméra et du réseau

**Solutions:**
1. Branchez votre téléphone pendant les longues sessions
2. Fermez la détection entre les tours
3. Réduisez la luminosité de l'écran
4. Utilisez un serveur local (plus rapide = moins de temps actif)

## 📊 Performances et limitations

### Performances typiques

- **Temps de détection:** 1-3 secondes par analyse
- **Taux de réussite:** 80-95% selon conditions
- **Consommation réseau:** ~300-600 KB par tour (3 fléchettes)
- **Batterie:** ~10-15% par heure d'utilisation continue

### Limitations connues

1. **Conditions d'éclairage:**
   - Très faible luminosité: détection difficile
   - Forte lumière directe: reflets gênants

2. **Angle de vue:**
   - Maximum ±45° par rapport à la perpendiculaire
   - Au-delà, précision réduite

3. **Type de cible:**
   - Optimisé pour cibles standard bristle
   - Cibles électroniques: résultats variables

4. **Nombre de fléchettes:**
   - Maximum 3 par tour (configurable)
   - Plus de fléchettes plantées: confusion possible

## 🔍 Logs et diagnostic

L'application génère des logs détaillés visibles dans la console:

- `[Permission]` - Gestion des permissions
- `[Caméra]` - État de la caméra
- `[Capture]` - Capture d'images
- `[API]` - Communication serveur
- `[Détection]` - Résultats détection
- `[Erreur]` - Messages d'erreur

### Activer les logs en production

Les logs sont automatiques en mode développement. Pour la production:

1. Connectez votre téléphone à votre ordinateur
2. iOS: Utilisez Console.app (macOS)
3. Android: Utilisez `adb logcat`

## 📚 Ressources supplémentaires

- [Documentation complète](./docs/camera-setup.md)
- [Configuration serveur DeepDarts](./deep-darts-master/README.md)
- [Inférence mobile](./docs/mobile-inference.md)

## 🆘 Support

Si vous rencontrez des problèmes non résolus:

1. Vérifiez les logs de l'application
2. Testez avec le script `npm run check-backend`
3. Consultez la documentation dans `/docs`
4. Vérifiez que toutes les dépendances Python sont installées

## 🎉 Conseils pro

1. **Session de calibration:**
   - Faites quelques tests pour trouver le meilleur angle
   - Marquez au sol la position optimale

2. **Stabilisation:**
   - Utilisez un trépied pour téléphone
   - Ou posez le téléphone sur un support stable

3. **Marqueurs visuels:**
   - Les marqueurs rouges restent affichés
   - Vérifiez visuellement avant de valider

4. **Mode rapide:**
   - Lancez les 3 fléchettes d'affilée
   - Attendez 5-10 secondes
   - Validez le tour

5. **Serveur local:**
   - Beaucoup plus rapide que le distant
   - Idéal pour tournois et parties longues
   - Fonctionne hors ligne (après configuration)

Bonne partie ! 🎯
