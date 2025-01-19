const express = require('express');
const cors = require('cors');
const chessServer = require('./chess-server');

const app = express();
const port = process.env.PORT || 5050;

// Allow CORS from any origin for public accessibility
app.use(cors({
    origin: '*',
    credentials: false, // Credentials like cookies won't be needed for public API
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

let puzzles = [];

chessServer.loadPuzzles()
    .then(loadedPuzzles => {
        puzzles = loadedPuzzles;
        console.log('Chess puzzles loaded successfully');
    })
    .catch(err => console.error('Failed to load chess puzzles:', err));

// API route to get a random puzzle
app.get('/api/random', (req, res) => {
    if (puzzles.length === 0) {
        return res.status(503).json({ error: 'No puzzles available. Try again later.' });
    }
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    res.json(randomPuzzle);
});

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Chess Puzzle API! Use /api/random to get a random puzzle.');
});

// Error handlers
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(port, () => {
    console.log(`Chess server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});