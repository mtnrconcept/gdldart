import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TournamentBracketComponent } from '@/components/TournamentBracket';
import { ScoreInputModal } from '@/components/ScoreInputModal';
import { AutomaticScoring } from '@/components/AutomaticScoring';
import { TournamentBracket, Match, Player } from '@/types/tournament';
import { TournamentGenerator } from '@/utils/tournamentGenerator';

// Mock data pour la démonstration
const mockPlayers: Player[] = [
  { id: '1', name: 'Jean Dupont', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '2', name: 'Marie Martin', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '3', name: 'Pierre Lucas', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '4', name: 'Sophie Blanc', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '5', name: 'Thomas Noir', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '6', name: 'Emma Vert', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '7', name: 'Lucas Rouge', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '8', name: 'Léa Bleu', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '9', name: 'Alain Moreau', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '10', name: 'Selina Kyle', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '11', name: 'Tony Stark', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '12', name: 'Clark Kent', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '13', name: 'Matt Murdock', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '14', name: 'Anne Hathaway', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '15', name: 'Sam Wilson', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150' },
  { id: '16', name: 'Sarah Connor', avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150' },
];

export default function TournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showAutoScoring, setShowAutoScoring] = useState(false);

  useEffect(() => {
    // Simuler le chargement du tournoi
    if (id) {
      // Pour la démo, on génère un tournoi de double élimination avec 16 joueurs
      const format = 'double_elimination';
      const selectedPlayers = mockPlayers; // Tous les 16 joueurs
      
      let generatedBracket: TournamentBracket;
      
      generatedBracket = TournamentGenerator.generateDoubleElimination(selectedPlayers, id);
      
      setBracket(generatedBracket);
    }
  }, [id]);

  const handleMatchPress = (match: Match) => {
    if (!match.player1 || !match.player2) {
      Alert.alert('Match non disponible', 'Ce match n\'est pas encore prêt');
      return;
    }

    if (match.status === 'completed') {
      Alert.alert('Match terminé', `Vainqueur: ${match.winner?.name}\nScore: ${match.score?.player1Score} - ${match.score?.player2Score}`);
      return;
    }

    setSelectedMatch(match);
    setShowScoreModal(true);
  };

  const handleScoreSubmit = (winner: Player, score: { player1Score: number; player2Score: number }) => {
    if (!bracket || !selectedMatch) return;

    const updatedBracket = TournamentGenerator.updateMatchResult(
      bracket,
      selectedMatch.id,
      winner,
      score
    );

    setBracket(updatedBracket);
    setShowScoreModal(false);
    setSelectedMatch(null);

    // Notifications pour la progression du tournoi
    if (updatedBracket.status === 'completed' && updatedBracket.winner) {
      Alert.alert(
        'Tournoi terminé !',
        `Félicitations à ${updatedBracket.winner.name} pour sa victoire !`,
        [{ text: 'OK' }]
      );
    } else if (updatedBracket.currentRound > bracket.currentRound) {
      // Nouvelle manche commencée
      const roundName = updatedBracket.currentRound === updatedBracket.totalRounds ? 'Finale' :
                       updatedBracket.currentRound === updatedBracket.totalRounds - 1 ? 'Demi-finales' :
                       `Tour ${updatedBracket.currentRound}`;
      
      Alert.alert(
        'Nouvelle manche !',
        `Tous les matchs de la manche précédente sont terminés. ${roundName} commence maintenant !`,
        [{ text: 'Continuer' }]
      );
    }
  };

  if (!bracket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          {/* Ici on pourrait ajouter un spinner de chargement */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TournamentBracketComponent
        bracket={bracket}
        onMatchPress={handleMatchPress}
        isAdmin={true} // Pour la démo, on considère l'utilisateur comme admin
      />

      {selectedMatch && (
        <ScoreInputModal
          visible={showScoreModal}
          match={selectedMatch}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedMatch(null);
          }}
          onSubmit={handleScoreSubmit}
          onOpenAutoScoring={() => setShowAutoScoring(true)}
        />
      )}

      {selectedMatch && (
        <AutomaticScoring
          visible={showAutoScoring}
          match={selectedMatch}
          onClose={() => {
            setShowAutoScoring(false);
            setSelectedMatch(null);
          }}
          onSubmit={handleScoreSubmit}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingBottom: 80, // Espace pour la barre de navigation
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});