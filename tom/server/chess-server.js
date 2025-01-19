const { Chess } = require('chess.js');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const PIECE_UNICODE = {
    'w': {
        'k': '♔', // White King : 3
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
        'p': '♟'  // Big black mommy
    }
};

const games = {};
let puzzles = [];

const userPuzzleStats = {};

const parseFENToUnicodeBoard = (fen) => {
    const rows = fen.split(' ')[0].split('/');
    return rows.map(row => {
        let expandedRow = '';
        for (let char of row) {
            if (isNaN(char)) {
                expandedRow += char;
            } else {
                expandedRow += ' '.repeat(parseInt(char));
            }
        }
        return expandedRow.split('').map(piece => {
            if (piece === ' ') return ' ';
            const color = piece.toUpperCase() === piece ? 'w' : 'b';
            const type = piece.toLowerCase();
            return PIECE_UNICODE[color][type];
        });
    });
};

const loadPuzzles = () => {
    return new Promise((resolve, reject) => {
        const puzzleData = [];
        fs.createReadStream('./src/assets/lichess_db_puzzle.csv')
            .pipe(csv())
            .on('data', (data) => {
                const processedPuzzle = {
                    id: data.PuzzleId || uuidv4(),
                    fen: data.FEN,
                    board: parseFENToUnicodeBoard(data.FEN),
                    moves: data.Moves.split(' '),
                    rating: parseInt(data.Rating) || 1500,
                    themes: data.Themes ? data.Themes.split(' ') : [],
                    initialMove: data.InitialMove || null,
                    solution: data.Solution ? data.Solution.split(' ') : []
                };
                puzzleData.push(processedPuzzle);
            })
            .on('end', () => {
                puzzles.push(...puzzleData);
                console.log(`Loaded ${puzzles.length} puzzles successfully.`);
                resolve(puzzles);
            })
            .on('error', (error) => reject(error));
    });
};

const createNewPuzzleGame = (playerId, targetRating = 1500) => {
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

const handleMove = (gameId, from, to, promotion = 'q') => {
  const game = games[gameId];
  if (!game) throw new Error('Game not found');

  const move = game.chess.move({ from, to, promotion });
  if (!move) throw new Error('Invalid move');

  game.attempts++;
  
  const expectedMove = game.puzzle.moves[game.currentMoveIndex];
  const isCorrectMove = moveToString(move) === expectedMove;

  if (!isCorrectMove) {
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
  
  if (game.currentMoveIndex < game.puzzle.moves.length) {
      const opponentMove = game.puzzle.moves[game.currentMoveIndex];
      game.chess.move(opponentMove);
      game.currentMoveIndex++;
    }

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

const moveToString = (move) => {
    return `${move.from}${move.to}${move.promotion || ''}`;
};

const getUnicodePieces = (board) => {
    return board.map(row => 
        row.map(square => 
            square ? PIECE_UNICODE[square.color][square.type] : ' '
        )
    );
};

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

const getUserStats = (playerId) => {
return userPuzzleStats[playerId] || {
    totalPuzzles: 0,
    completedPuzzles: 0,
    averageAttempts: 0,
    ratings: []
};
};

const getHint = (gameId) => {
const game = games[gameId];
if (!game || game.completed) throw new Error('Game not found or completed');

const currentPuzzleMove = game.puzzle.moves[game.currentMoveIndex];
return {
    fromSquare: currentPuzzleMove.substring(0, 2),
    pieceType: game.chess.get(currentPuzzleMove.substring(0, 2))?.type
};
};

const cleanupGames = () => {
const now = Date.now();
const expirationTime = 30 * 60 * 1000;

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
