// AI Opponent using Minimax Algorithm

export type Difficulty = 'easy' | 'medium' | 'hard';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

const checkWinner = (board: (string | null)[]): string | null => {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const getAvailableMoves = (board: (string | null)[]): number[] => {
  return board.reduce<number[]>((moves, cell, index) => {
    if (cell === null) moves.push(index);
    return moves;
  }, []);
};

const minimax = (
  board: (string | null)[],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number => {
  const winner = checkWinner(board);
  
  if (winner === 'O') return 10 - depth; // AI wins
  if (winner === 'X') return depth - 10; // Player wins
  
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return 0; // Draw

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      const evaluation = minimax(newBoard, depth + 1, false, alpha, beta);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = 'X';
      const evaluation = minimax(newBoard, depth + 1, true, alpha, beta);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getBestMove = (board: (string | null)[]): number => {
  const availableMoves = getAvailableMoves(board);
  let bestMove = availableMoves[0];
  let bestValue = -Infinity;

  for (const move of availableMoves) {
    const newBoard = [...board];
    newBoard[move] = 'O';
    const moveValue = minimax(newBoard, 0, false, -Infinity, Infinity);
    if (moveValue > bestValue) {
      bestValue = moveValue;
      bestMove = move;
    }
  }

  return bestMove;
};

const getRandomMove = (board: (string | null)[]): number => {
  const availableMoves = getAvailableMoves(board);
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};

const getMediumMove = (board: (string | null)[]): number => {
  // 70% chance to make optimal move, 30% random
  if (Math.random() < 0.7) {
    return getBestMove(board);
  }
  return getRandomMove(board);
};

export const getAIMove = (board: (string | null)[], difficulty: Difficulty): number => {
  const availableMoves = getAvailableMoves(board);
  
  if (availableMoves.length === 0) {
    throw new Error('No available moves');
  }

  switch (difficulty) {
    case 'easy':
      return getRandomMove(board);
    case 'medium':
      return getMediumMove(board);
    case 'hard':
      return getBestMove(board);
    default:
      return getBestMove(board);
  }
};

// Get move predictions with scores for visualization
export const getMovePredictions = (board: (string | null)[], difficulty: Difficulty): Map<number, number> => {
  const availableMoves = getAvailableMoves(board);
  const predictions = new Map<number, number>();
  
  if (availableMoves.length === 0) return predictions;

  if (difficulty === 'easy') {
    // Random distribution for easy mode
    availableMoves.forEach(move => {
      predictions.set(move, 1 / availableMoves.length);
    });
  } else {
    // Calculate minimax scores for each move
    const scores: { move: number; score: number }[] = [];
    
    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      const score = minimax(newBoard, 0, false, -Infinity, Infinity);
      scores.push({ move, score });
    }

    // Normalize scores to probabilities
    const maxScore = Math.max(...scores.map(s => s.score));
    const minScore = Math.min(...scores.map(s => s.score));
    const range = maxScore - minScore || 1;

    scores.forEach(({ move, score }) => {
      // Higher score = more likely to be chosen
      const normalized = (score - minScore) / range;
      const probability = difficulty === 'medium' 
        ? 0.3 + normalized * 0.4  // Medium: more spread
        : 0.1 + normalized * 0.8; // Hard: concentrate on best
      predictions.set(move, probability);
    });
  }

  return predictions;
};
