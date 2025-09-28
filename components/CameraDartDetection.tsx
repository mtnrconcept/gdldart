import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, Target, Play, Pause, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import type { DartDetectionResult } from '@/types/dartDetection';
import { detectDarts, DartDetectionError } from '@/utils/dartDetection';

const DUPLICATE_DISTANCE_THRESHOLD = 32;
const STREAM_INTERVAL_MS = 1000;
const MAX_RESIZED_WIDTH = 320;
const FRAME_SAMPLE_COUNT = 96;
const MIN_FRAME_CHANGE_RATIO = 0.12;

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
  currentPlayerIndex: 1 | 2;
  player1: { name: string; score: number };
  player2: { name: string; score: number };
  maxDarts: number;
}

export const CameraDartDetection: React.FC<CameraDartDetectionProps> = ({
  visible,
  gameMode,
  onClose,
  onDartDetected,
  onTurnComplete,
  currentPlayer,
  currentPlayerIndex,
  player1,
  player2,
  maxDarts = 3,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDarts, setDetectedDarts] = useState<DartDetectionResult[]>([]);
  const [currentDartCount, setCurrentDartCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [permissionRequesting, setPermissionRequesting] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionAbortController = useRef<AbortController | null>(null);
  const lastDetectionErrorRef = useRef<string | null>(null);
  const currentDartCountRef = useRef(0);
  const detectedDartsRef = useRef<DartDetectionResult[]>([]);
  const isProcessingRef = useRef(false);
  const lastFrameSignatureRef = useRef<string | null>(null);
  const autoStartAttemptedRef = useRef(false);


  useEffect(() => {
    if (visible) {
      resetDetection();
      setIsCameraReady(false);
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
    setIsCameraReady(false);
    lastFrameSignatureRef.current = null;
    autoStartAttemptedRef.current = false;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (detectionAbortController.current) {
      detectionAbortController.current.abort();
      detectionAbortController.current = null;
    }
  };

  const handleRequestPermission = useCallback(async () => {
    console.log('Demande de permission caméra...');
    setPermissionRequesting(true);
    try {
      const response = await requestPermission();
      console.log('Réponse permission:', response);
      if (response?.granted) {
        console.log('Permission accordée');
        Alert.alert('Succès', 'Accès à la caméra autorisé !');
        return true;
      } else {
        console.log('Permission refusée');
        Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire pour la détection automatique.');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      Alert.alert('Erreur', 'Impossible de demander l\'accès à la caméra.');
      return false;
    } finally {
      setPermissionRequesting(false);
    }
  }, [requestPermission]);

  const startDetection = useCallback(async () => {
    console.log('Démarrage de la détection...');
    if (!permission?.granted) {
      console.log('Permission non accordée, demande...');
      const granted = await handleRequestPermission();
      if (!granted && !permission?.granted) {
        console.log('Permission toujours non accordée');
        return;
      }
    }

    if (!isCameraReady) {
      Alert.alert('Caméra non prête', 'Veuillez attendre que la caméra soit initialisée.');
      return;
    }

    setDetectionError(null);
    lastDetectionErrorRef.current = null;
    setIsDetecting(true);
    console.log('Détection démarrée');
  }, [handleRequestPermission, isCameraReady, permission?.granted]);

  const stopDetection = useCallback(() => {
    console.log('Arrêt de la détection');
    setIsDetecting(false);
    setIsProcessing(false);
    isProcessingRef.current = false;
    lastFrameSignatureRef.current = null;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (detectionAbortController.current) {
      detectionAbortController.current.abort();
      detectionAbortController.current = null;
    }
  }, []);

  const handleClose = () => {
    stopDetection();
    onClose();
  };

  const hasSignificantFrameChange = useCallback((previous: string | null, current: string | null) => {
    if (!current) {
      return false;
    }
    if (!previous) {
      return true;
    }

    const minLength = Math.min(previous.length, current.length);
    if (!minLength) {
      return true;
    }

    const step = Math.max(1, Math.floor(minLength / FRAME_SAMPLE_COUNT));
    let diff = 0;
    let samples = 0;
    for (let i = 0; i < minLength; i += step) {
      samples += 1;
      if (previous.charCodeAt(i) !== current.charCodeAt(i)) {
        diff += 1;
      }
      if (samples >= FRAME_SAMPLE_COUNT) {
        break;
      }
    }

    const ratio = samples ? diff / samples : 1;
    if (ratio >= MIN_FRAME_CHANGE_RATIO) {
      return true;
    }

    const lengthDelta = Math.abs(previous.length - current.length);
    const normalizedDelta = lengthDelta / Math.max(previous.length, current.length);
    return normalizedDelta >= MIN_FRAME_CHANGE_RATIO;
  }, []);

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
    if (!cameraRef.current || isProcessingRef.current || !isCameraReady) {
      console.log('Capture impossible:', { 
        hasCamera: !!cameraRef.current, 
        isProcessing: isProcessingRef.current,
        isCameraReady 
      });
      return;
    }

    console.log('Début capture et analyse...');
    setIsProcessing(true);
    isProcessingRef.current = true;

    const controller = new AbortController();
    if (detectionAbortController.current) {
      detectionAbortController.current.abort();
    }
    detectionAbortController.current = controller;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        base64: false,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        console.log('Photo sans URI');
        console.log('Pas de données base64');
        return;
      }

      const resized = await manipulateAsync(
        photo.uri,
        [{ resize: { width: MAX_RESIZED_WIDTH } }],
        {
          compress: 0.5,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );

      const frameBase64 = resized.base64 ?? null;

      console.log('Photo prise:', { hasBase64: !!frameBase64, width: resized.width, height: resized.height });

      if (!frameBase64) {
        console.log('Pas de données base64');
        return;
      }

      if (!hasSignificantFrameChange(lastFrameSignatureRef.current, frameBase64)) {
        console.log('Changement insuffisant détecté, envoi ignoré');
        return;
      }

      lastFrameSignatureRef.current = frameBase64;

      const remoteDetections = await detectDarts(frameBase64, { signal: controller.signal });
      console.log('Détections reçues:', remoteDetections.length);
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
      console.error('Erreur capture et analyse:', error);
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
  }, [convertDetections, hasSignificantFrameChange, isCameraReady, maxDarts, onDartDetected]);

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
    }, STREAM_INTERVAL_MS);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [captureAndAnalyze, isDetecting, maxDarts]);

  useEffect(() => {
    if (!visible) {
      autoStartAttemptedRef.current = false;
      return;
    }

    if (permission?.granted && isCameraReady && !isDetecting && !autoStartAttemptedRef.current) {
      autoStartAttemptedRef.current = true;
      startDetection();
    }
  }, [isCameraReady, isDetecting, permission?.granted, startDetection, visible]);

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

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!visible) return null;

  const renderPermissionContent = () => {
    if (!permission) {
      return (
        <View style={styles.permissionScreen}>
          <TouchableOpacity style={styles.roundButton} onPress={handleClose}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.permissionBody}>
            <ActivityIndicator size="large" color="#00FF41" />
            <Text style={styles.permissionText}>Chargement de la caméra...</Text>
          </View>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionScreen}>
          <View style={styles.permissionHeader}>
            <TouchableOpacity style={styles.roundButton} onPress={handleClose}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.permissionBody}>
            <Camera size={48} color="#666666" />
            <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
            <Text style={styles.permissionText}>
              Pour détecter automatiquement les fléchettes, nous avons besoin d'accéder à votre caméra.
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, permissionRequesting && styles.permissionButtonDisabled]}
              onPress={handleRequestPermission}
              disabled={permissionRequesting}
            >
              {permissionRequesting ? (
                <ActivityIndicator size="small" color="#0F0F0F" />
              ) : (
                <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  const permissionContent = renderPermissionContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {permissionContent ? (
          permissionContent
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              onCameraReady={() => {
                console.log('Caméra prête');
                setIsCameraReady(true);
              }}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                console.log('Layout caméra:', { width, height });
                setCameraLayout({ width, height });
              }}
            >
              <View
                style={[
                  styles.overlay,
                  {
                    paddingTop: Math.max(insets.top + 12, Platform.OS === 'ios' ? 32 : 20),
                    paddingBottom: insets.bottom + 24,
                  },
                ]}
                pointerEvents="box-none"
              >
                <View>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.roundButton} onPress={handleClose}>
                      <X size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                      <Target size={24} color="#00FF41" />
                      <Text style={styles.headerTitle}>Détection automatique</Text>
                    </View>

                    <View style={styles.headerActions}>
                      <View style={styles.modeBadge}>
                        <Text style={styles.modeBadgeText}>{gameMode}</Text>
                      </View>
                      <TouchableOpacity style={styles.roundButton} onPress={toggleCameraFacing}>
                        <RotateCcw size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.scoreBoard}>
                    <View
                      style={[
                        styles.scoreCard,
                        currentPlayerIndex === 1 && styles.activeScoreCard,
                      ]}
                    >
                      <Text style={styles.scoreCardName}>{player1.name}</Text>
                      <Text style={styles.scoreCardValue}>{player1.score}</Text>
                    </View>
                    <View
                      style={[
                        styles.scoreCard,
                        currentPlayerIndex === 2 && styles.activeScoreCard,
                      ]}
                    >
                      <Text style={styles.scoreCardName}>{player2.name}</Text>
                      <Text style={styles.scoreCardValue}>{player2.score}</Text>
                    </View>
                  </View>

                  <View style={styles.turnInfoRow}>
                    <Text style={styles.turnInfoText}>Tour de {currentPlayer}</Text>
                    <Text style={styles.turnInfoText}>
                      Fléchettes : {currentDartCount}/{maxDarts}
                    </Text>
                  </View>
                </View>

                <View style={styles.centerOverlay} pointerEvents="none">
                  <View style={styles.targetOverlay}>
                    <View style={styles.targetCircle}>
                      <View style={styles.targetCenter} />
                    </View>
                  </View>
                </View>

                <View style={styles.bottomSection} pointerEvents="box-none">
                  <View style={styles.bottomPanel}>
                    {isProcessing && (
                      <View style={styles.processingBanner}>
                        <ActivityIndicator size="small" color="#0F0F0F" />
                        <Text style={styles.processingText}>Analyse en cours...</Text>
                      </View>
                    )}

                    <View style={styles.detectedScoresContainer}>
                      <Text style={styles.detectedScoresTitle}>Scores détectés</Text>
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
                        Total : {detectedDarts.reduce((sum, dart) => sum + dart.score, 0)}
                      </Text>
                    </View>

                    <Text style={styles.instructionText}>
                      {!isDetecting
                        ? "Appuyez sur 'Démarrer' pour lancer la détection"
                        : 'Lancez vos fléchettes, le score se mettra à jour automatiquement.'}
                    </Text>

                    {detectionError && (
                      <Text style={styles.errorText}>{detectionError}</Text>
                    )}

                    <View style={styles.controlsRow}>
                      {!isDetecting ? (
                        <TouchableOpacity
                          style={[
                            styles.startButton,
                            (!isCameraReady || !permission?.granted) && styles.startButtonDisabled,
                          ]}
                          onPress={startDetection}
                          disabled={!isCameraReady || !permission?.granted}
                        >
                          <Play size={20} color="#0F0F0F" />
                          <Text style={styles.startButtonText}>
                            {!permission?.granted
                              ? 'Autorisation requise'
                              : !isCameraReady
                                ? 'Caméra en cours...'
                                : 'Démarrer la détection'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.stopButton} onPress={stopDetection}>
                          <Pause size={20} color="#FFFFFF" />
                          <Text style={styles.stopButtonText}>Arrêter</Text>
                        </TouchableOpacity>
                      )}
                    </View>

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
              </View>

              {detectedDarts.map((dart, index) => (
                <View
                  key={index}
                  style={[
                    styles.dartMarker,
                    {
                      left: dart.x,
                      top: dart.y,
                    },
                  ]}
                >
                  <View style={styles.dartDot} />
                  <Text style={styles.dartScore}>{dart.score}</Text>
                </View>
              ))}

              {!isCameraReady && (
                <View style={styles.cameraNotReadyOverlay}>
                  <ActivityIndicator size="large" color="#00FF41" />
                  <Text style={styles.cameraNotReadyText}>Initialisation de la caméra...</Text>
                </View>
              )}
            </CameraView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  permissionScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  permissionHeader: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  permissionBody: {
    alignItems: 'center',
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionText: {
    color: '#CCCCCC',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    color: '#0F0F0F',
    fontWeight: '600',
  },
  roundButton: {
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cameraWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeBadge: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  scoreBoard: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.7)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  activeScoreCard: {
    borderColor: '#00FF41',
    shadowColor: '#00FF41',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  scoreCardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCardValue: {
    color: '#00FF41',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  turnInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  turnInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  centerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: '#00FF41',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.15)',
  },
  targetCenter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0041',
  },
  bottomSection: {
    width: '100%',
  },
  bottomPanel: {
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00FF41',
    borderRadius: 12,
    paddingVertical: 8,
  },
  processingText: {
    color: '#0F0F0F',
    fontWeight: 'bold',
  },
  detectedScoresContainer: {
    gap: 12,
  },
  detectedScoresTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoresList: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  emptyScore: {
    opacity: 0.4,
  },
  emptyScoreText: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '600',
  },
  scoreValue: {
    color: '#00FF41',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreSector: {
    color: '#9E9E9E',
    fontSize: 12,
    textAlign: 'center',
  },
  totalScore: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionText: {
    color: '#CCCCCC',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorText: {
    color: '#FF4D4F',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00FF41',
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#0F0F0F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 0, 65, 0.85)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#00FF41',
  },
  completeButtonText: {
    color: '#0F0F0F',
  },
  dartMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  dartDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF0041',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dartScore: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cameraNotReadyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cameraNotReadyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
