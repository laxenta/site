const { Chess } = require('chess.js');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

// Custom error class for better error handling
class ChessServerError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.timestamp = new Date().toISOString();
    }
}

// Unicode representation of chess pieces
const PIECE_UNICODE = {
    'w': {
        'k': '♔',
        'q': '♕',
        'r': '♖',
        'b': '♗',
        'n': '♘',
        'p': '♙'
    },
    'b': {
        'k': '♚',
        'q': '♛',
        'r': '♜',
        'b': '♝',
        'n': '♞',
        'p': '♟'
    }
};

// Main data stores
const games = {};
const puzzles = [];
const userPuzzleStats = {};
const puzzleCache = new Map();
const MAX_CACHE_SIZE = 1000;
const PUZZLE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes


// Load puzzles from CSV file
const loadPuzzles = () => {
    return new Promise((resolve, reject) => {
        const puzzleData = [];
        fs.createReadStream('/workspaces/site/tom/src/assets/lichess_db_puzzle.csv')
            .pipe(csv({
                skipLines: 0,
                headers: ['PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation', 'Popularity', 'NbPlays', 'Themes', 'GameUrl']
            }))
            .on('data', (data) => {
                try {
                    // Only process if we have the minimum required data
                    if (data.FEN && data.Moves) {
                        const processedPuzzle = {
                            id: data.PuzzleId || uuidv4(),
                            fen: data.FEN,
                            board: parseFENToUnicodeBoard(data.FEN),
                            moves: data.Moves.split(' ').filter(move => move.length > 0),
                            rating: parseInt(data.Rating) || 1500,
                            themes: data.Themes ? data.Themes.split(' ').filter(theme => theme.length > 0) : [],
                            solution: data.Moves.split(' ').filter(move => move.length > 0)
                        };
                        puzzleData.push(processedPuzzle);

                        // Add this after processing a puzzle
                        if (puzzleData.length === 0 || puzzleData.length === 1) {
                            console.log('Sample processed puzzle:', {
                                id: processedPuzzle.id,
                                fen: processedPuzzle.fen,
                                moves: processedPuzzle.moves,  // Should be like ['f2g3', 'e6e7', 'b2b1', ...]
                                solution: processedPuzzle.solution  // Same as moves
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Skipping puzzle due to error: ${error.message}`);
                }
            })
            .on('end', () => {
                puzzles.push(...puzzleData);
                console.log(`Loaded ${puzzles.length} puzzles successfully.`);
                // Log first puzzle as a sample to verify format
                if (puzzles.length > 0) {
                    console.log('Sample puzzle:', {
                        id: puzzles[0].id,
                        fen: puzzles[0].fen,
                        moves: puzzles[0].moves,
                        solution: puzzles[0].solution  // Same as moves

                    });
                }
                resolve(puzzles);
            })
            .on('error', (error) => {
                console.error('Error loading puzzles:', error);
                reject(error);
            });
    });
};

// Helper function to parse FEN to Unicode board
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


// Create a new puzzle game with a fallback to a random puzzle
const createNewPuzzleGame = (playerId, targetRating = 1500) => {
    try {
        const ratingRange = 100;
        let eligiblePuzzles = puzzles.filter(puzzle =>
            Math.abs(puzzle.rating - targetRating) <= ratingRange
        );

        // If no puzzles found in the rating range, fallback to all puzzles
        if (eligiblePuzzles.length === 0) {
            console.warn('No puzzles found in the target rating range, selecting from all puzzles.');
            eligiblePuzzles = puzzles;
        }

        if (eligiblePuzzles.length === 0) {
            throw new ChessServerError('No puzzles available', 'NO_PUZZLES_FOUND');
        }

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
            completed: false,
            moveHistory: []
        };

        return {
            gameId,
            board: chess.board(),
            turn: chess.turn(),
            fen: chess.fen(),
            puzzleRating: puzzle.rating,
            unicodePieces: getUnicodePieces(chess.board())
        };
    } catch (error) {
        console.error('Error creating new game:', error);
        throw new ChessServerError(error.message, 'GAME_CREATION_ERROR');
    }
};

// Handle a move in the game
const handleMove = (gameId, from, to, promotion = 'q') => {
    try {
        const game = games[gameId];
        if (!game) {
            throw new ChessServerError('Game not found', 'GAME_NOT_FOUND');
        }

        if (game.completed) {
            throw new ChessServerError('Puzzle already completed', 'PUZZLE_COMPLETED');
        }

        const moveStart = Date.now();
        const move = game.chess.move({ from, to, promotion });

        if (!move) {
            throw new ChessServerError('Invalid move', 'INVALID_MOVE');
        }

        game.attempts++;
        game.moveHistory.push({
            move,
            timestamp: moveStart,
            timeSpent: Date.now() - moveStart
        });

        const expectedMove = game.puzzle.moves[game.currentMoveIndex];
        const isCorrectMove = moveToString(move) === expectedMove;

        if (!isCorrectMove) {
            game.chess.undo();
            return {
                isCorrect: false,
                message: 'Incorrect move. Try again!',
                board: game.chess.board(),
                fen: game.chess.fen(),
                unicodePieces: getUnicodePieces(game.chess.board()),
                hints: generateHints(game)
            };
        }

        game.currentMoveIndex++;

        // Make opponent's move if necessary
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

    } catch (error) {
        console.error('Error handling move:', error);
        throw new ChessServerError(error.message, error.code || 'MOVE_ERROR');
    }
};

// Helper functions
const moveToString = (move) => `${move.from}${move.to}${move.promotion || ''}`;

const getUnicodePieces = (board) => {
    return board.map(row =>
        row.map(square =>
            square ? PIECE_UNICODE[square.color][square.type] : ' '
        )
    );
};

const generateHints = (game) => {
    const currentPuzzleMove = game.puzzle.moves[game.currentMoveIndex];
    const fromSquare = currentPuzzleMove.substring(0, 2);
    const piece = game.chess.get(fromSquare);

    return {
        pieceType: piece?.type,
        fromSquare,
        possibleSquares: game.chess.moves({ square: fromSquare, verbose: true })
            .map(move => move.to)
    };
};

// User statistics management
const updateUserStats = (playerId, game) => {
    if (!userPuzzleStats[playerId]) {
        userPuzzleStats[playerId] = {
            totalPuzzles: 0,
            completedPuzzles: 0,
            averageAttempts: 0,
            ratings: [],
            history: [],
            lastPlayed: null
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
    stats.lastPlayed = new Date().toISOString();
    stats.history.push({
        puzzleId: game.puzzle.id,
        rating: game.puzzle.rating,
        attempts: game.attempts,
        timeSpent: Date.now() - game.startTime,
        completedAt: stats.lastPlayed
    });
};

const getUserStats = (playerId) => {
    const stats = userPuzzleStats[playerId] || {
        totalPuzzles: 0,
        completedPuzzles: 0,
        averageAttempts: 0,
        ratings: [],
        history: [],
        lastPlayed: null
    };

    return {
        ...stats,
        averageRating: stats.ratings.length > 0
            ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length
            : 0
    };
};

// Game state and management
const getGameState = (gameId) => {
    const game = games[gameId];
    if (!game) {
        throw new ChessServerError('Game not found', 'GAME_NOT_FOUND');
    }

    return {
        board: game.chess.board(),
        turn: game.chess.turn(),
        fen: game.chess.fen(),
        isGameOver: game.chess.game_over(),
        isCheck: game.chess.in_check(),
        isPuzzleCompleted: game.completed,
        puzzleRating: game.puzzle.rating,
        attempts: game.attempts,
        unicodePieces: getUnicodePieces(game.chess.board()),
        moveHistory: game.moveHistory
    };
};

// Cleanup expired games
const cleanupGames = () => {
    const now = Date.now();
    Object.keys(games).forEach(gameId => {
        if (now - games[gameId].startTime > PUZZLE_EXPIRY_TIME) {
            delete games[gameId];
        }
    });
};

// Run cleanup every hour
setInterval(cleanupGames, 60 * 60 * 1000);

// Initialize the server
const initializeServer = async () => {
    try {
        await loadPuzzles();
        console.log('Chess server initialized successfully');
    } catch (error) {
        console.error('Failed to initialize chess server:', error);
        throw error;
    }
};

// Export all necessary functions
module.exports = {
    initializeServer,
    createNewPuzzleGame,
    handleMove,
    getGameState,
    getUserStats,
    PIECE_UNICODE,
    loadPuzzles
};