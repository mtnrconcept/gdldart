import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera } from 'lucide-react-native';

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
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.messageContainer}>
            <Camera size={64} color="#666666" />
            <Text style={styles.title}>Détection caméra non disponible</Text>
            <Text style={styles.message}>
              La détection automatique par caméra n'est disponible que sur les appareils mobiles.
              {'\n\n'}
              Utilisez les boutons de score manuels pour enregistrer vos lancers.
            </Text>
          </View>

          <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: '#1F1F1F',
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButtonBottom: {
    backgroundColor: '#00FF41',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});
