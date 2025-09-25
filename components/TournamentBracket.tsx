import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { TournamentBracket, Round, Match, Player } from '@/types/tournament';
import { TournamentGenerator } from '@/utils/tournamentGenerator';
import { TournamentRanking } from './TournamentRanking';
import { Trophy, Users, Target, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

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

  const canPlayMatch = () => {
    return match.player1 && match.player2 && match.status !== 'completed';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.matchCard, 
        { borderColor: getMatchStatusColor() },
        !canPlayMatch() && !isAdmin && styles.disabledMatch
      ]} 
      onPress={onPress}
      disabled={!isAdmin && !canPlayMatch()}
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
            <Trophy size={14} color="#0F0F0F" />
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
            <Trophy size={14} color="#0F0F0F" />
          )}
        </View>
      </View>

      {isAdmin && canPlayMatch() && (
        <View style={styles.adminActions}>
          <Text style={styles.adminHint}>Appuyez pour saisir le résultat</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const RoundTab: React.FC<{
  round: Round;
  isActive: boolean;
  onPress: () => void;
}> = ({ round, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.roundTab, isActive && styles.activeRoundTab]}
    onPress={onPress}
  >
    <Text style={[styles.roundTabText, isActive && styles.activeRoundTabText]}>
      {round.name}
    </Text>
    <View style={[
      styles.roundTabIndicator,
      { backgroundColor: round.isCompleted ? '#00FF41' : '#666666' }
    ]}>
      <Text style={styles.roundTabCount}>{round.matches.length}</Text>
    </View>
  </TouchableOpacity>
);

export const TournamentBracketComponent: React.FC<TournamentBracketProps> = ({ 
  bracket, 
  onMatchPress, 
  isAdmin = false 
}) => {
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const rounds = TournamentGenerator.getRounds(bracket);

  // Si le tournoi est terminé, afficher le classement
  if (bracket.status === 'completed') {
    return <TournamentRanking bracket={bracket} />;
  }

  const activeRound = rounds[activeRoundIndex];

  const navigateToRound = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeRoundIndex > 0) {
      setActiveRoundIndex(activeRoundIndex - 1);
    } else if (direction === 'next' && activeRoundIndex < rounds.length - 1) {
      setActiveRoundIndex(activeRoundIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header fixe */}
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
            <Trophy size={20} color="#FFD700" />
            <Text style={styles.winnerText}>Vainqueur</Text>
            <Text style={styles.winnerName}>{bracket.winner.name}</Text>
          </View>
        )}
      </View>

      {/* Indicateur de progression pour single elimination */}
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

      {/* Navigation par onglets */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {rounds.map((round, index) => (
            <RoundTab
              key={`${round.number}-${round.name}`}
              round={round}
              isActive={index === activeRoundIndex}
              onPress={() => setActiveRoundIndex(index)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Navigation avec flèches */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, activeRoundIndex === 0 && styles.navButtonDisabled]}
          onPress={() => navigateToRound('prev')}
          disabled={activeRoundIndex === 0}
        >
          <ChevronLeft size={20} color={activeRoundIndex === 0 ? '#333333' : '#FFFFFF'} />
          <Text style={[styles.navButtonText, activeRoundIndex === 0 && styles.navButtonTextDisabled]}>
            Précédent
          </Text>
        </TouchableOpacity>

        <View style={styles.roundIndicator}>
          <Text style={styles.roundIndicatorText}>
            {activeRoundIndex + 1} / {rounds.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, activeRoundIndex === rounds.length - 1 && styles.navButtonDisabled]}
          onPress={() => navigateToRound('next')}
          disabled={activeRoundIndex === rounds.length - 1}
        >
          <Text style={[styles.navButtonText, activeRoundIndex === rounds.length - 1 && styles.navButtonTextDisabled]}>
            Suivant
          </Text>
          <ChevronRight size={20} color={activeRoundIndex === rounds.length - 1 ? '#333333' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Contenu de la manche active */}
      <ScrollView style={styles.roundContent} showsVerticalScrollIndicator={false}>
        {activeRound && (
          <View style={styles.roundContainer}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundTitle}>{activeRound.name}</Text>
              <View style={[
                styles.roundStatus,
                { backgroundColor: activeRound.isCompleted ? '#00FF41' : '#666666' }
              ]}>
                <Text style={[
                  styles.roundStatusText,
                  { color: activeRound.isCompleted ? '#0F0F0F' : '#FFFFFF' }
                ]}>
                  {activeRound.isCompleted ? 'Terminé' : 'En cours'}
                </Text>
              </View>
            </View>

            <View style={styles.matchesGrid}>
              {activeRound.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onPress={() => onMatchPress(match)}
                  isAdmin={isAdmin}
                />
              ))}
            </View>

            {activeRound.matches.length === 0 && (
              <View style={styles.emptyRound}>
                <Text style={styles.emptyRoundText}>Aucun match dans cette manche</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    backgroundColor: '#0F0F0F',
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
  progressContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#0F0F0F',
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
  tabsContainer: {
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  tabsScroll: {
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  roundTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minWidth: 120,
  },
  activeRoundTab: {
    backgroundColor: '#00FF41',
    borderColor: '#00FF41',
  },
  roundTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  activeRoundTabText: {
    color: '#0F0F0F',
  },
  roundTabIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  roundTabCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  navButtonDisabled: {
    backgroundColor: '#1A1A1A',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButtonTextDisabled: {
    color: '#333333',
  },
  roundIndicator: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roundIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  roundContent: {
    flex: 1,
    paddingBottom: 100, // Espace pour la barre de navigation
  },
  roundContainer: {
    padding: 20,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  roundStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roundStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchesGrid: {
    gap: 16,
  },
  matchCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  disabledMatch: {
    opacity: 0.6,
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
    paddingVertical: 10,
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
    flex: 1,
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
  emptyRound: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyRoundText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
});