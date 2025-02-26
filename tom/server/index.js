const express = require('express');
const cors = require('cors');
const chessServer = require('./chess-server');
const stockfish = require('./chess-stockfish');

const app = express();
const port = process.env.PORT || 5050;

//error handler async
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
        credentials: false,
    })
);

app.use(express.json());
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

//handling
const initializeServers = async () => {
    try {
        await Promise.all([
            chessServer.initializeServer(),
            stockfish.initializeStockfish()
        ]);
        console.log('[DEBUG] All services initialized successfully');
    } catch (err) {
        console.error('[DEBUG] Service initialization error:', err);
        // don't crash, just log the error
    }
};

initializeServers();

//new mdfied API Routes with async handling
app.post('/api/puzzle/new', asyncHandler(async (req, res) => {
    const { playerId, targetRating } = req.body;
    if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
    }
    
    const game = chessServer.createNewPuzzleGame(playerId, targetRating);
    console.log(`[DEBUG] New game created for player ${playerId}`);
    res.json(game);
}));

app.post('/api/puzzle/:gameId/move', asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const { from, to, promotion } = req.body;
    
    if (!from || !to) {
        return res.status(400).json({ error: 'From and to squares are required' });
    }

    try {
        const result = await chessServer.handleMove(gameId, from, to, promotion);
        console.log(`[DEBUG] Move handled for game ${gameId}`);
        res.json(result);
    } catch (error) {
        if (error.code === 'GAME_NOT_FOUND') {
            res.status(404).json({ error: error.message, code: error.code });
        } else {
            throw error; //global error handler catch it
        }
    }
}));

app.get('/api/puzzle/:gameId/state', asyncHandler(async (req, res) => {
    const { gameId } = req.params;
    const state = chessServer.getGameState(gameId);
    res.json(state);
}));

app.get('/api/stats/:playerId', asyncHandler(async (req, res) => {
    const { playerId } = req.params;
    const stats = chessServer.getUserStats(playerId);
    res.json(stats);
}));

// Debug middleware (we keep the existing one alright)
app.use((req, res, next) => {
    console.log('[DEBUG] Request Headers:', req.headers);
    console.log('[DEBUG] Request Body:', req.body);
    console.log('[DEBUG] Request URL:', req.url);
    console.log('[DEBUG] Request Method:', req.method);
    next();
});

app.get('/api/analysis/status', asyncHandler(async (req, res) => {
    res.json({
        engineReady: stockfish.isEngineReady(),
        timestamp: new Date().toISOString()
    });
}));

app.post('/api/analysis', asyncHandler(async (req, res) => {
    console.log('[DEBUG] Received analysis request:', req.body);
    
    const { fen, depth } = req.body;
    
    if (!fen) {
        return res.status(400).json({ 
            error: 'FEN is required',
            timestamp: new Date().toISOString()
        });
    }

    if (!stockfish.isEngineReady()) {
        return res.status(503).json({ 
            error: 'Chess engine not ready',
            timestamp: new Date().toISOString()
        });
    }

    console.log('[DEBUG] Analyzing position:', fen, 'at depth:', depth);
    const analysis = await stockfish.analyzePosition(fen, depth || 15);
    
    console.log('[DEBUG] Analysis result:', analysis);
    res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
    });
}));
//just writting comments for reference
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Chess Puzzle API',
        endpoints: {
            createGame: 'POST /api/puzzle/new',
            makeMove: 'POST /api/puzzle/:gameId/move',
            getState: 'GET /api/puzzle/:gameId/state',
            getStats: 'GET /api/stats/:playerId',
            analyze: 'POST /api/analysis'
        }
    });
});

//err handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    console.error('[DEBUG] Server Error:', err);
    
    //handle chess server errors
    if (err.name === 'ChessServerError') {
        return res.status(400).json({
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
        });
    }

    // Handle other errors
    res.status(err.status || 500).json({
        error: err.message || 'Something went wrong!',
        code: err.code,
        timestamp: new Date().toISOString()
    });
});

// 404 handling (must be after all routes but before error handling)
app.use((req, res) => {
    console.log(`[DEBUG] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'Route not found',
        requestedMethod: req.method,
        requestedUrl: req.url,
        timestamp: new Date().toISOString()
    });
});

// Server startup with error handling
const server = app.listen(port, () => {
    console.log(`[DEBUG] Chess server running on port ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION]', error);
    // Don't exit the process
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]', reason);
    //don't exit the process
});

//OUR existing graceful shutdown
process.on('SIGTERM', () => {
    console.log('[DEBUG] SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('[DEBUG] HTTP server closed');
        stockfish.quitStockfish();
        process.exit(0);
    });
});

module.exports = server;// for testes : )