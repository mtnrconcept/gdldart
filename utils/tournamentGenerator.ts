import { Player, Match, TournamentBracket, Round } from '@/types/tournament';

export class TournamentGenerator {
  static generateSingleElimination(players: Player[], tournamentId: string): TournamentBracket {
    const shuffledPlayers = this.shufflePlayers([...players]);
    const totalRounds = Math.ceil(Math.log2(players.length));
    const matches: Match[] = [];
    
    // Calculer le nombre de joueurs pour la première ronde
    const firstRoundPlayers = this.getNextPowerOfTwo(players.length);
    const byes = firstRoundPlayers - players.length;
    
    let matchId = 1;
    let currentRound = 1;
    
    // Première ronde
    const firstRoundMatches: Match[] = [];
    let playerIndex = 0;
    
    for (let i = 0; i < firstRoundPlayers / 2; i++) {
      const match: Match = {
        id: `${tournamentId}-match-${matchId++}`,
        tournamentId,
        round: currentRound,
        position: i,
        status: 'pending',
      };
      
      // Assigner les joueurs (en tenant compte des byes)
      if (playerIndex < shuffledPlayers.length) {
        match.player1 = shuffledPlayers[playerIndex++];
      }
      if (playerIndex < shuffledPlayers.length) {
        match.player2 = shuffledPlayers[playerIndex++];
      }
      
      // Si un joueur manque, l'autre passe automatiquement
      if (!match.player2 && match.player1) {
        match.winner = match.player1;
        match.status = 'completed';
      }
      
      firstRoundMatches.push(match);
      matches.push(match);
    }
    
    // Générer les rondes suivantes
    let previousRoundMatches = firstRoundMatches;
    
    for (let round = 2; round <= totalRounds; round++) {
      const roundMatches: Match[] = [];
      const matchesInRound = Math.ceil(previousRoundMatches.length / 2);
      
      for (let i = 0; i < matchesInRound; i++) {
        const match: Match = {
          id: `${tournamentId}-match-${matchId++}`,
          tournamentId,
          round,
          position: i,
          status: 'pending',
          previousMatch1Id: previousRoundMatches[i * 2]?.id,
          previousMatch2Id: previousRoundMatches[i * 2 + 1]?.id,
        };
        
        roundMatches.push(match);
        matches.push(match);
        
        // Lier les matchs précédents à celui-ci
        if (previousRoundMatches[i * 2]) {
          previousRoundMatches[i * 2].nextMatchId = match.id;
        }
        if (previousRoundMatches[i * 2 + 1]) {
          previousRoundMatches[i * 2 + 1].nextMatchId = match.id;
        }
      }
      
      previousRoundMatches = roundMatches;
    }
    
    return {
      id: tournamentId,
      name: 'Single Elimination',
      format: 'single_elimination',
      players: shuffledPlayers,
      matches,
      currentRound: 1,
      totalRounds,
      status: 'setup',
    };
  }
  
