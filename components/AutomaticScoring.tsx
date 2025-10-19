import React, { useState } from 'react';
import { Match, Player } from '@/types/tournament';
import { CameraDartDetection } from './CameraDartDetection';

interface AutomaticScoringProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
  onSubmit: (winner: Player, score: { player1Score: number; player2Score: number }) => void;
}

export const AutomaticScoring: React.FC<AutomaticScoringProps> = ({
  visible,
  match,
  onClose,
  onSubmit,
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(501);
  const [player2Score, setPlayer2Score] = useState(501);
  const [player1Scores, setPlayer1Scores] = useState<number[]>([]);
  const [player2Scores, setPlayer2Scores] = useState<number[]>([]);

  const handleDartDetected = (score: number) => {
    console.log(`[AutoScoring] Fléchette détectée: ${score} points pour Joueur ${currentPlayerIndex}`);

    if (currentPlayerIndex === 1) {
      setPlayer1Scores(prev => [...prev, score]);
    } else {
      setPlayer2Scores(prev => [...prev, score]);
    }
  };

  const handleTurnComplete = (scores: number[]) => {
    const turnTotal = scores.reduce((sum, score) => sum + score, 0);
    console.log(`[AutoScoring] Tour terminé pour Joueur ${currentPlayerIndex}: ${turnTotal} points`);

    if (currentPlayerIndex === 1) {
      const newScore = Math.max(0, player1Score - turnTotal);
      setPlayer1Score(newScore);

      if (newScore === 0) {
        console.log('[AutoScoring] Joueur 1 a gagné !');
        onSubmit(match.player1!, {
          player1Score: 501,
          player2Score: 501 - player2Score,
        });
        return;
      }

      setCurrentPlayerIndex(2);
    } else {
      const newScore = Math.max(0, player2Score - turnTotal);
      setPlayer2Score(newScore);

      if (newScore === 0) {
        console.log('[AutoScoring] Joueur 2 a gagné !');
        onSubmit(match.player2!, {
          player1Score: 501 - player1Score,
          player2Score: 501,
        });
        return;
      }

      setCurrentPlayerIndex(1);
    }
  };

  if (!match.player1 || !match.player2) {
    return null;
  }

  return (
    <CameraDartDetection
      visible={visible}
      gameMode="501"
      onClose={onClose}
      onDartDetected={handleDartDetected}
      onTurnComplete={handleTurnComplete}
      currentPlayer={currentPlayerIndex === 1 ? match.player1.name : match.player2.name}
      currentPlayerIndex={currentPlayerIndex}
      player1={{
        name: match.player1.name,
        score: player1Score,
      }}
      player2={{
        name: match.player2.name,
        score: player2Score,
      }}
      maxDarts={3}
    />
  );
};
