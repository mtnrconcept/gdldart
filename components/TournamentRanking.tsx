import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { TournamentBracket, Player } from '@/types/tournament';
import { TournamentGenerator } from '@/utils/tournamentGenerator';
import { Trophy, Medal, Award, Crown } from 'lucide-react-native';

interface TournamentRankingProps {
  bracket: TournamentBracket;
}

export const TournamentRanking: React.FC<TournamentRankingProps> = ({ bracket }) => {
  const ranking = TournamentGenerator.generateFinalRanking(bracket);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return <Trophy size={24} color="#666666" />;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#666666';
    }
  };

  const getPlayerStats = (player: Player) => {
    let wins = 0;
    let losses = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    bracket.matches.forEach(match => {
      if (match.status === 'completed' && match.score) {
        if (match.player1?.id === player.id) {
          pointsFor += match.score.player1Score;
          pointsAgainst += match.score.player2Score;
          if (match.winner?.id === player.id) {
            wins++;
          } else {
            losses++;
          }
        } else if (match.player2?.id === player.id) {
          pointsFor += match.score.player2Score;
          pointsAgainst += match.score.player1Score;
          if (match.winner?.id === player.id) {
            wins++;
          } else {
            losses++;
          }
        }
      }
    });

    return { wins, losses, pointsFor, pointsAgainst };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Trophy size={28} color="#FFD700" />
        <Text style={styles.title}>Classement Final</Text>
      </View>

      <ScrollView style={styles.rankingList} showsVerticalScrollIndicator={false}>
        {ranking.map((player, index) => {
          const position = index + 1;
          const stats = getPlayerStats(player);
          const winRate = stats.wins + stats.losses > 0 ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0;

          return (
            <View key={player.id} style={[
              styles.playerCard,
              position <= 3 && styles.podiumCard,
              { borderColor: getRankColor(position) }
            ]}>
              <View style={styles.playerHeader}>
                <View style={styles.rankSection}>
                  <View style={[styles.rankBadge, { backgroundColor: getRankColor(position) + '20' }]}>
                    <Text style={[styles.rankNumber, { color: getRankColor(position) }]}>
                      #{position}
                    </Text>
                  </View>
                  {getRankIcon(position)}
                </View>

                <View style={styles.playerInfo}>
                  <Image source={{ uri: player.avatar }} style={styles.avatar} />
                  <View style={styles.playerDetails}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {position === 1 && (
                      <Text style={styles.championLabel}>🏆 Champion</Text>
                    )}
                    {position === 2 && (
                      <Text style={styles.runnerUpLabel}>🥈 Finaliste</Text>
                    )}
                    {position === 3 && (
                      <Text style={styles.thirdPlaceLabel}>🥉 3ème place</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.wins}</Text>
                  <Text style={styles.statLabel}>Victoires</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.losses}</Text>
                  <Text style={styles.statLabel}>Défaites</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{winRate}%</Text>
                  <Text style={styles.statLabel}>Taux</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.pointsFor - stats.pointsAgainst > 0 ? '+' : ''}{stats.pointsFor - stats.pointsAgainst}
                  </Text>
                  <Text style={styles.statLabel}>Diff.</Text>
                </View>
              </View>

              {position <= 3 && (
                <View style={styles.podiumHighlight}>
                  <Text style={[styles.podiumText, { color: getRankColor(position) }]}>
                    {position === 1 ? 'VAINQUEUR' : position === 2 ? 'FINALISTE' : 'PODIUM'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankingList: {
    flex: 1,
    padding: 20,
  },
  playerCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  podiumCard: {
    backgroundColor: '#1A1A1A',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  championLabel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  runnerUpLabel: {
    fontSize: 14,
    color: '#C0C0C0',
    fontWeight: '600',
  },
  thirdPlaceLabel: {
    fontSize: 14,
    color: '#CD7F32',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  podiumHighlight: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  podiumText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});