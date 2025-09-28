import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Match, Player } from '@/types/tournament';
import { Trophy, Target, Calculator } from 'lucide-react-native';

interface ScoreInputModalProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
  onSubmit: (winner: Player, score: { player1Score: number; player2Score: number }) => void;
  onOpenAutoScoring: () => void;
}

export const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  visible,
  match,
  onClose,
  onSubmit,
  onOpenAutoScoring,
}) => {
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');

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
    onClose();
  };

  if (!match.player1 || !match.player2) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Target size={24} color="#00FF41" style={styles.headerIcon} />
            <Text style={styles.title}>Saisir le résultat</Text>
          </View>

          <View style={styles.modeSelection}>
            <TouchableOpacity
              style={styles.autoScoringButton}
              onPress={() => {
                handleClose();
                onOpenAutoScoring();
              }}
            >
              <Calculator size={20} color="#0F0F0F" style={styles.autoScoringIcon} />
              <Text style={styles.autoScoringButtonText}>Comptage Automatique</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>
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

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Trophy size={16} color="#0F0F0F" style={styles.submitButtonIcon} />
              <Text style={styles.submitButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    marginBottom: 20,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modeSelection: {
    marginBottom: 20,
  },
  autoScoringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF41',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  autoScoringIcon: {
    marginRight: 8,
  },
  autoScoringButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  dividerText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    marginHorizontal: 12,
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
  actions: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 6,
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
    marginLeft: 6,
  },
  submitButtonIcon: {
    marginRight: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});