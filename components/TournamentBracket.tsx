import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TournamentBracket, Round, Match, Player } from '@/types/tournament';
import { TournamentGenerator } from '@/utils/tournamentGenerator';
import { TournamentRanking } from './TournamentRanking';
import { Trophy, Users, Target } from 'lucide-react-native';

interface TournamentBracketProps {
  bracket: TournamentBracket;
  onMatchPress: (match: Match) => void;
  isAdmin?: boolean;
}

interface MatchCardProps {
  match: Match;
  onPress: () => void;
  isAdmin?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onPress, isAdmin }) => {
  const getMatchStatusColor = () => {
    switch (match.status) {
      case 'completed': return '#00FF41';
      case 'in_progress': return '#FF0041';
      default: return '#666666';
    }
  };

  const getMatchStatusText = () => {
    switch (match.status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      default: return 'À venir';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.matchCard, { borderColor: getMatchStatusColor() }]} 
      onPress={onPress}
      disabled={!isAdmin && match.status === 'pending'}
    >
      <View style={styles.matchHeader}>
        <Text style={[styles.matchStatus, { color: getMatchStatusColor() }]}>
          {getMatchStatusText()}
        </Text>
        {match.score && (
          <Text style={styles.matchScore}>
            {match.score.player1Score} - {match.score.player2Score}
          </Text>
        )}
      </View>

      <View style={styles.playersContainer}>
        <View style={[
          styles.playerRow, 
          match.winner?.id === match.player1?.id && styles.winnerRow
        ]}>
          <Text style={[
            styles.playerName,
            match.winner?.id === match.player1?.id && styles.winnerText,
            !match.player1 && styles.placeholderText
          ]}>
            {match.player1?.name || 'En attente...'}
          </Text>
          {match.winner?.id === match.player1?.id && (
            <Trophy size={16} color="#FFD700" />
          )}
        </View>

        <View style={styles.divider} />

        <View style={[
          styles.playerRow, 
          match.winner?.id === match.player2?.id && styles.winnerRow
        ]}>
          <Text style={[
            styles.playerName,
            match.winner?.id === match.player2?.id && styles.winnerText,
            !match.player2 && styles.placeholderText
          ]}>
            {match.player2?.name || 'En attente...'}
          </Text>
          {match.winner?.id === match.player2?.id && (
            <Trophy size={16} color="#FFD700" />
          )}
        </View>
      </View>

      {isAdmin && match.player1 && match.player2 && match.status !== 'completed' && (
        <View style={styles.adminActions}>
          <Text style={styles.adminHint}>Appuyez pour saisir le résultat</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const RoundView: React.FC<{ round: Round; onMatchPress: (match: Match) => void; isAdmin?: boolean }> = ({ 
  round, 
  onMatchPress, 
  isAdmin 
}) => (
  <View style={styles.roundContainer}>
    <View style={styles.roundHeader}>
      <Text style={styles.roundTitle}>{round.name}</Text>
      <View style={[
        styles.roundStatus,
        { backgroundColor: round.isCompleted ? '#00FF41' : '#666666' }
      ]}>
        <Text style={[
          styles.roundStatusText,
          { color: round.isCompleted ? '#0F0F0F' : '#FFFFFF' }
        ]}>
          {round.isCompleted ? 'Terminé' : 'En cours'}
        </Text>
      </View>
    </View>

    <View style={styles.matchesGrid}>
      {round.matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onPress={() => onMatchPress(match)}
          isAdmin={isAdmin}
        />
      ))}
    </View>
  </View>
);

export const TournamentBracketComponent: React.FC<TournamentBracketProps> = ({ 
  bracket, 
  onMatchPress, 
  isAdmin = false 
}) => {
  const rounds = TournamentGenerator.getRounds(bracket);

  // Si le tournoi est terminé, afficher le classement
  if (bracket.status === 'completed') {
    return <TournamentRanking bracket={bracket} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentTitle}>{bracket.name}</Text>
          <View style={styles.tournamentMeta}>
            <View style={styles.metaItem}>
              <Users size={16} color="#00FF41" />
              <Text style={styles.metaText}>{bracket.players.length} joueurs</Text>
            </View>
            <View style={styles.metaItem}>
              <Target size={16} color="#FF0041" />
              <Text style={styles.metaText}>
                {bracket.format === 'round_robin' ? 'Round Robin' : 
                 bracket.format === 'double_elimination' ? 'Double Élimination' :
                 `Tour ${bracket.currentRound}/${bracket.totalRounds}`}
              </Text>
            </View>
          </View>
        </View>

        {bracket.winner && (
          <View style={styles.winnerContainer}>
            <Trophy size={24} color="#FFD700" />
            <Text style={styles.winnerText}>Vainqueur</Text>
            <Text style={styles.winnerName}>{bracket.winner.name}</Text>
          </View>
        )}
      </View>

      {/* Indicateur de progression */}
      {bracket.format === 'single_elimination' && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Progression du tournoi</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(bracket.currentRound / bracket.totalRounds) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Manche {bracket.currentRound} sur {bracket.totalRounds}
          </Text>
        </View>
      )}

      {bracket.format === 'double_elimination' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roundsScroll}>
          <View style={styles.doubleEliminationContainer}>
            {rounds.map((round) => (
              <RoundView
                key={`${round.number}-${round.name}`}
                round={round}
                onMatchPress={onMatchPress}
                isAdmin={isAdmin}
              />
            ))}
          </View>
        </ScrollView>
      ) : bracket.format === 'round_robin' ? (
        <View style={styles.roundRobinContainer}>
          <Text style={styles.sectionTitle}>Tous les matchs</Text>
          <View style={styles.matchesGrid}>
            {bracket.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => onMatchPress(match)}
                isAdmin={isAdmin}
              />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roundsScroll}>
          <View style={styles.roundsContainer}>
            {rounds.map((round) => (
              <RoundView
                key={round.number}
                round={round}
                onMatchPress={onMatchPress}
                isAdmin={isAdmin}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  tournamentInfo: {
    marginBottom: 16,
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tournamentMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
  },
  winnerContainer: {
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  winnerText: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 20,
    paddingBottom: 16,
  },
  roundRobinContainer: {
    flex: 1,
  },
  roundsScroll: {
    flex: 1,
  },
  roundsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  doubleEliminationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 600,
  },
  roundContainer: {
    marginRight: 20,
    minWidth: 280,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 20,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  roundStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roundStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchesGrid: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playersContainer: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  winnerRow: {
    backgroundColor: '#00FF41',
  },
  playerName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  winnerText: {
    color: '#0F0F0F',
    fontWeight: 'bold',
  },
  placeholderText: {
    color: '#666666',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 4,
  },
  adminActions: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#00FF41',
    borderRadius: 8,
    alignItems: 'center',
  },
  adminHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F0F0F',
  },
  progressContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF41',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});