  static generateDoubleElimination(players: Player[], tournamentId: string): TournamentBracket {
    const shuffledPlayers = this.shufflePlayers([...players]);
    const matches: Match[] = [];
    let matchId = 1;
    
    // Calculer le nombre de rondes
    const winnersRounds = Math.ceil(Math.log2(players.length));
    const losersRounds = (winnersRounds - 1) * 2;
    const totalRounds = winnersRounds + losersRounds + 1; // +1 pour la grande finale
    
    // === WINNER'S BRACKET ===
    
    // Première ronde du winner's bracket
    const winnersFirstRoundMatches: Match[] = [];
    for (let i = 0; i < players.length / 2; i++) {
      const match: Match = {
        id: `${tournamentId}-w-match-${matchId++}`,
        tournamentId,
        round: 1,
        position: i,
        player1: shuffledPlayers[i * 2],
        player2: shuffledPlayers[i * 2 + 1],
        status: 'pending',
      };
      winnersFirstRoundMatches.push(match);
      matches.push(match);
    }
    
    // Rondes suivantes du winner's bracket
    let previousWinnersMatches = winnersFirstRoundMatches;
    for (let round = 2; round <= winnersRounds; round++) {
      const roundMatches: Match[] = [];
      const matchesInRound = Math.ceil(previousWinnersMatches.length / 2);
      
      for (let i = 0; i < matchesInRound; i++) {
        const match: Match = {
          id: `${tournamentId}-w-match-${matchId++}`,
          tournamentId,
          round,
          position: i,
          status: 'pending',
          previousMatch1Id: previousWinnersMatches[i * 2]?.id,
          previousMatch2Id: previousWinnersMatches[i * 2 + 1]?.id,
        };
        
        roundMatches.push(match);
        matches.push(match);
        
        // Lier les matchs précédents
        if (previousWinnersMatches[i * 2]) {
          previousWinnersMatches[i * 2].nextMatchId = match.id;
        }
        if (previousWinnersMatches[i * 2 + 1]) {
          previousWinnersMatches[i * 2 + 1].nextMatchId = match.id;
        }
      }
      
      previousWinnersMatches = roundMatches;
    }
    
    // === LOSER'S BRACKET ===
    
    // Le loser's bracket commence avec les perdants de la première ronde du winner's bracket
    let losersRoundNumber = winnersRounds + 1;
    let previousLosersMatches: Match[] = [];
    
    // Première ronde du loser's bracket (perdants de la première ronde winners)
    for (let i = 0; i < winnersFirstRoundMatches.length / 2; i++) {
      const match: Match = {
        id: `${tournamentId}-l-match-${matchId++}`,
        tournamentId,
        round: losersRoundNumber,
        position: i,
        status: 'pending',
        // Les joueurs seront assignés quand les matchs du winner's bracket seront terminés
      };
      previousLosersMatches.push(match);
      matches.push(match);
    }
    
    // Continuer le loser's bracket
    for (let i = 1; i < losersRounds; i++) {
      losersRoundNumber++;
      const roundMatches: Match[] = [];
      
      if (i % 2 === 1) {
        // Rondes impaires : les perdants du winner's bracket rejoignent
        const matchesInRound = Math.ceil(previousLosersMatches.length / 2);
        for (let j = 0; j < matchesInRound; j++) {
          const match: Match = {
            id: `${tournamentId}-l-match-${matchId++}`,
            tournamentId,
            round: losersRoundNumber,
            position: j,
            status: 'pending',
            previousMatch1Id: previousLosersMatches[j * 2]?.id,
            previousMatch2Id: previousLosersMatches[j * 2 + 1]?.id,
          };
          roundMatches.push(match);
          matches.push(match);
        }
      } else {
        // Rondes paires : seulement les survivants du loser's bracket
        const matchesInRound = Math.ceil(previousLosersMatches.length / 2);
        for (let j = 0; j < matchesInRound; j++) {
          const match: Match = {
            id: `${tournamentId}-l-match-${matchId++}`,
            tournamentId,
            round: losersRoundNumber,
            position: j,
            status: 'pending',
            previousMatch1Id: previousLosersMatches[j * 2]?.id,
            previousMatch2Id: previousLosersMatches[j * 2 + 1]?.id,
          };
          roundMatches.push(match);
          matches.push(match);
        }
      }
      
      previousLosersMatches = roundMatches;
    }
    
    // === GRANDE FINALE ===
    
    // Finale du loser's bracket (gagnant du loser's bracket vs perdant de la finale winner's)
    const losersFinal: Match = {
      id: `${tournamentId}-losers-final-${matchId++}`,
      tournamentId,
      round: totalRounds - 1,
      position: 0,
      status: 'pending',
    };
    matches.push(losersFinal);
    
    // Grande finale (gagnant winner's bracket vs gagnant loser's bracket)
    const grandFinal: Match = {
      id: `${tournamentId}-grand-final-${matchId++}`,
      tournamentId,
      round: totalRounds,
      position: 0,
      status: 'pending',
    };
    matches.push(grandFinal);
    
    return {
      id: tournamentId,
      name: 'Double Elimination (16 joueurs)',
      format: 'double_elimination',
      players: shuffledPlayers,
      matches,
      currentRound: 1,
      totalRounds,
      status: 'setup',
    };
  }
  
