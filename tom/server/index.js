const express = require('express');
const cors = require('cors');
const chessServer = require('./chess-server');

const app = express();
const port = process.env.PORT || 5050;

// Allow CORS from any origin for public accessibility
app.use(cors({
    origin: "*", // For development; refine for production
}));

app.use(express.json());

// Debugging middleware to log all requests
app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
    next();
});

let puzzles = [];

// Load chess puzzles on startup
chessServer.loadPuzzles()
    .then(loadedPuzzles => {
        puzzles = loadedPuzzles;
        console.log('[DEBUG] Chess puzzles loaded successfully');
    })
    .catch(err => console.error('[DEBUG] Failed to load chess puzzles:', err));

// Route to get a random puzzle (GET method)
app.get('/api/random', (req, res) => {
    console.log('[DEBUG] Handling GET /api/random');
    if (puzzles.length === 0) {
        console.log('[DEBUG] No puzzles available');
        return res.status(503).json({ error: 'No puzzles available. Try again later.' });
    }
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    console.log('[DEBUG] Sending random puzzle:', randomPuzzle);
    res.json(randomPuzzle);
});

// Route to get a random puzzle (POST method)
app.post('/api/random', (req, res) => {
    console.log('[DEBUG] Handling POST /api/random');
    if (puzzles.length === 0) {
        console.log('[DEBUG] No puzzles available');
        return res.status(503).json({ error: 'No puzzles available. Try again later.' });
    }
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    console.log('[DEBUG] Sending random puzzle:', randomPuzzle);
    res.json(randomPuzzle);
});

// Root route
app.get('/', (req, res) => {
    console.log('[DEBUG] Handling GET /');
    res.send('Welcome to the Chess Puzzle API! Use /api/random to get a random puzzle.');
});

// Error handler for unmatched routes
app.use((req, res) => {
    console.log(`[DEBUG] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// General error handler
app.use((err, req, res, next) => {
    console.error('[DEBUG] Server Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message,
    });
});

// Start the server
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
