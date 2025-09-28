import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Calculator } from 'lucide-react-native';

interface ScoringButtonProps {
  onPress: () => void;
}

export const ScoringButton: React.FC<ScoringButtonProps> = ({ onPress }) => {
  const handlePress = () => {
    console.log('ScoringButton pressed');
    onPress();
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Calculator size={20} color="#0F0F0F" />
      <Text style={styles.buttonText}>Comptage</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FF41',
    paddingHorizontal: 16,
    paddingVertical: 22,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#00FF41',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});