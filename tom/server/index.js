const express = require('express');
const cors = require('cors');
const path = require('path');
const chessServer = require('./chess-server');

const app = express();
const port = process.env.PORT || 5030; // Change the port to 5000 (or any port you prefer)
const server = app.listen(port, () => {
    console.log(`Chess server running on port ${port}`);
  });
  
// Middleware
app.use(cors({
  origin: 'http://localhost:8080', // Your Vue dev server
  credentials: true
}));
app.use(express.json());

// Initialize chess puzzles
chessServer.loadPuzzles()
  .then(() => console.log('Chess puzzles loaded successfully'))
  .catch(err => console.error('Failed to load chess puzzles:', err));

// Routes
app.post('/api/chess/new-puzzle', async (req, res) => {
  try {
    const { playerId, targetRating } = req.body;
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }

    const gameState = chessServer.createNewPuzzleGame(playerId, targetRating);
    res.json(gameState);
  } catch (error) {
    console.error('Error creating new puzzle:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chess/move', async (req, res) => {
  try {
    const { gameId, from, to, promotion } = req.body;
    if (!gameId || !from || !to) {
      return res.status(400).json({ error: 'Missing required move parameters' });
    }

    const moveResult = chessServer.handleMove(gameId, from, to, promotion);
    res.json(moveResult);
  } catch (error) {
    console.error('Error processing move:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chess/state/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const gameState = chessServer.getGameState(gameId);
    res.json(gameState);
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chess/legal-moves/:gameId/:square', async (req, res) => {
  try {
    const { gameId, square } = req.params;
    const legalMoves = chessServer.getLegalMoves(gameId, square);
    res.json(legalMoves);
  } catch (error) {
    console.error('Error getting legal moves:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chess/hint/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const hint = chessServer.getHint(gameId);
    res.json(hint);
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chess/stats/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const stats = chessServer.getUserStats(playerId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(port, () => {
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