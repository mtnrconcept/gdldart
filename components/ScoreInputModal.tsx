import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Match, Player } from '@/types/tournament';
import { Trophy, Target, Camera, X, Zap, Check } from 'lucide-react-native';
import { CameraView } from 'expo-camera';

interface ScoreInputModalProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
  onSubmit: (winner: Player, score: { player1Score: number; player2Score: number }) => void;
}

interface ScannedResult {
  total_score: number;
  arrows: {
    id: number;
    score: number;
    ring: string;
    sector: number;
  }[];
  annotatedImageUri: string;
}

export const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  visible,
  match,
  onClose,
  onSubmit,
}) => {
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = CameraView.useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedResult | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const API_URL = 'http://192.168.1.25:8000/score'; // ⚠️ REMPLACEZ PAR L'IP DE VOTRE PC

  const handleSubmit = () => {
    const p1Score = parseInt(player1Score);
    const p2Score = parseInt(player2Score);

    if (isNaN(p1Score) || isNaN(p2Score)) {
      Alert.alert('Erreur', 'Veuillez saisir des scores valides');
      return;
    }

    if (p1Score === p2Score) {
      Alert.alert('Erreur', 'Il ne peut pas y avoir d\'égalité');
      return;
    }

    if (!match.player1 || !match.player2) {
      Alert.alert('Erreur', 'Les deux joueurs doivent être définis');
      return;
    }

    const winner = p1Score > p2Score ? match.player1 : match.player2;
    const score = { player1Score: p1Score, player2Score: p2Score };

    onSubmit(winner, score);
    setPlayer1Score('');
    setPlayer2Score('');
  };

  const handleClose = () => {
    setPlayer1Score('');
    setPlayer2Score('');
    setScannedResult(null);
    setCapturedPhoto(null);
    onClose();
  };
  
  const handleScanWithCamera = async () => {
    if (!permission) {
      // Les permissions sont encore en cours de chargement
      return;
    }

    if (!permission.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra pour utiliser cette fonctionnalité.');
        return;
      }
    }

    setCameraVisible(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    }
  };

  const sendPhotoForScoring = async () => {
    if (!capturedPhoto) return;

    setIsScanning(true);
    setScannedResult(null);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: capturedPhoto,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as never);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      // Gérer la réponse multipart
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('multipart/x-mixed-replace')) {
        const text = await response.text();
        const parts = text.split('--frame\r\n');
        
        const jsonPart = parts.find(p => p.includes('Content-Type: application/json'));
        const imagePart = parts.find(p => p.includes('Content-Type: image/jpeg'));

        if (jsonPart && imagePart) {
          const jsonString = jsonPart.split('\r\n\r\n')[1];
          const jsonData = JSON.parse(jsonString);

          const imageBase64 = imagePart.split('\r\n\r\n')[1].trim();
          const imageUri = `data:image/jpeg;base64,${btoa(imageBase64)}`;

          setScannedResult({ ...jsonData, annotatedImageUri: imageUri });
        } else {
          throw new Error('Réponse multipart invalide');
        }
      } else {
        throw new Error('Type de contenu inattendu');
      }

    } catch (error) {
      console.error("Erreur lors du scan:", error);
      Alert.alert('Erreur de Scan', 'Impossible de contacter le serveur de scoring. Vérifiez que le serveur est bien lancé et que l\'URL est correcte.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAcceptScore = () => {
    if (!scannedResult) return;
    // Logique pour appliquer le score. Pour l'instant, on l'assigne au joueur 1.
    // Ceci pourrait être plus complexe (ex: pour un 501, soustraire du score actuel).
    setPlayer1Score(scannedResult.total_score.toString());
    setCameraVisible(false);
    setCapturedPhoto(null);
    setScannedResult(null);
  };

  const handleRetryScan = () => {
    setCapturedPhoto(null);
    setScannedResult(null);
  };

  const handleCloseCamera = () => {
    setCameraVisible(false);
    setCapturedPhoto(null);
    if (isScanning) {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Réinitialiser les scores si le match change
    setPlayer1Score('');
    setPlayer2Score('');
  }, [match]);

  if (!match.player1 || !match.player2) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      {cameraVisible && !capturedPhoto && !scannedResult && (
        <View style={StyleSheet.absoluteFill}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef}>
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.cameraActionButton} onPress={handleCloseCamera}>
                <X size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shutterButton} onPress={takePicture} />
              <View style={{ width: 52 }} />
            </View>
          </CameraView>
        </View>
      )}

      {capturedPhoto && !scannedResult && (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
          {isScanning && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.scanningText}>Analyse en cours...</Text>
            </View>
          )}
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.cameraActionButton} onPress={handleRetryScan} disabled={isScanning}>
              <Text style={styles.previewButtonText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraActionButton} onPress={sendPhotoForScoring} disabled={isScanning}>
              <Text style={styles.previewButtonText}>Valider</Text>
              <Check size={24} color="#00FF41" />
              </TouchableOpacity>
          </View>
        </View>
      )}

      {scannedResult && (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: scannedResult.annotatedImageUri }} style={styles.previewImage} />
          <View style={styles.resultOverlay}>
            <Text style={styles.resultTitle}>Score Détecté</Text>
            <Text style={styles.resultScore}>{scannedResult.total_score}</Text>
            <Text style={styles.resultDetails}>{scannedResult.arrows.length} fléchettes trouvées</Text>
          </View>
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.cameraActionButton} onPress={handleRetryScan}>
              <Text style={styles.previewButtonText}>Re-scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraActionButton} onPress={() => setScannedResult(null)}>
              <Text style={styles.previewButtonText}>Corriger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraActionButton} onPress={handleAcceptScore}>
              <Text style={styles.previewButtonText}>Accepter</Text>
              <Check size={24} color="#00FF41" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!cameraVisible && !capturedPhoto && !scannedResult && (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Target size={24} color="#00FF41" />
            <Text style={styles.title}>Saisir le résultat</Text>
          </View>

          <View style={styles.matchInfo}>
            <Text style={styles.matchTitle}>
              {match.player1.name} vs {match.player2.name}
            </Text>
          </View>

          <View style={styles.scoreInputs}>
            <View style={styles.playerScoreContainer}>
              <Text style={styles.playerName}>{match.player1.name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={player1Score}
                onChangeText={setPlayer1Score}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666666"
              />
            </View>

            <Text style={styles.vs}>VS</Text>

            <View style={styles.playerScoreContainer}>
              <Text style={styles.playerName}>{match.player2.name}</Text>
              <TextInput
                style={styles.scoreInput}
                value={player2Score}
                onChangeText={setPlayer2Score}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666666"
              />
            </View>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Saisissez le score final de chaque joueur
            </Text>
            <Text style={styles.instructionSubtext}>
              Le joueur avec le score le plus élevé sera déclaré vainqueur
            </Text>
          </View>

          <TouchableOpacity style={styles.scanButton} onPress={handleScanWithCamera}>
            <Camera size={20} color="#0F0F0F" />
            <Text style={styles.scanButtonText}>Scanner avec la caméra</Text>
          </TouchableOpacity>


          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Trophy size={16} color="#0F0F0F" />
              <Text style={styles.submitButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 40,
    flexDirection: 'row',
  },
  cameraActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  resultOverlay: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultScore: {
    color: '#FFD700',
    fontSize: 64,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  resultDetails: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  shutterButton: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -35 }],
    bottom: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modal: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  matchInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  playerScoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#00FF41',
    minWidth: 80,
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginHorizontal: 16,
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#00FF41',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});