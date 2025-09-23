import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Target, TrendingUp, Calendar, Medal, Crown, CreditCard as Edit, Settings, ChartBar as BarChart3, Award } from 'lucide-react-native';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: 'trophy' | 'target' | 'medal' | 'crown';
  earned: boolean;
  earnedDate?: string;
}

interface Match {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  date: string;
  tournament: string;
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'Premier Tournoi',
    description: 'Participer à votre premier tournoi',
    icon: 'trophy',
    earned: true,
    earnedDate: '2024-12-15',
  },
  {
    id: '2',
    name: 'Maître des 180',
    description: 'Réaliser 50 scores de 180',
    icon: 'target',
    earned: true,
    earnedDate: '2024-12-20',
  },
  {
    id: '3',
    name: 'Champion',
    description: 'Remporter un tournoi',
    icon: 'crown',
    earned: false,
  },
  {
    id: '4',
    name: 'Série de Victoires',
    description: 'Gagner 5 matchs consécutifs',
    icon: 'medal',
    earned: true,
    earnedDate: '2025-01-10',
  },
];

const mockMatches: Match[] = [
  {
    id: '1',
    opponent: 'Jean Dupont',
    result: 'win',
    score: '3-1',
    date: '2025-01-15',
    tournament: 'Championnat National',
  },
  {
    id: '2',
    opponent: 'Marie Martin',
    result: 'loss',
    score: '1-3',
    date: '2025-01-12',
    tournament: 'Masters Local',
  },
  {
    id: '3',
    opponent: 'Pierre Lucas',
    result: 'win',
    score: '3-2',
    date: '2025-01-10',
    tournament: 'Coupe Amateur',
  },
];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');

  const userStats = {
    name: 'Votre Nom',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    rank: 25,
    points: 1850,
    averageScore: 75.8,
    tournaments: 12,
    wins: 8,
    losses: 4,
    best180s: 23,
    winRate: 67,
    totalGames: 45,
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'trophy':
        return <Trophy size={24} color="#FFD700" />;
      case 'target':
        return <Target size={24} color="#FF0041" />;
      case 'crown':
        return <Crown size={24} color="#FFD700" />;
      case 'medal':
        return <Medal size={24} color="#00FF41" />;
      default:
        return <Award size={24} color="#666666" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image source={{ uri: userStats.avatar }} style={styles.avatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userStats.name}</Text>
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>#{userStats.rank}</Text>
                <Text style={styles.pointsText}>{userStats.points} pts</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Edit size={20} color="#00FF41" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Settings size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.overviewCard}>
            <Trophy size={20} color="#FFD700" />
            <Text style={styles.overviewValue}>{userStats.wins}</Text>
            <Text style={styles.overviewLabel}>Victoires</Text>
          </View>
          <View style={styles.overviewCard}>
            <Target size={20} color="#00FF41" />
            <Text style={styles.overviewValue}>{userStats.averageScore}</Text>
            <Text style={styles.overviewLabel}>Moyenne</Text>
          </View>
          <View style={styles.overviewCard}>
            <TrendingUp size={20} color="#FF0041" />
            <Text style={styles.overviewValue}>{userStats.winRate}%</Text>
            <Text style={styles.overviewLabel}>Taux</Text>
          </View>
          <View style={styles.overviewCard}>
            <Medal size={20} color="#00FF41" />
            <Text style={styles.overviewValue}>{userStats.best180s}</Text>
            <Text style={styles.overviewLabel}>180s</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <BarChart3 size={16} color={activeTab === 'stats' ? '#00FF41' : '#666666'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
              Statistiques
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Award size={16} color={activeTab === 'achievements' ? '#00FF41' : '#666666'} />
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              Trophées
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Calendar size={16} color={activeTab === 'history' ? '#00FF41' : '#666666'} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Historique
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'stats' && (
            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Performance Générale</Text>
                <View style={styles.statGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.tournaments}</Text>
                    <Text style={styles.statLabel}>Tournois</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.totalGames}</Text>
                    <Text style={styles.statLabel}>Matchs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.wins}</Text>
                    <Text style={styles.statLabel}>Victoires</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userStats.losses}</Text>
                    <Text style={styles.statLabel}>Défaites</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Scores</Text>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Score Moyen</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(userStats.averageScore / 100) * 100}%` }]} />
                  </View>
                  <Text style={styles.progressValue}>{userStats.averageScore}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Taux de Victoire</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${userStats.winRate}%` }]} />
                  </View>
                  <Text style={styles.progressValue}>{userStats.winRate}%</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'achievements' && (
            <View style={styles.achievementsSection}>
              {mockAchievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !achievement.earned && styles.lockedAchievement
                  ]}
                >
                  <View style={styles.achievementIcon}>
                    {getAchievementIcon(achievement.icon)}
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={[
                      styles.achievementName,
                      !achievement.earned && styles.lockedText
                    ]}>
                      {achievement.name}
                    </Text>
                    <Text style={[
                      styles.achievementDescription,
                      !achievement.earned && styles.lockedText
                    ]}>
                      {achievement.description}
                    </Text>
                    {achievement.earned && achievement.earnedDate && (
                      <Text style={styles.achievementDate}>
                        Obtenu le {new Date(achievement.earnedDate).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                  </View>
                  {achievement.earned && (
                    <View style={styles.earnedBadge}>
                      <Text style={styles.earnedText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.historySection}>
              {mockMatches.map((match) => (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <View style={styles.matchInfo}>
                      <Text style={styles.opponentName}>{match.opponent}</Text>
                      <Text style={styles.tournamentName}>{match.tournament}</Text>
                    </View>
                    <View style={styles.matchResult}>
                      <Text style={[
                        styles.resultText,
                        { color: match.result === 'win' ? '#00FF41' : '#FF0041' }
                      ]}>
                        {match.result === 'win' ? 'VICTOIRE' : 'DÉFAITE'}
                      </Text>
                      <Text style={styles.scoreText}>{match.score}</Text>
                    </View>
                  </View>
                  <Text style={styles.matchDate}>
                    {new Date(match.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#00FF41',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pointsText: {
    fontSize: 16,
    color: '#00FF41',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#1F1F1F',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statsOverview: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666666',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  activeTab: {
    backgroundColor: '#00FF41',
    borderColor: '#00FF41',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#0F0F0F',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsSection: {
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF41',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  progressItem: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF41',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  achievementsSection: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIcon: {
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#00FF41',
  },
  lockedText: {
    color: '#444444',
  },
  earnedBadge: {
    backgroundColor: '#00FF41',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedText: {
    color: '#0F0F0F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historySection: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  matchInfo: {
    flex: 1,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tournamentName: {
    fontSize: 14,
    color: '#666666',
  },
  matchResult: {
    alignItems: 'flex-end',
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  matchDate: {
    fontSize: 12,
    color: '#666666',
  },
});