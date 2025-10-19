import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Match, Player } from '@/types/tournament';
import { Target, Plus, Minus, RotateCcw, Trophy, X, Camera } from 'lucide-react-native';
import { CameraDartDetection } from './CameraDartDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FOOTER_HEIGHT = 84;

const getButtonWidth = () => {
  const availableWidth = screenWidth - 40;
  const minButtonWidth = 45;
  const buttonsPerRow = Math.floor(availableWidth / minButtonWidth);
  return Math.min((availableWidth / buttonsPerRow) - 8, 60);
};

const getButtonsPerRow = () => {
  const availableWidth = screenWidth - 40;
  const minButtonWidth = 45;
  return Math.floor(availableWidth / minButtonWidth);
};
