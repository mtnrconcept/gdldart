import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Match, Player } from '@/types/tournament';
import { X, Target } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AutomaticScoringProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
  onSubmit: (winner: Player, score: { player1Score: number; player2Score: number }) => void;
}

export const AutomaticScoring: React.FC<AutomaticScoringProps> = ({
  visible,
  match,
  onClose,
  onSubmit,
}) => {
  const [player1Score, setPlayer1Score] = useState(501);
  const [player2Score, setPlayer2Score] = useState(501);

  const handleSubmit = () => {
    const winner = player1Score < player2Score ? match.player1 : match.player2;
    onSubmit(winner, {
      player1Score: 501 - player1Score,
      player2Score: 501 - player2Score,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comptage Automatique</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.playersContainer}>
        <View style={styles.playerCard}>
          <Text style={styles.playerName}>{match.player1?.name || 'Joueur 1'}</Text>
          <Text style={styles.score}>{player1Score}</Text>
        </View>

        <View style={styles.vsContainer}>
          <Target size={32} color="#00FF41" />
          <Text style={styles.vsText}>VS</Text>
        </View>

        <View style={styles.playerCard}>
          <Text style={styles.playerName}>{match.player2?.name || 'Joueur 2'}</Text>
          <Text style={styles.score}>{player2Score}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.info}>
          Utilisez les boutons pour enregistrer les scores de chaque tour.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Terminer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  playerCard: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00FF41',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  info: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#00FF41',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});
