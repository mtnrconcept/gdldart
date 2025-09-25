import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Target, Play, Pause, CheckCircle } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DartDetection {
  x: number;
  y: number;
  score: number;
  sector: string;
  confidence: number;
}

interface CameraDartDetectionProps {
  visible: boolean;
  gameMode: '501' | '301' | 'cricket';
  onClose: () => void;
  onDartDetected: (score: number) => void;
  onTurnComplete: (scores: number[]) => void;
  currentPlayer: string;
  maxDarts: number;
}

export const CameraDartDetection: React.FC<CameraDartDetectionProps> = ({
  visible,
  gameMode,
  onClose,
  onDartDetected,
  onTurnComplete,
  currentPlayer,
  maxDarts = 3,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDarts, setDetectedDarts] = useState<DartDetection[]>([]);
  const [currentDartCount, setCurrentDartCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      resetDetection();
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [visible]);

  const resetDetection = () => {
    setDetectedDarts([]);
    setCurrentDartCount(0);
    setIsDetecting(false);
    setIsProcessing(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const startDetection = () => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }

    setIsDetecting(true);
    
    // Simuler la détection avec un intervalle
    detectionIntervalRef.current = setInterval(() => {
      if (currentDartCount < maxDarts && !isProcessing) {
        captureAndAnalyze();
      }
    }, 2000); // Vérifier toutes les 2 secondes
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      // Capturer l'image
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.base64) {
        // Analyser l'image avec le modèle deep-darts
        const detections = await analyzeDartboard(photo.base64);
        
        if (detections.length > detectedDarts.length) {
          // Nouvelles fléchettes détectées
          const newDarts = detections.slice(detectedDarts.length);
          
          for (const dart of newDarts) {
            if (currentDartCount < maxDarts) {
              setDetectedDarts(prev => [...prev, dart]);
              setCurrentDartCount(prev => prev + 1);
              onDartDetected(dart.score);
              
              // Notification visuelle/sonore
              Alert.alert(
                'Fléchette détectée !',
                `Score: ${dart.score} points (${dart.sector})`,
                [{ text: 'OK' }]
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction simulée d'analyse d'image (à remplacer par l'intégration réelle de deep-darts)
  const analyzeDartboard = async (base64Image: string): Promise<DartDetection[]> => {
    // Simulation de l'analyse avec deep-darts
    // Dans la vraie implémentation, ceci ferait appel au modèle ML
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simuler la détection de fléchettes
        const mockDetections: DartDetection[] = [];
        
        // Générer des détections aléatoires pour la démo
        const numDarts = Math.min(
          Math.floor(Math.random() * 2) + detectedDarts.length,
          maxDarts
        );
        
        for (let i = detectedDarts.length; i < numDarts; i++) {
          const scores = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 25, 50];
          const multipliers = ['simple', 'double', 'triple'];
          
          const baseScore = scores[Math.floor(Math.random() * scores.length)];
          const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
          
          let finalScore = baseScore;
          let sector = `${baseScore}`;
          
          if (baseScore === 25) {
            finalScore = 25;
            sector = 'Bull simple';
          } else if (baseScore === 50) {
            finalScore = 50;
            sector = 'Bull double';
          } else {
            switch (multiplier) {
              case 'double':
                finalScore = baseScore * 2;
                sector = `Double ${baseScore}`;
                break;
              case 'triple':
                finalScore = baseScore * 3;
                sector = `Triple ${baseScore}`;
                break;
              default:
                sector = `Simple ${baseScore}`;
            }
          }
          
          mockDetections.push({
            x: Math.random() * 300 + 50,
            y: Math.random() * 300 + 50,
            score: finalScore,
            sector,
            confidence: 0.85 + Math.random() * 0.15,
          });
        }
        
        resolve(mockDetections);
      }, 1000);
    });
  };

  const completeTurn = () => {
    const scores = detectedDarts.map(dart => dart.score);
    onTurnComplete(scores);
    resetDetection();
  };

  const removeLastDart = () => {
    if (detectedDarts.length > 0) {
      const newDarts = detectedDarts.slice(0, -1);
      setDetectedDarts(newDarts);
      setCurrentDartCount(newDarts.length);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Chargement de la caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={48} color="#666666" />
          <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
          <Text style={styles.permissionText}>
            Pour détecter automatiquement les fléchettes, nous avons besoin d'accéder à votre caméra.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Target size={24} color="#00FF41" />
          <Text style={styles.headerTitle}>Détection Automatique</Text>
        </View>
        <View style={styles.gameModeIndicator}>
          <Text style={styles.gameModeText}>{gameMode}</Text>
        </View>
      </View>

      {/* Informations du joueur */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>Tour de {currentPlayer}</Text>
        <Text style={styles.dartCount}>
          Fléchettes: {currentDartCount}/{maxDarts}
        </Text>
      </View>

      {/* Vue caméra */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Overlay de la cible */}
          <View style={styles.targetOverlay}>
            <View style={styles.targetCircle}>
              <View style={styles.targetCenter} />
            </View>
          </View>

          {/* Fléchettes détectées */}
          {detectedDarts.map((dart, index) => (
            <View
              key={index}
              style={[
                styles.dartMarker,
                {
                  left: dart.x,
                  top: dart.y,
                }
              ]}
            >
              <View style={styles.dartDot} />
              <Text style={styles.dartScore}>{dart.score}</Text>
            </View>
          ))}

          {/* Indicateur de traitement */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Analyse en cours...</Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Scores détectés */}
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Scores détectés:</Text>
        <View style={styles.scoresList}>
          {detectedDarts.map((dart, index) => (
            <View key={index} style={styles.scoreItem}>
              <Text style={styles.scoreValue}>{dart.score}</Text>
              <Text style={styles.scoreSector}>{dart.sector}</Text>
            </View>
          ))}
          {Array.from({ length: maxDarts - detectedDarts.length }).map((_, index) => (
            <View key={`empty-${index}`} style={[styles.scoreItem, styles.emptyScore]}>
              <Text style={styles.emptyScoreText}>-</Text>
            </View>
          ))}
        </View>
        <Text style={styles.totalScore}>
          Total: {detectedDarts.reduce((sum, dart) => sum + dart.score, 0)}
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {!isDetecting 
            ? "Appuyez sur 'Démarrer' pour commencer la détection"
            : "Lancez vos fléchettes sur la cible. La détection est automatique."
          }
        </Text>
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        {!isDetecting ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startDetection}
          >
            <Play size={20} color="#0F0F0F" />
            <Text style={styles.startButtonText}>Démarrer la détection</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopDetection}
          >
            <Pause size={20} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Arrêter</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={removeLastDart}
            disabled={detectedDarts.length === 0}
          >
            <RotateCcw size={16} color="#FF0041" />
            <Text style={styles.actionButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={completeTurn}
            disabled={detectedDarts.length === 0}
          >
            <CheckCircle size={16} color="#0F0F0F" />
            <Text style={[styles.actionButtonText, styles.completeButtonText]}>
              Terminer le tour
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  closeButton: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gameModeIndicator: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gameModeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  playerInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dartCount: {
    fontSize: 14,
    color: '#00FF41',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F1F1F',
  },
  camera: {
    flex: 1,
    position: 'relative',
  },
  targetOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  targetCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#00FF41',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF0041',
  },
  dartMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  dartDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0041',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dartScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  processingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 255, 65, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingText: {
    color: '#0F0F0F',
    fontWeight: 'bold',
  },
  scoresContainer: {
    padding: 20,
    backgroundColor: '#1F1F1F',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  scoresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  scoresList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  scoreItem: {
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  emptyScore: {
    opacity: 0.5,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FF41',
    marginBottom: 4,
  },
  scoreSector: {
    fontSize: 10,
    color: '#666666',
  },
  emptyScoreText: {
    fontSize: 18,
    color: '#666666',
  },
  totalScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  controls: {
    padding: 20,
    paddingBottom: 40,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF41',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0041',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F1F1F',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  completeButton: {
    backgroundColor: '#00FF41',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completeButtonText: {
    color: '#0F0F0F',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});