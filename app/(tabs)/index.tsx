import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ListFilter as Filter, Calendar, MapPin, Users, Trophy } from 'lucide-react-native';
import { ScoringButton } from '@/components/ScoringButton';
import { AutomaticScoring } from '@/components/AutomaticScoring';

interface Tournament {
  id: string;
  name: string;
  location: string;
  date: string;
  format: string;
  level: string;
  participants: number;
  maxParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Championnat National 2025',
    location: 'Paris Sports Center',
    date: '2025-02-15',
    format: 'Élimination directe',
    level: 'Pro',
    participants: 48,
    maxParticipants: 64,
    status: 'upcoming',
  },
  {
    id: '2',
    name: 'Tournoi Amateur du Weekend',
    location: 'Club Local',
    date: '2025-01-25',
    format: 'Round-robin',
    level: 'Amateur',
    participants: 16,
    maxParticipants: 24,
    status: 'upcoming',
  },
  {
    id: '3',
    name: 'Masters de Fléchettes',
    location: 'Arena Centrale',
    date: '2025-01-20',
    format: 'Double élimination',
    level: 'Pro',
    participants: 32,
    maxParticipants: 32,
    status: 'ongoing',
  },
];

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAutoScoring, setShowAutoScoring] = useState(false);

  const handleScoringPress = () => {
    console.log('Opening scoring modal');
    setShowAutoScoring(true);
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         tournament.level.toLowerCase() === selectedFilter.toLowerCase() ||
                         tournament.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#00FF41';
      case 'ongoing': return '#FF0041';
      case 'completed': return '#666666';
      default: return '#00FF41';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'À venir';
      case 'ongoing': return 'En cours';
      case 'completed': return 'Terminé';
      default: return 'À venir';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Tournois de Fléchettes</Text>
            <Text style={styles.subtitle}>Découvrez et rejoignez les tournois</Text>
          </View>
          <ScoringButton onPress={handleScoringPress} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un tournoi..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Filter size={20} color="#00FF41" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.tournamentsList} showsVerticalScrollIndicator={false}>
        {filteredTournaments.map((tournament) => (
          <View key={tournament.id} style={styles.tournamentCard}>
            <View style={styles.tournamentHeader}>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <View style={styles.tournamentMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color="#666666" />
                    <Text style={styles.metaText}>{tournament.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Calendar size={14} color="#666666" />
                    <Text style={styles.metaText}>
                      {new Date(tournament.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(tournament.status) }]}>
                  {getStatusText(tournament.status)}
                </Text>
              </View>
            </View>

            <View style={styles.tournamentDetails}>
              <View style={styles.detailItem}>
                <Trophy size={16} color="#00FF41" />
                <Text style={styles.detailText}>{tournament.format}</Text>
              </View>
              <View style={styles.detailItem}>
                <Users size={16} color="#00FF41" />
                <Text style={styles.detailText}>
                  {tournament.participants}/{tournament.maxParticipants}
                </Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{tournament.level}</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((tournament.participants / tournament.maxParticipants) * 100)}% complet
              </Text>
            </View>

            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>
                {tournament.status === 'ongoing' ? 'Voir les résultats' : 'Rejoindre'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <Text style={styles.filterTitle}>Filtres</Text>
            
            {['all', 'amateur', 'pro', 'upcoming', 'ongoing'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  selectedFilter === filter && styles.selectedFilter
                ]}
                onPress={() => {
                  setSelectedFilter(filter);
                  setFilterVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilter === filter && styles.selectedFilterText
                ]}>
                  {filter === 'all' ? 'Tous' :
                   filter === 'amateur' ? 'Amateur' :
                   filter === 'pro' ? 'Professionnel' :
                   filter === 'upcoming' ? 'À venir' :
                   filter === 'ongoing' ? 'En cours' : filter}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de comptage automatique */}
      <Modal visible={showAutoScoring} transparent={false} animationType="slide">
        <View style={styles.scoringModalContainer}>
          <AutomaticScoring
            visible={showAutoScoring}
            match={{
              id: 'demo-match',
              tournamentId: 'demo',
              round: 1,
              position: 0,
              player1: { id: '1', name: 'Joueur 1', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150' },
              player2: { id: '2', name: 'Joueur 2', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150' },
              status: 'pending',
            }}
            onClose={() => setShowAutoScoring(false)}
            onSubmit={(winner, score) => {
              console.log('Match result:', winner, score);
              setShowAutoScoring(false);
            }}
          />
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterButton: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00FF41',
  },
  tournamentsList: {
    flex: 1,
    padding: 20,
  },
  tournamentCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tournamentMeta: {
    gap: 6,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tournamentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF41',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
  },
  joinButton: {
    backgroundColor: '#00FF41',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilter: {
    backgroundColor: '#00FF41',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedFilterText: {
    color: '#0F0F0F',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#FF0041',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoringModalContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
});