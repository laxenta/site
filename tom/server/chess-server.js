const { Chess } = require('chess.js');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

// Configuration, removing comments, cz i think the code is mostly done eh...
const CONFIG = {
    MAX_CACHE_SIZE: 1000,
    PUZZLE_EXPIRY_TIME: 30 * 60 * 1000,
    LICHESS_API_TOKEN: process.env.LICHESS_API_TOKEN || 'i removed it, get it yrself ni-', //i shall not forget to rm this shit from here ( i won't)
    CLEANUP_INTERVAL: 60 * 60 * 1000
};
const multiplayerGames = {};

class ChessServerError extends Error {
    constructor(message, code, details = null) {
        super(message);
        this.name = 'ChessServerError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

const PIECE_UNICODE = {
    'w': {
        'k': '♔', 'q': '♕', 'r': '♖',
        'b': '♗', 'n': '♘', 'p': '♙'
    },
    'b': {
        'k': '♚', 'q': '♛', 'r': '♜',
        'b': '♝', 'n': '♞', 'p': '♟'
    }
};

const games = {};
const puzzles = [];
const userPuzzleStats = {};
const puzzleCache = new Map();
const moveQueues = {};

// Helper Functions
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

// Position Analysis Functions
const analyzeLichessPosition = async (fen) => {
    try {
        const response = await fetch(
            `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${CONFIG.LICHESS_API_TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Lichess API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            score: data.pvs[0].cp / 100,
            bestMove: data.pvs[0].moves.split(' ')[0],
            depth: data.depth,
            line: data.pvs[0].moves.split(' ')
        };
    } catch (error) {
        console.warn('Lichess analysis failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const makeRandomMove = (chess) => {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
};

// FEN parser
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
        fs.createReadStream('/workspaces/site/tom/src/assets/lichess_db_puzzle.csv')
            .pipe(csv({
                skipLines: 0,
                headers: ['PuzzleId', 'FEN', 'Moves', 'Rating', 'RatingDeviation', 'Popularity', 'NbPlays', 'Themes', 'GameUrl']
            }))
            .on('data', (data) => {
                try {
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
                    }
                } catch (error) {
                    console.warn(`Skipping puzzle due to error: ${error.message}`);
                }
            })
            .on('end', () => {
                puzzles.push(...puzzleData);
                console.log(`Loaded ${puzzles.length} puzzles successfully.`);
                if (puzzles.length > 0) {
                    console.log('Sample puzzle:', {
                        id: puzzles[0].id,
                        fen: puzzles[0].fen,
                        moves: puzzles[0].moves,
                        solution: puzzles[0].solution
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

// Game Management Functions
const createNewPuzzleGame = (playerId, targetRating = 1500) => {
    try {
        const ratingRange = 100;
        let eligiblePuzzles = puzzles.filter(puzzle =>
            Math.abs(puzzle.rating - targetRating) <= ratingRange
        );

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
// this creates an empty instance of thegame i am pretty sure ;-) very helpful for me
const createFreePlayGame = (playerId) => {
    const gameId = uuidv4();
    games[gameId] = {
        chess: new Chess(),
        playerId,
        startTime: Date.now(),
        moveHistory: [],
        completed: false,
        // We'll use opponentId to track if someone has joined this game
        opponentId: null
    };

    return {
        gameId,
        board: games[gameId].chess.board(),
        turn: games[gameId].chess.turn(),
        fen: games[gameId].chess.fen(),
        unicodePieces: getUnicodePieces(games[gameId].chess.board())
    };
};
const joinGame = (playerId) => {
    let existingGame = null;
    for (const gameId in games) {
        const game = games[gameId];
        if (game.playerId && !game.opponentId && game.playerId !== playerId) {
            existingGame = game;
            game.opponentId = playerId;
            break;
        }
    }
    if (!existingGame) {
        const freePlayGame = createFreePlayGame(playerId);
        games[freePlayGame.gameId].opponentId = null;
        existingGame = games[freePlayGame.gameId];
    }
    return existingGame;
};

// change it in future, causing tons of fucing cors authentication issues

const handleMove = async (gameId, from, to, promotion = 'q') => {
    return new Promise((resolve, reject) => {
        try {
            if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
                throw new ChessServerError('Invalid move format', 'INVALID_INPUT');
            }
            const squareRegex = /^[a-h][1-8]$/;
            if (!squareRegex.test(from) || !squareRegex.test(to)) {
                throw new ChessServerError('Invalid square notation', 'INVALID_SQUARE_FORMAT');
            }
            const game = games[gameId];
            if (!game) {
                throw new ChessServerError('Game not found', 'GAME_NOT_FOUND');
            }
            // initialize move queue for this game if it doesn't exist
            if (!moveQueues[gameId]) {
                moveQueues[gameId] = [];
            }
            // add move to queue
            moveQueues[gameId].push({ from, to, promotion, resolve, reject });
            // process queue if this is the first move
            if (moveQueues[gameId].length === 1) {
                processNextMove(gameId);
            }
        } catch (error) {
            reject(error);
        }
    });
};

const processNextMove = async (gameId) => {
    const game = games[gameId];
    const queue = moveQueues[gameId];

    if (!queue || queue.length === 0 || !game) return;

    const { from, to, promotion, resolve, reject } = queue[0];

    try {
        const piece = game.chess.get(from);
        const isLastRank = (piece?.type === 'p' &&
            ((piece.color === 'w' && to[1] === '8') ||
             (piece.color === 'b' && to[1] === '1')));
        const moveObj = {
            from,
            to,
            promotion: isLastRank ? (promotion || 'q') : undefined
        };
        // Attempt the move, ;4
        const move = game.chess.move(moveObj);

        if (!move) {
            resolve({
                isCorrect: false,
                error: 'Invalid move',
                board: game.chess.board(),
                turn: game.chess.turn(),
                fen: game.chess.fen(),
                isGameOver: game.chess.isGameOver(),
                isPuzzleCompleted: game.completed,
                unicodePieces: getUnicodePieces(game.chess.board()),
                moveHistory: game.moveHistory.map(hist => ({
                    move: hist.move,
                    san: hist.move?.san,
                    isComputerMove: hist.isComputerMove || false,
                    moveNumber: Math.floor((game.moveHistory.indexOf(hist) + 2) / 2)
                })),
                timestamp: new Date().toISOString()
            });
            return;
        }

        // Handle analysis asynchronously (fire and forget)
        let analysis = null;
        analyzeLichessPosition(game.chess.fen())
            .then(result => {
                analysis = result;
                if (analysis?.success) {
                    game.moveHistory[game.moveHistory.length - 1].analysis = analysis;
                }
            })
            .catch(error => {
                console.warn('Analysis failed:', error);
            });

        // Record move immediately
        const moveRecord = {
            move,
            timestamp: Date.now(),
            analysis: null
        };
        game.moveHistory.push(moveRecord);

        let computerMove = null;
        if (game.completed || !game.puzzle) {
            try {
                computerMove = makeRandomMove(game.chess);
                if (computerMove) {
                    game.chess.move(computerMove);
                    game.moveHistory.push({
                        move: computerMove,
                        timestamp: Date.now(),
                        isComputerMove: true
                    });
                }
            } catch (error) {
                console.warn('Computer move failed:', error);
            }
        }

        // Prepare response after preocessing of uh move
        // e
           const response = {
            isCorrect: true,
            board: game.chess.board(),
            move,
            computerMove,
            turn: game.chess.turn(),
            fen: game.chess.fen(),
            isGameOver: game.chess.isGameOver(),
            isPuzzleCompleted: game.completed,
            unicodePieces: getUnicodePieces(game.chess.board()),
            moveHistory: game.moveHistory.map(hist => ({
                move: hist.move,
                evaluation: hist.analysis?.score ? Number(hist.analysis.score.toFixed(1)) : null,
                san: hist.move.san,
                bestMove: hist.analysis?.bestMove || null,
                isComputerMove: hist.isComputerMove || false,
                moveNumber: Math.floor((game.moveHistory.indexOf(hist) + 2) / 2)
            })),
            timestamp: new Date().toISOString()
        };

        resolve(response);
    } catch (error) {
        console.warn('Move processing error:', error);
        resolve({
            isCorrect: false,
            error: 'Move processing error',
            board: game.chess.board(),
            turn: game.chess.turn(),
            fen: game.chess.fen(),
            isGameOver: game.chess.isGameOver(),
            isPuzzleCompleted: game.completed,
            unicodePieces: getUnicodePieces(game.chess.board()),
            timestamp: new Date().toISOString()
        });
    } finally {
        queue.shift();
        if (queue.length > 0) {
            setTimeout(() => processNextMove(gameId), 50);
        }
    }
};

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
        puzzleRating: game.puzzle?.rating,
        attempts: game.attempts,
        unicodePieces: getUnicodePieces(game.chess.board()),
        moveHistory: game.moveHistory
    };
};

const cleanupGames = () => {
    const now = Date.now();
    Object.keys(games).forEach(gameId => {
        if (now - games[gameId].startTime > CONFIG.PUZZLE_EXPIRY_TIME) {
            delete games[gameId];
            delete moveQueues[gameId];
        }
    });
};

const initializeServer = async () => {
    try {
        await loadPuzzles();
        setInterval(cleanupGames, CONFIG.CLEANUP_INTERVAL);
        console.log('Chess server initialized successfully');
    } catch (error) {
        console.error('Failed to initialize chess server:', error);
        throw error;
    }
};

module.exports = {
    initializeServer,
    createNewPuzzleGame, 
    createFreePlayGame,
    joinGame,          // NEW: we export joinGame for free-play mode in server.js
    handleMove,
    getGameState,
    getUserStats,
    PIECE_UNICODE,
    loadPuzzles
};