  static generateRoundRobin(players: Player[], tournamentId: string): TournamentBracket {
    const shuffledPlayers = this.shufflePlayers([...players]);
    const matches: Match[] = [];
    let matchId = 1;
    
    // Générer tous les matchs possibles (chaque joueur contre chaque autre)
    for (let i = 0; i < shuffledPlayers.length; i++) {
      for (let j = i + 1; j < shuffledPlayers.length; j++) {
        const match: Match = {
          id: `${tournamentId}-match-${matchId++}`,
          tournamentId,
          round: 1, // Tous les matchs sont dans la même "ronde" conceptuelle
          position: matchId - 2,
          player1: shuffledPlayers[i],
          player2: shuffledPlayers[j],
          status: 'pending',
        };
        
        matches.push(match);
      }
    }
    
    return {
      id: tournamentId,
      name: 'Round Robin',
      format: 'round_robin',
      players: shuffledPlayers,
      matches,
      currentRound: 1,
      totalRounds: 1,
      status: 'setup',
    };
  }
  
  static updateMatchResult(
    bracket: TournamentBracket, 
    matchId: string, 
    winner: Player, 
    score: { player1Score: number; player2Score: number }
  ): TournamentBracket {
    const updatedMatches = bracket.matches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          winner,
          score,
          status: 'completed' as const,
        };
      }
      return match;
    });
    
    // Logique spécifique selon le format
    if (bracket.format === 'double_elimination') {
      return this.updateDoubleEliminationMatches(bracket, updatedMatches, matchId, winner);
    } else if (bracket.format === 'single_elimination') {
      return this.updateSingleEliminationMatches(bracket, updatedMatches, matchId, winner);
    }
    
    // Pour round robin, pas de mise à jour spéciale nécessaire
    const isCompleted = this.isTournamentCompleted(updatedMatches, bracket.format);
    const tournamentWinner = isCompleted ? this.getTournamentWinner(updatedMatches, bracket.format) : undefined;
    
    return {
      ...bracket,
      matches: updatedMatches,
      status: isCompleted ? 'completed' : 'in_progress',
      winner: tournamentWinner,
    };
  }
  
  private static updateDoubleEliminationMatches(
    bracket: TournamentBracket,
    updatedMatches: Match[],
    completedMatchId: string,
    winner: Player
  ): TournamentBracket {
    const completedMatch = updatedMatches.find(m => m.id === completedMatchId);
    if (!completedMatch || !completedMatch.player1 || !completedMatch.player2) {
      return { ...bracket, matches: updatedMatches };
    }
    
    const loser = winner.id === completedMatch.player1.id ? completedMatch.player2 : completedMatch.player1;
    
    // Si c'est un match du winner's bracket
    if (completedMatch.id.includes('-w-')) {
      // Le gagnant avance dans le winner's bracket
      if (completedMatch.nextMatchId) {
        const nextMatchIndex = updatedMatches.findIndex(m => m.id === completedMatch.nextMatchId);
        if (nextMatchIndex !== -1) {
          const nextMatch = updatedMatches[nextMatchIndex];
          if (nextMatch.previousMatch1Id === completedMatchId) {
            updatedMatches[nextMatchIndex] = { ...nextMatch, player1: winner };
          } else if (nextMatch.previousMatch2Id === completedMatchId) {
            updatedMatches[nextMatchIndex] = { ...nextMatch, player2: winner };
          }
        }
      }
      
      // Le perdant va dans le loser's bracket
      // Trouver le bon match dans le loser's bracket pour ce perdant
      const losersMatches = updatedMatches.filter(m => m.id.includes('-l-') && m.status === 'pending');
      
      // Logique simplifiée : assigner le perdant au premier match disponible du loser's bracket
      for (const losersMatch of losersMatches) {
        if (!losersMatch.player1) {
          const matchIndex = updatedMatches.findIndex(m => m.id === losersMatch.id);
          updatedMatches[matchIndex] = { ...losersMatch, player1: loser };
          break;
        } else if (!losersMatch.player2) {
          const matchIndex = updatedMatches.findIndex(m => m.id === losersMatch.id);
          updatedMatches[matchIndex] = { ...losersMatch, player2: loser };
          break;
        }
      }
    }
    
    // Si c'est un match du loser's bracket
    else if (completedMatch.id.includes('-l-')) {
      // Le gagnant continue dans le loser's bracket
      if (completedMatch.nextMatchId) {
        const nextMatchIndex = updatedMatches.findIndex(m => m.id === completedMatch.nextMatchId);
        if (nextMatchIndex !== -1) {
          const nextMatch = updatedMatches[nextMatchIndex];
          if (nextMatch.previousMatch1Id === completedMatchId) {
            updatedMatches[nextMatchIndex] = { ...nextMatch, player1: winner };
          } else if (nextMatch.previousMatch2Id === completedMatchId) {
            updatedMatches[nextMatchIndex] = { ...nextMatch, player2: winner };
          }
        }
      }
      // Le perdant est éliminé définitivement
    }
    
    // Vérifier la progression automatique des manches
    const updatedBracket = this.checkRoundProgression({
      ...bracket,
      matches: updatedMatches,
    });
    
    // Vérifier si le tournoi est terminé
    const isCompleted = this.isTournamentCompleted(updatedBracket.matches, bracket.format);
    const tournamentWinner = isCompleted ? this.getTournamentWinner(updatedBracket.matches, bracket.format) : undefined;
    
    return {
      ...updatedBracket,
      status: isCompleted ? 'completed' : 'in_progress',
      winner: tournamentWinner,
    };
  }
  
  private static updateSingleEliminationMatches(
    bracket: TournamentBracket,
    updatedMatches: Match[],
    completedMatchId: string,
    winner: Player
  ): TournamentBracket {
    // Mettre à jour le match suivant si c'est un tournoi à élimination
    const completedMatch = updatedMatches.find(m => m.id === completedMatchId);
    if (completedMatch?.nextMatchId) {
      const nextMatchIndex = updatedMatches.findIndex(m => m.id === completedMatch.nextMatchId);
      if (nextMatchIndex !== -1) {
        const nextMatch = updatedMatches[nextMatchIndex];
        
        // Déterminer si le gagnant va en player1 ou player2
        if (nextMatch.previousMatch1Id === completedMatchId) {
          updatedMatches[nextMatchIndex] = {
            ...nextMatch,
            player1: winner,
          };
        } else if (nextMatch.previousMatch2Id === completedMatchId) {
          updatedMatches[nextMatchIndex] = {
            ...nextMatch,
            player2: winner,
          };
        }
      }
    }
    
    // Vérifier la progression automatique des manches
    const updatedBracket = this.checkRoundProgression({
      ...bracket,
      matches: updatedMatches,
    });
    
    // Vérifier si le tournoi est terminé
    const isCompleted = this.isTournamentCompleted(updatedBracket.matches, bracket.format);
    const tournamentWinner = isCompleted ? this.getTournamentWinner(updatedBracket.matches, bracket.format) : undefined;
    
    return {
      ...updatedBracket,
      status: isCompleted ? 'completed' : 'in_progress',
      winner: tournamentWinner,
    };
  }
  
  static checkRoundProgression(bracket: TournamentBracket): TournamentBracket {
    if (bracket.format === 'round_robin') {
      return bracket; // Pas de progression de manche pour round robin
    }
    
    // Vérifier si la manche actuelle est terminée
    const currentRoundMatches = bracket.matches.filter(m => m.round === bracket.currentRound);
    const isCurrentRoundComplete = currentRoundMatches.every(m => m.status === 'completed');
    
    if (isCurrentRoundComplete && bracket.currentRound < bracket.totalRounds) {
      // Passer à la manche suivante
      const nextRound = bracket.currentRound + 1;
      const nextRoundMatches = bracket.matches.filter(m => m.round === nextRound);
      
      // Activer les matchs de la manche suivante qui ont leurs deux joueurs
      const updatedMatches = bracket.matches.map(match => {
        if (match.round === nextRound && match.player1 && match.player2 && match.status === 'pending') {
          return {
            ...match,
            status: 'pending' as const, // Prêt à être joué
          };
        }
        return match;
      });
      
      return {
        ...bracket,
        matches: updatedMatches,
        currentRound: nextRound,
      };
    }
    
    return bracket;
  }
  
  static getRounds(bracket: TournamentBracket): Round[] {
    const rounds: Round[] = [];
    
    if (bracket.format === 'round_robin') {
      return [{
        number: 1,
        name: 'Round Robin',
        matches: bracket.matches,
        isCompleted: bracket.matches.every(m => m.status === 'completed'),
      }];
    }
    
    if (bracket.format === 'double_elimination') {
      // Séparer les matchs du winner's bracket et du loser's bracket
      const winnersMatches = bracket.matches.filter(m => m.id.includes('-w-'));
      const losersMatches = bracket.matches.filter(m => m.id.includes('-l-'));
      const finalMatches = bracket.matches.filter(m => 
        m.id.includes('losers-final') || m.id.includes('grand-final')
      );
      
      // Winner's bracket rounds
      const winnersRounds = Math.max(...winnersMatches.map(m => m.round));
      for (let roundNum = 1; roundNum <= winnersRounds; roundNum++) {
        const roundMatches = winnersMatches.filter(m => m.round === roundNum);
        if (roundMatches.length > 0) {
          rounds.push({
            number: roundNum,
            name: `Winner's ${this.getRoundName(roundNum, winnersRounds, 'single_elimination')}`,
            matches: roundMatches,
            isCompleted: roundMatches.every(m => m.status === 'completed'),
          });
        }
      }
      
      // Loser's bracket rounds
      const losersRoundNumbers = [...new Set(losersMatches.map(m => m.round))].sort((a, b) => a - b);
      losersRoundNumbers.forEach((roundNum, index) => {
        const roundMatches = losersMatches.filter(m => m.round === roundNum);
        if (roundMatches.length > 0) {
          rounds.push({
            number: roundNum,
            name: `Loser's Round ${index + 1}`,
            matches: roundMatches,
            isCompleted: roundMatches.every(m => m.status === 'completed'),
          });
        }
      });
      
      // Finals
      if (finalMatches.length > 0) {
        const losersFinal = finalMatches.find(m => m.id.includes('losers-final'));
        const grandFinal = finalMatches.find(m => m.id.includes('grand-final'));
        
        if (losersFinal) {
          rounds.push({
            number: losersFinal.round,
            name: 'Finale Loser\'s Bracket',
            matches: [losersFinal],
            isCompleted: losersFinal.status === 'completed',
          });
        }
        
        if (grandFinal) {
          rounds.push({
            number: grandFinal.round,
            name: 'Grande Finale',
            matches: [grandFinal],
            isCompleted: grandFinal.status === 'completed',
          });
        }
      }
      
      return rounds;
    }
    
    // Single elimination
    for (let roundNum = 1; roundNum <= bracket.totalRounds; roundNum++) {
      const roundMatches = bracket.matches.filter(m => m.round === roundNum);
      const roundName = this.getRoundName(roundNum, bracket.totalRounds, bracket.format);
      
      rounds.push({
        number: roundNum,
        name: roundName,
        matches: roundMatches,
        isCompleted: roundMatches.every(m => m.status === 'completed'),
      });
    }
    
    return rounds;
  }
  
  static generateFinalRanking(bracket: TournamentBracket): Player[] {
    if (bracket.format === 'round_robin') {
      return this.generateRoundRobinRanking(bracket);
    } else {
      return this.generateEliminationRanking(bracket);
    }
  }
  
  private static generateRoundRobinRanking(bracket: TournamentBracket): Player[] {
    const playerStats: { [playerId: string]: { player: Player; wins: number; losses: number; pointsFor: number; pointsAgainst: number } } = {};
    
    // Initialiser les stats pour tous les joueurs
    bracket.players.forEach(player => {
      playerStats[player.id] = {
        player,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
    });
    
    // Calculer les statistiques
    bracket.matches.forEach(match => {
      if (match.status === 'completed' && match.player1 && match.player2 && match.score && match.winner) {
        const player1Stats = playerStats[match.player1.id];
        const player2Stats = playerStats[match.player2.id];
        
        player1Stats.pointsFor += match.score.player1Score;
        player1Stats.pointsAgainst += match.score.player2Score;
        player2Stats.pointsFor += match.score.player2Score;
        player2Stats.pointsAgainst += match.score.player1Score;
        
        if (match.winner.id === match.player1.id) {
          player1Stats.wins++;
          player2Stats.losses++;
        } else {
          player2Stats.wins++;
          player1Stats.losses++;
        }
      }
    });
    
    // Trier par nombre de victoires, puis par différence de points
    return Object.values(playerStats)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const aDiff = a.pointsFor - a.pointsAgainst;
        const bDiff = b.pointsFor - b.pointsAgainst;
        return bDiff - aDiff;
      })
      .map(stats => stats.player);
  }
  
  private static generateEliminationRanking(bracket: TournamentBracket): Player[] {
    const ranking: Player[] = [];
    const playerRounds: { [playerId: string]: number } = {};
    
    // Déterminer à quelle manche chaque joueur a été éliminé
    bracket.players.forEach(player => {
      playerRounds[player.id] = 0; // Éliminé avant le premier tour (bye)
    });
    
    // Parcourir les matchs pour déterminer les éliminations
    bracket.matches.forEach(match => {
      if (match.status === 'completed' && match.player1 && match.player2) {
        const winner = match.winner;
        const loser = winner?.id === match.player1.id ? match.player2 : match.player1;
        
        if (winner && loser) {
          // Le gagnant progresse à la manche suivante
          playerRounds[winner.id] = Math.max(playerRounds[winner.id], match.round);
          // Le perdant est éliminé à cette manche
          if (playerRounds[loser.id] < match.round) {
            playerRounds[loser.id] = match.round - 0.5; // Éliminé pendant cette manche
          }
        }
      }
    });
    
    // Le vainqueur du tournoi
    if (bracket.winner) {
      ranking.push(bracket.winner);
    }
    
    // Trier les autres joueurs par manche d'élimination (plus tard = meilleur classement)
    const otherPlayers = bracket.players
      .filter(p => p.id !== bracket.winner?.id)
      .sort((a, b) => playerRounds[b.id] - playerRounds[a.id]);
    
    ranking.push(...otherPlayers);
    
    return ranking;
  }
  
  private static shufflePlayers(players: Player[]): Player[] {
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
    return players;
  }
  
  private static getNextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
  
  private static getRoundName(roundNum: number, totalRounds: number, format: string): string {
    if (format === 'round_robin') return 'Round Robin';
    
    const roundsFromEnd = totalRounds - roundNum;
    
    switch (roundsFromEnd) {
      case 0: return 'Finale';
      case 1: return 'Demi-finales';
      case 2: return 'Quarts de finale';
      case 3: return 'Huitièmes de finale';
      default: return `Tour ${roundNum}`;
    }
  }
  
  private static isTournamentCompleted(matches: Match[], format: string): boolean {
    if (format === 'round_robin') {
      return matches.every(m => m.status === 'completed');
    }
    
    if (format === 'double_elimination') {
      // Le tournoi est terminé quand la grande finale est terminée
      const grandFinal = matches.find(m => m.id.includes('grand-final'));
      return grandFinal?.status === 'completed';
    }
    
    // Pour les tournois à élimination simple, vérifier si la finale est terminée
    const finalMatch = matches.find(m => !m.nextMatchId && m.status === 'completed');
    return !!finalMatch;
  }
  
  private static getTournamentWinner(matches: Match[], format: string): Player | undefined {
    if (format === 'round_robin') {
      // Le gagnant sera déterminé par le classement
      return undefined; // Sera calculé dans generateFinalRanking
    }
    
    if (format === 'double_elimination') {
      // Le gagnant est celui qui gagne la grande finale
      const grandFinal = matches.find(m => m.id.includes('grand-final') && m.status === 'completed');
      return grandFinal?.winner;
    }
    
    // Pour les tournois à élimination simple, le gagnant est celui qui gagne la finale
    const finalMatch = matches.find(m => !m.nextMatchId && m.status === 'completed');
    return finalMatch?.winner;
  }
}