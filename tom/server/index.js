const express = require('express');
const cors = require('cors');
const chessServer = require('./chess-server');

const app = express();
const port = process.env.PORT || 5050;

// CORS configuration
app.use(
    cors({
        origin: '*', // https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-5051.app.github.dev
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
        credentials: false,
    })
);

app.options('*', cors());
app.use(express.json());

// Debugging middleware
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Initialize the chess server
chessServer.initializeServer()
    .then(() => console.log('[DEBUG] Chess server initialized successfully'))
    .catch(err => console.error('[DEBUG] Failed to initialize chess server:', err));

// API Routes
// Create new puzzle game
app.post('/api/puzzle/new', (req, res) => {
    try {
        const { playerId, targetRating } = req.body;
        if (!playerId) {
            return res.status(400).json({ error: 'Player ID is required' });
        }
        
        const game = chessServer.createNewPuzzleGame(playerId, targetRating);
        console.log(`[DEBUG] New game created for player ${playerId}`);
        res.json(game);
    } catch (error) {
        console.error('[DEBUG] Error creating new game:', error);
        res.status(500).json({ error: error.message, code: error.code });
    }
});

// Make a move
app.post('/api/puzzle/:gameId/move', (req, res) => {
    try {
        const { gameId } = req.params;
        const { from, to, promotion } = req.body;
        
        if (!from || !to) {
            return res.status(400).json({ error: 'From and to squares are required' });
        }

        const result = chessServer.handleMove(gameId, from, to, promotion);
        console.log(`[DEBUG] Move handled for game ${gameId}`);
        res.json(result);
    } catch (error) {
        console.error('[DEBUG] Error handling move:', error);
        res.status(error.code === 'GAME_NOT_FOUND' ? 404 : 500)
           .json({ error: error.message, code: error.code });
    }
});

// Get game state
app.get('/api/puzzle/:gameId/state', (req, res) => {
    try {
        const { gameId } = req.params;
        const state = chessServer.getGameState(gameId);
        res.json(state);
    } catch (error) {
        console.error('[DEBUG] Error getting game state:', error);
        res.status(error.code === 'GAME_NOT_FOUND' ? 404 : 500)
           .json({ error: error.message, code: error.code });
    }
});

// Get user stats
app.get('/api/stats/:playerId', (req, res) => {
    try {
        const { playerId } = req.params;
        const stats = chessServer.getUserStats(playerId);
        res.json(stats);
    } catch (error) {
        console.error('[DEBUG] Error getting user stats:', error);
        res.status(500).json({ error: error.message, code: error.code });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Chess Puzzle API',
        endpoints: {
            createGame: 'POST /api/puzzle/new',
            makeMove: 'POST /api/puzzle/:gameId/move',
            getState: 'GET /api/puzzle/:gameId/state',
            getStats: 'GET /api/stats/:playerId'
        }
    });
});
/*
// In your Express server file
app.use((req, res, next) => {
    if (req.url.endsWith('.wasm')) {
      res.set('Content-Type', 'application/wasm', 'application/javascript');
    }
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
  });
*/
// Error handlers
app.use((req, res) => {
    console.log(`[DEBUG] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('[DEBUG] Server Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Something went wrong!',
        code: err.code
    });
});

// Server startup
const server = app.listen(port, () => {
    console.log(`[DEBUG] Chess server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[DEBUG] SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('[DEBUG] HTTP server closed');
        process.exit(0);
    });
});

module.exports = server; // For testing purposes