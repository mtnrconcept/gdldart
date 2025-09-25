import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Trophy, Target, TrendingUp, Medal, Crown } from 'lucide-react-native';
import { ScoringButton } from '@/components/ScoringButton';

interface Player {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  points: number;
  averageScore: number;
  tournaments: number;
  wins: number;
  best180s: number;
  winRate: number;
  badges: string[];
}

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    rank: 1,
    points: 2850,
    averageScore: 85.3,
    tournaments: 24,
    wins: 18,
    best180s: 45,
    winRate: 75,
    badges: ['champion', 'consistent', '180_master'],
  },
  {
    id: '2',
    name: 'Marie Martin',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    rank: 2,
    points: 2720,
    averageScore: 82.7,
    tournaments: 22,
    wins: 15,
    best180s: 38,
    winRate: 68,
    badges: ['rising_star', 'tournament_winner'],
  },
  {
    id: '3',
    name: 'Pierre Lucas',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    rank: 3,
    points: 2650,
    averageScore: 81.2,
    tournaments: 28,
    wins: 16,
    best180s: 42,
    winRate: 57,
    badges: ['veteran', 'fair_play'],
  },
  {
    id: '4',
    name: 'Sophie Blanc',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
    rank: 4,
    points: 2580,
    averageScore: 79.8,
    tournaments: 19,
    wins: 12,
    best180s: 32,
    winRate: 63,
    badges: ['newcomer', 'most_improved'],
  },
];

export default function PlayersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'points' | 'winRate'>('rank');
  const [showAutoScoring, setShowAutoScoring] = useState(false);

  const filteredPlayers = mockPlayers
    .filter((player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points;
        case 'winRate':
          return b.winRate - a.winRate;
        default:
          return a.rank - b.rank;
      }
    });

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'champion':
        return <Crown size={16} color="#FFD700" />;
      case 'tournament_winner':
        return <Trophy size={16} color="#00FF41" />;
      case '180_master':
        return <Target size={16} color="#FF0041" />;
      default:
        return <Medal size={16} color="#666666" />;
    }
  };

  const getBadgeName = (badge: string) => {
    switch (badge) {
      case 'champion':
        return 'Champion';
      case 'consistent':
        return 'Régulier';
      case '180_master':
        return 'Maître 180';
      case 'rising_star':
        return 'Étoile Montante';
      case 'tournament_winner':
        return 'Vainqueur';
      case 'veteran':
        return 'Vétéran';
      case 'fair_play':
        return 'Fair Play';
      case 'newcomer':
        return 'Nouveau';
      case 'most_improved':
        return 'Plus Progressif';
      default:
        return badge;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#666666';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Classement des Joueurs</Text>
            <Text style={styles.subtitle}>Découvrez les meilleurs joueurs</Text>
          </View>
          <ScoringButton onPress={() => setShowAutoScoring(true)} />
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'rank' && styles.activeSortButton]}
            onPress={() => setSortBy('rank')}
          >
            <Text style={[styles.sortText, sortBy === 'rank' && styles.activeSortText]}>
              Classement
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'points' && styles.activeSortButton]}
            onPress={() => setSortBy('points')}
          >
            <Text style={[styles.sortText, sortBy === 'points' && styles.activeSortText]}>
              Points
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'winRate' && styles.activeSortButton]}
            onPress={() => setSortBy('winRate')}
          >
            <Text style={[styles.sortText, sortBy === 'winRate' && styles.activeSortText]}>
              % Victoires
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
        {filteredPlayers.map((player) => (
          <TouchableOpacity key={player.id} style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <View style={styles.playerInfo}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(player.rank) + '20' }]}>
                  <Text style={[styles.rankText, { color: getRankColor(player.rank) }]}>
                    #{player.rank}
                  </Text>
                </View>
                <Image source={{ uri: player.avatar }} style={styles.avatar} />
                <View style={styles.nameContainer}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={styles.badgesContainer}>
                    {player.badges.slice(0, 2).map((badge, index) => (
                      <View key={index} style={styles.badge}>
                        {getBadgeIcon(badge)}
                        <Text style={styles.badgeText}>{getBadgeName(badge)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>{player.points}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Target size={16} color="#00FF41" />
                <Text style={styles.statValue}>{player.averageScore}</Text>
                <Text style={styles.statLabel}>Moyenne</Text>
              </View>
              <View style={styles.statItem}>
                <Trophy size={16} color="#FFD700" />
                <Text style={styles.statValue}>{player.wins}/{player.tournaments}</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>
              <View style={styles.statItem}>
                <TrendingUp size={16} color="#FF0041" />
                <Text style={styles.statValue}>{player.winRate}%</Text>
                <Text style={styles.statLabel}>Taux</Text>
              </View>
              <View style={styles.statItem}>
                <Medal size={16} color="#00FF41" />
                <Text style={styles.statValue}>{player.best180s}</Text>
                <Text style={styles.statLabel}>180s</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  controls: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F1F1F',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  activeSortButton: {
    backgroundColor: '#00FF41',
    borderColor: '#00FF41',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeSortText: {
    color: '#0F0F0F',
  },
  playersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF41',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
});