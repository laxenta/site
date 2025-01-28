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
        const BATCH_SIZE = 1000;
        let currentBatch = [];

        const processBatch = () => {
            puzzles.push(...currentBatch);
            currentBatch = [];
        };

        fs.createReadStream('/workspaces/site/tom/src/assets/lichess_db_puzzle.csv')
            .pipe(csv({
                headers: ['PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation', 'Popularity', 'NbPlays', 'Themes', 'GameUrl'],
                separator: ',',
                skipLines: 0
            }))
            .on('data', (data) => {
                try {
                    // Validate and process puzzle data
                    const chess = new Chess();
                    if (!chess.load(data.FEN)) {
                        console.warn(`Invalid FEN in puzzle ${data.PuzzleId}`);
                        return;
                    }

                    // Process moves - split and clean
                    const moves = data.Moves.trim().split(' ').filter(move => move.length > 0);

                    const processedPuzzle = {
                        id: data.PuzzleId,
                        fen: data.FEN,
                        board: parseFENToUnicodeBoard(data.FEN),
                        moves: moves,
                        rating: parseInt(data.Rating) || 1500,
                        themes: data.Themes ? data.Themes.split(' ').filter(theme => theme.length > 0) : [],
                        timeAdded: Date.now(),
                        gameUrl: data.GameUrl,
                        popularity: parseInt(data.Popularity) || 0,
                        nbPlays: parseInt(data.NbPlays) || 0
                    };

                    // Validate puzzle has required fields
                    if (!processedPuzzle.id || !processedPuzzle.fen || !processedPuzzle.moves.length) {
                        console.warn(`Skipping incomplete puzzle: ${data.PuzzleId}`);
                        return;
                    }

                    currentBatch.push(processedPuzzle);

                    if (currentBatch.length >= BATCH_SIZE) {
                        processBatch();
                    }
                } catch (error) {
                    console.warn(`Error processing puzzle ${data.PuzzleId}: ${error.message}`);
                }
            })
            .on('end', () => {
                if (currentBatch.length > 0) {
                    processBatch();
                }
                console.log(`Successfully loaded ${puzzles.length} puzzles`);
                // Log a sample puzzle to verify format
                if (puzzles.length > 0) {
                    console.log('Sample puzzle:', JSON.stringify(puzzles[0], null, 2));
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


// Create a new puzzle game
const createNewPuzzleGame = (playerId, targetRating = 1500) => {
    try {
        const ratingRange = 100;
        const eligiblePuzzles = puzzles.filter(puzzle => 
            Math.abs(puzzle.rating - targetRating) <= ratingRange
        );

        if (eligiblePuzzles.length === 0) {
            throw new ChessServerError('No puzzles found in rating range', 'NO_PUZZLES_FOUND');
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