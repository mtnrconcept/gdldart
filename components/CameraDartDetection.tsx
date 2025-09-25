import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Target, Play, Pause, CircleCheck as CheckCircle } from 'lucide-react-native';

import type { DartDetectionResult } from '@/types/dartDetection';
import { detectDarts, DartDetectionError } from '@/utils/dartDetection';

const DUPLICATE_DISTANCE_THRESHOLD = 32;

const isSameDetection = (a: DartDetectionResult, b: DartDetectionResult) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= DUPLICATE_DISTANCE_THRESHOLD && a.score === b.score;
};





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
  const [detectedDarts, setDetectedDarts] = useState<DartDetectionResult[]>([]);
  const [currentDartCount, setCurrentDartCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionAbortController = useRef<AbortController | null>(null);
  const lastDetectionErrorRef = useRef<string | null>(null);
  const currentDartCountRef = useRef(0);
  const detectedDartsRef = useRef<DartDetectionResult[]>([]);
  const isProcessingRef = useRef(false);


  useEffect(() => {
    if (visible) {
      resetDetection();
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (detectionAbortController.current) {
        detectionAbortController.current.abort();
        detectionAbortController.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    currentDartCountRef.current = currentDartCount;
  }, [currentDartCount]);

  useEffect(() => {
    detectedDartsRef.current = detectedDarts;
  }, [detectedDarts]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const resetDetection = () => {
    setDetectedDarts([]);
    detectedDartsRef.current = [];
    setCurrentDartCount(0);
    currentDartCountRef.current = 0;
    setIsDetecting(false);
    setIsProcessing(false);
    isProcessingRef.current = false;
    setDetectionError(null);
    lastDetectionErrorRef.current = null;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (detectionAbortController.current) {
      detectionAbortController.current.abort();
      detectionAbortController.current = null;
    }
  };

  const startDetection = async () => {
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response?.granted) {
        return;
      }
    }

    setDetectionError(null);
    lastDetectionErrorRef.current = null;
    setIsDetecting(true);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setIsProcessing(false);
    isProcessingRef.current = false;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (detectionAbortController.current) {
      detectionAbortController.current.abort();
      detectionAbortController.current = null;
    }
  };

  const convertDetections = useCallback((detections: DartDetectionResult[]) => {
    const { width: fallbackWidth, height: fallbackHeight } = Dimensions.get('window');
    const width = cameraLayout.width || fallbackWidth;
    const height = cameraLayout.height || fallbackHeight;

    return detections.map((dart) => {
      const isNormalized = dart.x >= 0 && dart.x <= 1 && dart.y >= 0 && dart.y <= 1;
      const x = isNormalized ? dart.x * width : dart.x;
      const y = isNormalized ? dart.y * height : dart.y;

      return { ...dart, x, y };
    });
  }, [cameraLayout]);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isProcessingRef.current) return;

    setIsProcessing(true);
    isProcessingRef.current = true;

    const controller = new AbortController();
    if (detectionAbortController.current) {
      detectionAbortController.current.abort();
    }
    detectionAbortController.current = controller;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        return;
      }

      const remoteDetections = await detectDarts(photo.base64, { signal: controller.signal });
      const mappedDetections = convertDetections(remoteDetections);

      if (!mappedDetections.length) {
        setDetectionError(null);
        return;
      }

      const existing = detectedDartsRef.current;
      const availableSlots = maxDarts - existing.length;

      if (availableSlots <= 0) {
        setDetectionError(null);
        return;
      }

      const newDetections = mappedDetections.filter((candidate) =>
        !existing.some((dart) => isSameDetection(dart, candidate))
      );

      if (!newDetections.length) {
        setDetectionError(null);
        return;
      }

      const dartsToAdd = newDetections.slice(0, availableSlots);

      if (!dartsToAdd.length) {
        return;
      }

      setDetectedDarts((prev) => {
        const updated = [...prev, ...dartsToAdd];
        detectedDartsRef.current = updated;
        return updated;
      });

      const newCount = existing.length + dartsToAdd.length;
      setCurrentDartCount(newCount);
      currentDartCountRef.current = newCount;
      setDetectionError(null);
      lastDetectionErrorRef.current = null;

      dartsToAdd.forEach((dart) => {
        onDartDetected(dart.score);

        Alert.alert(
          'Fl\u00E9chette d\u00E9tect\u00E9e !',
          'Score: ' + dart.score + ' points (' + dart.sector + ')',
          [{ text: 'OK' }]
        );
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const message =
        error instanceof DartDetectionError
          ? error.message
          : "Une erreur est survenue lors de l'analyse de l'image.";

      if (lastDetectionErrorRef.current !== message) {
        lastDetectionErrorRef.current = message;
        Alert.alert('Erreur de d\u00E9tection', message);
      }

      setDetectionError(message);
      console.error('Erreur lors de la d\u00E9tection de fl\u00E9chettes:', error);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;

      if (detectionAbortController.current === controller) {
        detectionAbortController.current = null;
      }
    }
  }, [convertDetections, maxDarts, onDartDetected]);

  useEffect(() => {
    if (!isDetecting) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      return;
    }

    captureAndAnalyze();

    detectionIntervalRef.current = setInterval(() => {
      if (currentDartCountRef.current < maxDarts && !isProcessingRef.current) {
        captureAndAnalyze();
      }
    }, 2000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [captureAndAnalyze, isDetecting, maxDarts]);

  const completeTurn = () => {
    const scores = detectedDarts.map(dart => dart.score);
    onTurnComplete(scores);
    resetDetection();
  };

  const removeLastDart = () => {
    if (detectedDarts.length > 0) {
      const newDarts = detectedDarts.slice(0, -1);
      setDetectedDarts(newDarts);
      detectedDartsRef.current = newDarts;
      setCurrentDartCount(newDarts.length);
      currentDartCountRef.current = newDarts.length;
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Chargement de la camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={48} color="#666666" />
          <Text style={styles.permissionTitle}>Acces a la camera requis</Text>
          <Text style={styles.permissionText}>
            Pour detecter automatiquement les flechettes, nous avons besoin d'acceder a votre camera.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la camera</Text>
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
          <Text style={styles.headerTitle}>Detection Automatique</Text>
        </View>
        <View style={styles.gameModeIndicator}>
          <Text style={styles.gameModeText}>{gameMode}</Text>
        </View>
      </View>

      {/* Informations du joueur */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>Tour de {currentPlayer}</Text>
        <Text style={styles.dartCount}>
          Flechettes: {currentDartCount}/{maxDarts}
        </Text>
      </View>

      {/* Vue camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setCameraLayout({ width, height });
          }}
        >
          {/* Overlay de la cible */}
          <View style={styles.targetOverlay}>
            <View style={styles.targetCircle}>
              <View style={styles.targetCenter} />
            </View>
          </View>

          {/* Flechettes detectees */}
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

      {/* Scores detectes */}
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Scores detectes:</Text>
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
            ? "Appuyez sur 'Demarrer' pour commencer la detection"
            : "Lancez vos flechettes sur la cible. La detection est automatique."
          }
        </Text>
        {detectionError && (
          <Text style={styles.errorText}>{detectionError}</Text>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {!isDetecting ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startDetection}
          >
            <Play size={20} color="#0F0F0F" />
            <Text style={styles.startButtonText}>Demarrer la detection</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopDetection}
          >
            <Pause size={20} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Arreter</Text>
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
  errorText: {
    marginTop: 8,
    color: '#FF0041',
    fontSize: 13,
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

