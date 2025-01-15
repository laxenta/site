const { Chess } = require('chess.js');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid'); // For unique IDs

// Chess piece Unicode representations
const PIECE_UNICODE = {
    'w': {
        'k': '♔', // White King
        'q': '♕', // White Queen
        'r': '♖', // White Rook
        'b': '♗', // White Bishop
        'n': '♘', // White Knight
        'p': '♙'  // White Pawn
    },
    'b': {
        'k': '♚', // Black King
        'q': '♛', // Black Queen
        'r': '♜', // Black Rook
        'b': '♝', // Black Bishop
        'n': '♞', // Black Knight
        'p': '♟'  // Black Pawn
    }
};

// Game state storage
const games = {};
let puzzles = [];

// Puzzle tracking for users
const userPuzzleStats = {};

// Load and process puzzles from CSV
const loadPuzzles = () => {
    return new Promise((resolve, reject) => {
        const puzzleData = [];
        fs.createReadStream('/workspaces/a-cool-lil-site/tom/src/assets/lichess_db_puzzle.csv')
            .pipe(csv())
            .on('data', (data) => {
                // Process and structure puzzle data
                const processedPuzzle = {
                    id: data.PuzzleId || uuidv4(),
                    fen: data.FEN,
                    moves: data.Moves.split(' '),
                    rating: parseInt(data.Rating) || 1500,
                    themes: data.Themes ? data.Themes.split(' ') : [],
                    initialMove: data.InitialMove || null,
                    solution: data.Solution ? data.Solution.split(' ') : []
                };
                puzzleData.push(processedPuzzle);
            })
            .on('end', () => {
                puzzles = puzzleData;
                console.log(`Loaded ${puzzles.length} puzzles successfully.`);
                resolve(puzzles);
            })
            .on('error', (error) => reject(error));
    });
};

// Create new puzzle game with difficulty matching
const createNewPuzzleGame = (playerId, targetRating = 1500) => {
  // Filter puzzles close to target rating
  const ratingRange = 100;
  const eligiblePuzzles = puzzles.filter(puzzle => 
      Math.abs(puzzle.rating - targetRating) <= ratingRange
  );
  
  const puzzle = eligiblePuzzles[Math.floor(Math.random() * eligiblePuzzles.length)];
  const chess = new Chess(puzzle.fen);
  
  const gameId = uuidv4();
  games[gameId] = {
      chess,
      playerId,
      puzzle,
      currentMoveIndex: 0,
      startTime: Date.now(),
      attempts: 0,
      completed: false
  };

  return {
      gameId,
      board: chess.board(),
      turn: chess.turn(),
      fen: chess.fen(),
      puzzleRating: puzzle.rating,
      themes: puzzle.themes,
      unicodePieces: getUnicodePieces(chess.board())
  };
};

// Handle move and verify against puzzle solution
const handleMove = (gameId, from, to, promotion = 'q') => {
  const game = games[gameId];
  if (!game) throw new Error('Game not found');

  const move = game.chess.move({ from, to, promotion });
  if (!move) throw new Error('Invalid move');

  game.attempts++;
  
  // Check if move matches puzzle solution
  const expectedMove = game.puzzle.moves[game.currentMoveIndex];
  const isCorrectMove = moveToString(move) === expectedMove;

  if (!isCorrectMove) {
      // Reset position on wrong move
      game.chess.undo();
      return {
          isCorrect: false,
          message: 'Incorrect move. Try again!',
          board: game.chess.board(),
          fen: game.chess.fen(),
          unicodePieces: getUnicodePieces(game.chess.board())
      };
  }

  game.currentMoveIndex++;
  
  // Make opponent's move if not puzzle completed
  if (game.currentMoveIndex < game.puzzle.moves.length) {
      const opponentMove = game.puzzle.moves[game.currentMoveIndex];
      game.chess.move(opponentMove);
      game.currentMoveIndex++;
    }

    // Check if puzzle is completed
    const isPuzzleCompleted = game.currentMoveIndex >= game.puzzle.moves.length;
    if (isPuzzleCompleted) {
        game.completed = true;
        updateUserStats(game.playerId, game);
    }

    return {
        isCorrect: true,
        board: game.chess.board(),
        move,
        turn: game.chess.turn(),
        fen: game.chess.fen(),
        isGameOver: game.chess.game_over(),
        isPuzzleCompleted,
        unicodePieces: getUnicodePieces(game.chess.board())
    };
};

// Convert move object to string notation
const moveToString = (move) => {
    return `${move.from}${move.to}${move.promotion || ''}`;
};

// Get Unicode representation of current board
const getUnicodePieces = (board) => {
    return board.map(row => 
        row.map(square => 
            square ? PIECE_UNICODE[square.color][square.type] : ' '
        )
    );
};

// Get available legal moves for a position
const getLegalMoves = (gameId, square) => {
    const game = games[gameId];
    if (!game) throw new Error('Game not found');

    const moves = game.chess.moves({ square, verbose: true });
    return moves.map(move => ({
        from: move.from,
        to: move.to,
        piece: move.piece,
        promotion: move.promotion
    }));
};

// Get detailed game state
const getGameState = (gameId) => {
    const game = games[gameId];
    if (!game) throw new Error('Game not found');

    return {
        board: game.chess.board(),
        turn: game.chess.turn(),
        fen: game.chess.fen(),
        isGameOver: game.chess.game_over(),
        isCheck: game.chess.in_check(),
        isPuzzleCompleted: game.completed,
        puzzleRating: game.puzzle.rating,
        themes: game.puzzle.themes,
        attempts: game.attempts,
        unicodePieces: getUnicodePieces(game.chess.board())
    };
};

// Update user statistics
const updateUserStats = (playerId, game) => {
    if (!userPuzzleStats[playerId]) {
      userPuzzleStats[playerId] = {
        totalPuzzles: 0,
        completedPuzzles: 0,
        averageAttempts: 0,
        ratings: []
    };
}

const stats = userPuzzleStats[playerId];
stats.totalPuzzles++;
stats.completedPuzzles++;
stats.ratings.push(game.puzzle.rating);
stats.averageAttempts = (
    (stats.averageAttempts * (stats.completedPuzzles - 1) + game.attempts) / 
    stats.completedPuzzles
);
};

// Get user statistics
const getUserStats = (playerId) => {
return userPuzzleStats[playerId] || {
    totalPuzzles: 0,
    completedPuzzles: 0,
    averageAttempts: 0,
    ratings: []
};
};

// Hint system
const getHint = (gameId) => {
const game = games[gameId];
if (!game || game.completed) throw new Error('Game not found or completed');

const currentPuzzleMove = game.puzzle.moves[game.currentMoveIndex];
return {
    fromSquare: currentPuzzleMove.substring(0, 2),
    pieceType: game.chess.get(currentPuzzleMove.substring(0, 2))?.type
};
};

// Clean up completed games
const cleanupGames = () => {
const now = Date.now();
const expirationTime = 30 * 60 * 1000; // 30 minutes

Object.keys(games).forEach(gameId => {
    if (now - games[gameId].startTime > expirationTime) {
        delete games[gameId];
    }
});
};

setInterval(cleanupGames, 60 * 60 * 1000);

module.exports = {
loadPuzzles,
createNewPuzzleGame,
handleMove,
getGameState,
getLegalMoves,
getUserStats,
getHint,
PIECE_UNICODE
};