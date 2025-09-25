import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Clock, Users, MapPin, Calendar, Target } from 'lucide-react-native';
import { ScoringButton } from '@/components/ScoringButton';

interface LiveTournament {
  id: string;
  name: string;
  currentMatch: string;
  playersLeft: number;
  nextMatch: string;
  viewers: number;
}

interface UpcomingTournament {
  id: string;
  name: string;
  startTime: string;
  participants: number;
  location: string;
}

const mockLiveTournaments: LiveTournament[] = [
  {
    id: '1',
    name: 'Masters de Fléchettes',
    currentMatch: 'Jean Dupont vs Marie Martin',
    playersLeft: 8,
    nextMatch: 'Demi-finales dans 15min',
    viewers: 234,
  },
  {
    id: '2',
    name: 'Championnat Régional',
    currentMatch: 'Pierre Lucas vs Sophie Blanc',
    playersLeft: 4,
    nextMatch: 'Finale dans 30min',
    viewers: 156,
  },
];

const mockUpcomingTournaments: UpcomingTournament[] = [
  {
    id: '1',
    name: 'Tournoi Amateur du Weekend',
    startTime: '14:30',
    participants: 16,
    location: 'Club Local',
  },
  {
    id: '2',
    name: 'Coupe des Champions',
    startTime: '16:00',
    participants: 24,
    location: 'Arena Centrale',
  },
  {
    id: '3',
    name: 'Challenge Novices',
    startTime: '18:00',
    participants: 12,
    location: 'Salle Municipal',
  },
];

export default function LobbyScreen() {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [showAutoScoring, setShowAutoScoring] = useState(false);

  const renderLiveTournament = ({ item }: { item: LiveTournament }) => (
    <TouchableOpacity style={styles.liveCard}>
      <View style={styles.liveHeader}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN DIRECT</Text>
        </View>
        <View style={styles.viewersContainer}>
          <Users size={14} color="#666666" />
          <Text style={styles.viewersText}>{item.viewers}</Text>
        </View>
      </View>
      
      <Text style={styles.liveTournamentName}>{item.name}</Text>
      
      <View style={styles.matchInfo}>
        <Target size={16} color="#00FF41" />
        <Text style={styles.currentMatch}>{item.currentMatch}</Text>
      </View>
      
      <View style={styles.liveStats}>
        <View style={styles.statItem}>
          <Trophy size={14} color="#FF0041" />
          <Text style={styles.statText}>{item.playersLeft} joueurs restants</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={14} color="#666666" />
          <Text style={styles.statText}>{item.nextMatch}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.watchButton}>
        <Text style={styles.watchButtonText}>Regarder</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUpcomingTournament = ({ item }: { item: UpcomingTournament }) => (
    <TouchableOpacity style={styles.upcomingCard}>
      <View style={styles.upcomingHeader}>
        <Text style={styles.upcomingName}>{item.name}</Text>
        <View style={styles.timeContainer}>
          <Clock size={14} color="#00FF41" />
          <Text style={styles.startTime}>{item.startTime}</Text>
        </View>
      </View>
      
      <View style={styles.upcomingInfo}>
        <View style={styles.infoItem}>
          <MapPin size={14} color="#666666" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
        <View style={styles.infoItem}>
          <Users size={14} color="#666666" />
          <Text style={styles.infoText}>{item.participants} participants</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.notifyButton}>
        <Text style={styles.notifyButtonText}>Me notifier</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Lobby des Tournois</Text>
            <Text style={styles.subtitle}>Suivez l'action en temps réel</Text>
          </View>
          <ScoringButton onPress={() => setShowAutoScoring(true)} />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'live' && styles.activeTab]}
          onPress={() => setActiveTab('live')}
        >
          <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>
            En Direct
          </Text>
          {activeTab === 'live' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            À Venir
          </Text>
          {activeTab === 'upcoming' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'live' ? (
          mockLiveTournaments.length > 0 ? (
            <FlatList
              data={mockLiveTournaments}
              renderItem={renderLiveTournament}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Trophy size={48} color="#666666" />
              <Text style={styles.emptyTitle}>Aucun tournoi en direct</Text>
              <Text style={styles.emptyText}>
                Les tournois en cours s'afficheront ici
              </Text>
            </View>
          )
        ) : (
          <FlatList
            data={mockUpcomingTournaments}
            renderItem={renderUpcomingTournament}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Style is handled by tabIndicator
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#00FF41',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    backgroundColor: '#00FF41',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  liveCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF0041',
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0041',
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF0041',
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewersText: {
    fontSize: 12,
    color: '#666666',
  },
  liveTournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  currentMatch: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  liveStats: {
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
  },
  watchButton: {
    backgroundColor: '#FF0041',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  upcomingCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  upcomingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00FF41',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  startTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  upcomingInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
  },
  notifyButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00FF41',
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF41',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});