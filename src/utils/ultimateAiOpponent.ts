// AI Opponent for Ultimate Tic Tac Toe using strategic evaluation

export type Difficulty = 'easy' | 'medium' | 'hard';

type Player = 'X' | 'O' | null;
type SmallBoard = Player[];
type BigBoard = SmallBoard[];

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

const checkSmallBoardWinner = (board: Player[]): Player => {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const isBoardFull = (board: Player[]): boolean => {
  return board.every(cell => cell !== null);
};

const checkBigBoardWinner = (boardWinners: Player[]): Player => {
  return checkSmallBoardWinner(boardWinners);
};

interface GameState {
  boards: BigBoard;
  boardWinners: Player[];
  activeBoard: number | null;
}

interface Move {
  boardIndex: number;
  cellIndex: number;
}

const getAvailableMoves = (state: GameState): Move[] => {
  const moves: Move[] = [];
  
  for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
    // Check if this board is playable
    if (state.boardWinners[boardIndex]) continue;
    if (state.activeBoard !== null && state.activeBoard !== boardIndex) continue;
    if (isBoardFull(state.boards[boardIndex])) continue;
    
    for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
      if (state.boards[boardIndex][cellIndex] === null) {
        moves.push({ boardIndex, cellIndex });
      }
    }
  }
  
  return moves;
};

const simulateMove = (state: GameState, move: Move, player: Player): GameState => {
  const newBoards = state.boards.map((board, i) => 
    i === move.boardIndex 
      ? board.map((cell, j) => j === move.cellIndex ? player : cell)
      : [...board]
  );
  
  const newBoardWinners = [...state.boardWinners];
  const smallBoardWinner = checkSmallBoardWinner(newBoards[move.boardIndex]);
  if (smallBoardWinner) {
    newBoardWinners[move.boardIndex] = smallBoardWinner;
  }
  
  // Determine next active board
  let nextActiveBoard: number | null = move.cellIndex;
  if (newBoardWinners[nextActiveBoard] || isBoardFull(newBoards[nextActiveBoard])) {
    nextActiveBoard = null;
  }
  
  return {
    boards: newBoards,
    boardWinners: newBoardWinners,
    activeBoard: nextActiveBoard,
  };
};

// Evaluate a position for the AI (positive = good for O/AI)
const evaluatePosition = (state: GameState): number => {
  const bigWinner = checkBigBoardWinner(state.boardWinners);
  if (bigWinner === 'O') return 10000;
  if (bigWinner === 'X') return -10000;
  
  let score = 0;
  
  // Score for won small boards
  for (let i = 0; i < 9; i++) {
    if (state.boardWinners[i] === 'O') {
      score += 100;
      // Strategic positions worth more (center, corners)
      if (i === 4) score += 50; // Center
      if ([0, 2, 6, 8].includes(i)) score += 25; // Corners
    } else if (state.boardWinners[i] === 'X') {
      score -= 100;
      if (i === 4) score -= 50;
      if ([0, 2, 6, 8].includes(i)) score -= 25;
    }
  }
  
  // Score for potential wins on big board
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    const values = [state.boardWinners[a], state.boardWinners[b], state.boardWinners[c]];
    const oCount = values.filter(v => v === 'O').length;
    const xCount = values.filter(v => v === 'X').length;
    const nullCount = values.filter(v => v === null).length;
    
    // Two in a row with one empty
    if (oCount === 2 && nullCount === 1) score += 200;
    if (xCount === 2 && nullCount === 1) score -= 200;
    
    // One in a row with two empty
    if (oCount === 1 && nullCount === 2) score += 20;
    if (xCount === 1 && nullCount === 2) score -= 20;
  }
  
  // Score for small board positions
  for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
    if (state.boardWinners[boardIndex]) continue;
    
    const board = state.boards[boardIndex];
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      const values = [board[a], board[b], board[c]];
      const oCount = values.filter(v => v === 'O').length;
      const xCount = values.filter(v => v === 'X').length;
      const nullCount = values.filter(v => v === null).length;
      
      if (oCount === 2 && nullCount === 1) score += 10;
      if (xCount === 2 && nullCount === 1) score -= 10;
      if (oCount === 1 && nullCount === 2) score += 2;
      if (xCount === 1 && nullCount === 2) score -= 2;
    }
  }
  
  return score;
};

// Minimax with alpha-beta pruning (limited depth for performance)
const minimax = (
  state: GameState,
  depth: number,
  maxDepth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number => {
  const bigWinner = checkBigBoardWinner(state.boardWinners);
  if (bigWinner === 'O') return 10000 - depth;
  if (bigWinner === 'X') return -10000 + depth;
  
  const moves = getAvailableMoves(state);
  if (moves.length === 0 || depth >= maxDepth) {
    return evaluatePosition(state);
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newState = simulateMove(state, move, 'O');
      const evaluation = minimax(newState, depth + 1, maxDepth, false, alpha, beta);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newState = simulateMove(state, move, 'X');
      const evaluation = minimax(newState, depth + 1, maxDepth, true, alpha, beta);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getBestMove = (state: GameState, maxDepth: number): Move | null => {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return null;
  
  let bestMove = moves[0];
  let bestValue = -Infinity;
  
  for (const move of moves) {
    const newState = simulateMove(state, move, 'O');
    const value = minimax(newState, 0, maxDepth, false, -Infinity, Infinity);
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  
  return bestMove;
};

const getRandomMove = (state: GameState): Move | null => {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
};

const getStrategicRandomMove = (state: GameState): Move | null => {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return null;
  
  // Prefer center and corners
  const preferredCells = [4, 0, 2, 6, 8];
  const preferredMoves = moves.filter(m => preferredCells.includes(m.cellIndex));
  
  if (preferredMoves.length > 0 && Math.random() < 0.6) {
    return preferredMoves[Math.floor(Math.random() * preferredMoves.length)];
  }
  
  return moves[Math.floor(Math.random() * moves.length)];
};

export const getUltimateAIMove = (
  boards: BigBoard,
  boardWinners: Player[],
  activeBoard: number | null,
  difficulty: Difficulty
): Move | null => {
  const state: GameState = { boards, boardWinners, activeBoard };
  const moves = getAvailableMoves(state);
  
  if (moves.length === 0) return null;
  
  switch (difficulty) {
    case 'easy':
      return getStrategicRandomMove(state);
    case 'medium':
      // 60% chance optimal, 40% random
      if (Math.random() < 0.6) {
        return getBestMove(state, 2) || getRandomMove(state);
      }
      return getStrategicRandomMove(state);
    case 'hard':
      return getBestMove(state, 4) || getRandomMove(state);
    default:
      return getBestMove(state, 3);
  }
};
