import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Match, Player } from '@/types/tournament';
import { Target, Plus, Minus, RotateCcw, Trophy, X, Camera } from 'lucide-react-native';
import { CameraDartDetection } from './CameraDartDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AutomaticScoringProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
  onSubmit: (winner: Player, score: { player1Score: number; player2Score: number }) => void;
}

interface PlayerScore {
  currentScore: number;
  throws: number[];
  totalThrows: number;
  average: number;
}

export const AutomaticScoring: React.FC<AutomaticScoringProps> = ({
  visible,
  match,
  onClose,
  onSubmit,
}) => {
  const [gameMode, setGameMode] = useState<'501' | '301'>('501');
  const [player1Score, setPlayer1Score] = useState<PlayerScore>({
    currentScore: 501,
    throws: [],
    totalThrows: 0,
    average: 0,
  });
  const [player2Score, setPlayer2Score] = useState<PlayerScore>({
    currentScore: 501,
    throws: [],
    totalThrows: 0,
    average: 0,
  });
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [currentThrow, setCurrentThrow] = useState(0);
  const [throwScores, setThrowScores] = useState<number[]>([0, 0, 0]);
  const [gameFinished, setGameFinished] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showCameraDetection, setShowCameraDetection] = useState(false);

  useEffect(() => {
    if (visible) {
      resetGame();
    }
  }, [visible, gameMode]);

  const resetGame = () => {
    const startingScore = gameMode === '501' ? 501 : 301;
    setPlayer1Score({
      currentScore: startingScore,
      throws: [],
      totalThrows: 0,
      average: 0,
    });
    setPlayer2Score({
      currentScore: startingScore,
      throws: [],
      totalThrows: 0,
      average: 0,
    });
    setCurrentPlayer(1);
    setCurrentThrow(0);
    setThrowScores([0, 0, 0]);
    setGameFinished(false);
    setWinner(null);
  };

  const addScore = (points: number) => {
    if (gameFinished || currentThrow >= 3) return;

    const newThrowScores = [...throwScores];
    newThrowScores[currentThrow] = points;
    setThrowScores(newThrowScores);
    setCurrentThrow(currentThrow + 1);
  };

  const removeLastThrow = () => {
    if (currentThrow > 0) {
      const newThrowScores = [...throwScores];
      newThrowScores[currentThrow - 1] = 0;
      setThrowScores(newThrowScores);
      setCurrentThrow(currentThrow - 1);
    }
  };

  const confirmTurn = () => {
    if (gameFinished) return;

    const turnTotal = throwScores.reduce((sum, score) => sum + score, 0);
    const currentPlayerScore = currentPlayer === 1 ? player1Score : player2Score;
    const newScore = currentPlayerScore.currentScore - turnTotal;

    // Vérifier si le score est valide (pas en dessous de 0, et doit finir sur un double pour 501)
    if (newScore < 0 || (gameMode === '501' && newScore === 1)) {
      // Bust - le tour est annulé
      Alert.alert('Bust!', 'Score invalide. Le tour est annulé.');
    } else if (newScore === 0) {
      // Victoire !
      const winningPlayer = currentPlayer === 1 ? match.player1! : match.player2!;
      setWinner(winningPlayer);
      setGameFinished(true);
      
      // Calculer les scores finaux
      const finalPlayer1Score = currentPlayer === 1 ? 0 : player1Score.currentScore;
      const finalPlayer2Score = currentPlayer === 2 ? 0 : player2Score.currentScore;
      
      Alert.alert(
        'Victoire !',
        `${winningPlayer.name} a gagné !`,
        [
          {
            text: 'Valider le match',
            onPress: () => {
              onSubmit(winningPlayer, {
                player1Score: gameMode === '501' ? 501 - finalPlayer1Score : 301 - finalPlayer1Score,
                player2Score: gameMode === '501' ? 501 - finalPlayer2Score : 301 - finalPlayer2Score,
              });
            },
          },
        ]
      );
      return;
    } else {
      // Score valide, mettre à jour
      const newThrows = [...currentPlayerScore.throws, ...throwScores.filter(s => s > 0)];
      const newTotalThrows = currentPlayerScore.totalThrows + throwScores.filter(s => s > 0).length;
      const newAverage = newTotalThrows > 0 ? 
        ((gameMode === '501' ? 501 : 301) - newScore) / (newTotalThrows / 3) : 0;

      if (currentPlayer === 1) {
        setPlayer1Score({
          currentScore: newScore,
          throws: newThrows,
          totalThrows: newTotalThrows,
          average: newAverage,
        });
      } else {
        setPlayer2Score({
          currentScore: newScore,
          throws: newThrows,
          totalThrows: newTotalThrows,
          average: newAverage,
        });
      }
    }

    // Passer au joueur suivant
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setCurrentThrow(0);
    setThrowScores([0, 0, 0]);
  };

  const handleCameraDartDetected = (score: number) => {
    if (gameFinished || currentThrow >= 3) return;
    addScore(score);
  };

  const handleCameraTurnComplete = (scores: number[]) => {
    // Appliquer tous les scores du tour
    const turnTotal = scores.reduce((sum, score) => sum + score, 0);
    const currentPlayerScore = currentPlayer === 1 ? player1Score : player2Score;
    const newScore = currentPlayerScore.currentScore - turnTotal;

    // Vérifier si le score est valide
    if (newScore < 0 || (gameMode === '501' && newScore === 1)) {
      Alert.alert('Bust!', 'Score invalide. Le tour est annulé.');
    } else if (newScore === 0) {
      // Victoire !
      const winningPlayer = currentPlayer === 1 ? match.player1! : match.player2!;
      setWinner(winningPlayer);
      setGameFinished(true);
      
      Alert.alert(
        'Victoire !',
        `${winningPlayer.name} a gagné !`,
        [
          {
            text: 'Valider le match',
            onPress: () => {
              const finalPlayer1Score = currentPlayer === 1 ? 0 : player1Score.currentScore;
              const finalPlayer2Score = currentPlayer === 2 ? 0 : player2Score.currentScore;
              
              onSubmit(winningPlayer, {
                player1Score: gameMode === '501' ? 501 - finalPlayer1Score : 301 - finalPlayer1Score,
                player2Score: gameMode === '501' ? 501 - finalPlayer2Score : 301 - finalPlayer2Score,
              });
            },
          },
        ]
      );
      return;
    } else {
      // Score valide, mettre à jour
      const newThrows = [...currentPlayerScore.throws, ...scores];
      const newTotalThrows = currentPlayerScore.totalThrows + scores.length;
      const newAverage = newTotalThrows > 0 ? 
        ((gameMode === '501' ? 501 : 301) - newScore) / (newTotalThrows / 3) : 0;

      if (currentPlayer === 1) {
        setPlayer1Score({
          currentScore: newScore,
          throws: newThrows,
          totalThrows: newTotalThrows,
          average: newAverage,
        });
      } else {
        setPlayer2Score({
          currentScore: newScore,
          throws: newThrows,
          totalThrows: newTotalThrows,
          average: newAverage,
        });
      }
    }

    // Passer au joueur suivant
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setCurrentThrow(0);
    setThrowScores([0, 0, 0]);
    setShowCameraDetection(false);
  };

  const scoreButtons = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25,
    22, 24, 26, 27, 28, 30, 32, 33, 34, 36, 38, 39, 40, 42, 45, 48, 50, 51, 54, 57, 60
  ];

  if (!match.player1 || !match.player2) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Target size={24} color="#00FF41" />
            <Text style={styles.headerTitle}>Comptage Automatique</Text>
          </View>
          <View style={styles.gameModeContainer}>
            <TouchableOpacity
              style={[styles.gameModeButton, gameMode === '501' && styles.activeModeButton]}
              onPress={() => setGameMode('501')}
            >
              <Text style={[styles.gameModeText, gameMode === '501' && styles.activeModeText]}>
                501
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gameModeButton, gameMode === '301' && styles.activeModeButton]}
              onPress={() => setGameMode('301')}
            >
              <Text style={[styles.gameModeText, gameMode === '301' && styles.activeModeText]}>
                301
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scores des joueurs */}
        <View style={styles.playersContainer}>
          <View style={[
            styles.playerCard,
            currentPlayer === 1 && !gameFinished && styles.activePlayerCard
          ]}>
            <Text style={styles.playerName}>{match.player1.name}</Text>
            <Text style={styles.playerScore}>{player1Score.currentScore}</Text>
            <Text style={styles.playerAverage}>
              Moy: {player1Score.average.toFixed(1)}
            </Text>
            {winner?.id === match.player1.id && (
              <View style={styles.winnerBadge}>
                <Trophy size={20} color="#FFD700" />
                <Text style={styles.winnerText}>GAGNANT</Text>
              </View>
            )}
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={[
            styles.playerCard,
            currentPlayer === 2 && !gameFinished && styles.activePlayerCard
          ]}>
            <Text style={styles.playerName}>{match.player2.name}</Text>
            <Text style={styles.playerScore}>{player2Score.currentScore}</Text>
            <Text style={styles.playerAverage}>
              Moy: {player2Score.average.toFixed(1)}
            </Text>
            {winner?.id === match.player2.id && (
              <View style={styles.winnerBadge}>
                <Trophy size={20} color="#FFD700" />
                <Text style={styles.winnerText}>GAGNANT</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton caméra */}
        {!gameFinished && (
          <View style={styles.cameraContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCameraDetection(true)}
            >
              <Camera size={20} color="#0F0F0F" />
              <Text style={styles.cameraButtonText}>Détection Caméra</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tour actuel */}
        {!gameFinished && (
          <View style={styles.currentTurnContainer}>
            <Text style={styles.currentTurnTitle}>
              Tour de {currentPlayer === 1 ? match.player1.name : match.player2.name}
            </Text>
            <View style={styles.throwsContainer}>
              {throwScores.map((score, index) => (
                <View key={index} style={[
                  styles.throwBox,
                  index === currentThrow && styles.activeThrowBox
                ]}>
                  <Text style={styles.throwScore}>{score || '-'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.turnTotal}>
              Total: {throwScores.reduce((sum, score) => sum + score, 0)}
            </Text>
          </View>
        )}

        {/* Boutons de score */}
        {!gameFinished && (
          <View style={styles.scoreButtonsContainer}>
            <View style={styles.scoreGrid}>
              {scoreButtons.map((score) => (
                <TouchableOpacity
                  key={score}
                  style={styles.scoreButton}
                  onPress={() => addScore(score)}
                  disabled={currentThrow >= 3}
                >
                  <Text style={styles.scoreButtonText}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        {!gameFinished && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={removeLastThrow}
              disabled={currentThrow === 0}
            >
              <Minus size={20} color="#FF0041" />
              <Text style={styles.actionButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={resetGame}
            >
              <RotateCcw size={20} color="#666666" />
              <Text style={styles.actionButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={confirmTurn}
              disabled={currentThrow === 0}
            >
              <Plus size={20} color="#0F0F0F" />
              <Text style={[styles.actionButtonText, styles.confirmButtonText]}>
                Confirmer
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Détection par caméra */}
      <CameraDartDetection
        visible={showCameraDetection}
        gameMode={gameMode}
        onClose={() => setShowCameraDetection(false)}
        onDartDetected={handleCameraDartDetected}
        onTurnComplete={handleCameraTurnComplete}
        currentPlayer={currentPlayer === 1 ? match.player1?.name || 'Joueur 1' : match.player2?.name || 'Joueur 2'}
        maxDarts={3}
      />
    </Modal>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  closeButton: {
    backgroundColor: '#1F1F1F',
    padding: 12,
    borderRadius: 12,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gameModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 4,
  },
  gameModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: '#00FF41',
  },
  gameModeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  activeModeText: {
    color: '#0F0F0F',
  },
  playersContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  playerCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  activePlayerCard: {
    borderColor: '#00FF41',
    backgroundColor: '#001A0A',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  playerScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00FF41',
    marginBottom: 4,
  },
  playerAverage: {
    fontSize: 14,
    color: '#666666',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  winnerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
  vsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
  },
  currentTurnContainer: {
    margin: 20,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  currentTurnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  throwsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  throwBox: {
    width: 60,
    height: 60,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3A3A3A',
  },
  activeThrowBox: {
    borderColor: '#00FF41',
    backgroundColor: '#001A0A',
  },
  throwScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  turnTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF41',
  },
  scoreButtonsContainer: {
    flex: 1,
    padding: 20,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  scoreButton: {
    width: (screenWidth - 80) / 7,
    height: 50,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F1F1F',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: '#00FF41',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmButtonText: {
    color: '#0F0F0F',
  },
  cameraContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FF41',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#00FF41',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F0F',
  },
});