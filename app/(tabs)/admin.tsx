import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Settings, Users, Trophy, Calendar, MapPin, Clock, Target, CreditCard as Edit, Trash2, Eye, Play } from 'lucide-react-native';
import { router } from 'expo-router';

interface Tournament {
  id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups';
  level: 'amateur' | 'pro';
  maxParticipants: number;
  participants: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  description: string;
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Championnat National 2025',
    location: 'Paris Sports Center',
    date: '2025-02-15',
    time: '14:00',
    format: 'single_elimination',
    level: 'pro',
    maxParticipants: 64,
    participants: 48,
    status: 'published',
    description: 'Grand tournoi national de fléchettes',
  },
  {
    id: '2',
    name: 'Tournoi Amateur Local',
    location: 'Club Local',
    date: '2025-01-30',
    time: '18:00',
    format: 'round_robin',
    level: 'amateur',
    maxParticipants: 24,
    participants: 12,
    status: 'draft',
    description: 'Tournoi convivial pour débutants',
  },
];

export default function AdminScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    date: '',
    time: '',
    format: 'single_elimination' as const,
    level: 'amateur' as const,
    maxParticipants: 16,
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      date: '',
      time: '',
      format: 'single_elimination',
      level: 'amateur',
      maxParticipants: 16,
      description: '',
    });
  };

  const handleCreateTournament = () => {
    if (!formData.name || !formData.location || !formData.date) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newTournament: Tournament = {
      id: Date.now().toString(),
      name: formData.name,
      location: formData.location,
      date: formData.date,
      time: formData.time,
      format: formData.format,
      level: formData.level,
      maxParticipants: formData.maxParticipants,
      participants: 0,
      status: 'draft',
      description: formData.description,
    };

    setTournaments([...tournaments, newTournament]);
    setShowCreateModal(false);
    resetForm();
    Alert.alert('Succès', 'Tournoi créé avec succès !');
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      location: tournament.location,
      date: tournament.date,
      time: tournament.time,
      format: tournament.format,
      level: tournament.level,
      maxParticipants: tournament.maxParticipants,
      description: tournament.description,
    });
    setShowCreateModal(true);
  };

  const handleUpdateTournament = () => {
    if (!editingTournament) return;

    const updatedTournaments = tournaments.map(t =>
      t.id === editingTournament.id
        ? { ...t, ...formData }
        : t
    );

    setTournaments(updatedTournaments);
    setShowCreateModal(false);
    setEditingTournament(null);
    resetForm();
    Alert.alert('Succès', 'Tournoi modifié avec succès !');
  };

  const handleDeleteTournament = (id: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce tournoi ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setTournaments(tournaments.filter(t => t.id !== id));
            Alert.alert('Succès', 'Tournoi supprimé avec succès !');
          },
        },
      ]
    );
  };

  const handlePublishTournament = (id: string) => {
    const updatedTournaments = tournaments.map(t =>
      t.id === id ? { ...t, status: 'published' as const } : t
    );
    setTournaments(updatedTournaments);
    Alert.alert('Succès', 'Tournoi publié dans le lobby !');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#666666';
      case 'published': return '#00FF41';
      case 'ongoing': return '#FF0041';
      case 'completed': return '#FFD700';
      default: return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'published': return 'Publié';
      case 'ongoing': return 'En cours';
      case 'completed': return 'Terminé';
      default: return 'Brouillon';
    }
  };

  const getFormatText = (format: string) => {
    switch (format) {
      case 'single_elimination': return 'Élimination directe';
      case 'double_elimination': return 'Double élimination';
      case 'round_robin': return 'Round-robin';
      case 'groups': return 'Poules';
      default: return format;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Administration</Text>
          <Text style={styles.subtitle}>Gérez vos tournois</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#0F0F0F" />
          <Text style={styles.createButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={20} color="#00FF41" />
          <Text style={styles.statValue}>{tournaments.length}</Text>
          <Text style={styles.statLabel}>Tournois</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={20} color="#FF0041" />
          <Text style={styles.statValue}>
            {tournaments.reduce((sum, t) => sum + t.participants, 0)}
          </Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statCard}>
          <Target size={20} color="#FFD700" />
          <Text style={styles.statValue}>
            {tournaments.filter(t => t.status === 'published').length}
          </Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>
      </View>

      <ScrollView style={styles.tournamentsList} showsVerticalScrollIndicator={false}>
        {tournaments.map((tournament) => (
          <View key={tournament.id} style={styles.tournamentCard}>
            <View style={styles.tournamentHeader}>
              <View style={styles.tournamentInfo}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <View style={styles.tournamentMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={12} color="#666666" />
                    <Text style={styles.metaText}>{tournament.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Calendar size={12} color="#666666" />
                    <Text style={styles.metaText}>
                      {new Date(tournament.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={12} color="#666666" />
                    <Text style={styles.metaText}>{tournament.time}</Text>
                  </View>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(tournament.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(tournament.status) }
                ]}>
                  {getStatusText(tournament.status)}
                </Text>
              </View>
            </View>

            <View style={styles.tournamentDetails}>
              <Text style={styles.formatText}>{getFormatText(tournament.format)}</Text>
              <Text style={styles.levelText}>{tournament.level.toUpperCase()}</Text>
              <Text style={styles.participantsText}>
                {tournament.participants}/{tournament.maxParticipants}
              </Text>
            </View>

            <View style={styles.tournamentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditTournament(tournament)}
              >
                <Edit size={16} color="#00FF41" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Eye size={16} color="#666666" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.manageButton]}
                onPress={() => router.push(`/tournament/${tournament.id}`)}
              >
                <Play size={16} color="#FFFFFF" />
              </TouchableOpacity>

              {tournament.status === 'draft' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.publishButton]}
                  onPress={() => handlePublishTournament(tournament.id)}
                >
                  <Text style={styles.publishText}>Publier</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteTournament(tournament.id)}
              >
                <Trash2 size={16} color="#FF0041" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingTournament ? 'Modifier le tournoi' : 'Créer un tournoi'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom du tournoi *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ex: Championnat de fléchettes"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Lieu *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Ex: Club de sport local"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.date}
                    onChangeText={(text) => setFormData({ ...formData, date: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#666666"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Heure</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.time}
                    onChangeText={(text) => setFormData({ ...formData, time: text })}
                    placeholder="HH:MM"
                    placeholderTextColor="#666666"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Format</Text>
                <View style={styles.optionsRow}>
                  {[
                    { key: 'single_elimination', label: 'Élimination directe' },
                    { key: 'double_elimination', label: 'Double élimination' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionButton,
                        formData.format === option.key && styles.selectedOption
                      ]}
                      onPress={() => setFormData({ ...formData, format: option.key as any })}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.format === option.key && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.optionsRow}>
                  {[
                    { key: 'round_robin', label: 'Round-robin' },
                    { key: 'groups', label: 'Poules' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionButton,
                        formData.format === option.key && styles.selectedOption
                      ]}
                      onPress={() => setFormData({ ...formData, format: option.key as any })}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.format === option.key && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Niveau</Text>
                <View style={styles.optionsRow}>
                  {[
                    { key: 'amateur', label: 'Amateur' },
                    { key: 'pro', label: 'Professionnel' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.optionButton,
                        formData.level === option.key && styles.selectedOption
                      ]}
                      onPress={() => setFormData({ ...formData, level: option.key as any })}
                    >
                      <Text style={[
                        styles.optionText,
                        formData.level === option.key && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre max de participants</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxParticipants.toString()}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    maxParticipants: parseInt(text) || 16 
                  })}
                  keyboardType="numeric"
                  placeholder="16"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Description du tournoi..."
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateModal(false);
                    setEditingTournament(null);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={editingTournament ? handleUpdateTournament : handleCreateTournament}
                >
                  <Text style={styles.confirmButtonText}>
                    {editingTournament ? 'Modifier' : 'Créer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FF41',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
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
    marginBottom: 12,
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
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
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
    gap: 16,
    marginBottom: 16,
  },
  formatText: {
    fontSize: 14,
    color: '#00FF41',
    fontWeight: '600',
  },
  levelText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    backgroundColor: '#FFD700',
    color: '#0F0F0F',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  participantsText: {
    fontSize: 14,
    color: '#666666',
  },
  tournamentActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#2A2A2A',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButton: {
    backgroundColor: '#00FF41',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  publishText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  deleteButton: {
    backgroundColor: '#FF0041',
    marginLeft: 'auto',
  },
  manageButton: {
    backgroundColor: '#00FF41',
  },
  modalOverlay: {
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
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  selectedOption: {
    backgroundColor: '#00FF41',
    borderColor: '#00FF41',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedOptionText: {
    color: '#0F0F0F',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#00FF41',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});