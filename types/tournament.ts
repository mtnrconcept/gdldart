export interface Player {
  id: string;
  name: string;
  avatar: string;
  seed?: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  player1?: Player;
  player2?: Player;
  winner?: Player;
  score?: {
    player1Score: number;
    player2Score: number;
  };
  status: 'pending' | 'in_progress' | 'completed';
  nextMatchId?: string;
  previousMatch1Id?: string;
  previousMatch2Id?: string;
}

export interface TournamentBracket {
  id: string;
  name: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups';
  players: Player[];
  matches: Match[];
  currentRound: number;
  totalRounds: number;
  status: 'setup' | 'in_progress' | 'completed';
  winner?: Player;
}

export interface Round {
  number: number;
  name: string;
  matches: Match[];
  isCompleted: boolean;
}