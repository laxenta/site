'use strict';

const express = require('express');
const cors = require('cors');
const { joinGame, handleMove, getGameState } = require('./chess-server');
// so now these are imported
const app = express();
const PORT = process.env.PORT || 8081;

// too many 302 errors idk why, will fix later ( dont forget)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// apply CORS middleware early.
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));
app.options('*', cors());

// parse JSON bodies.
app.use(express.json());

// now we log incoming rq
app.use((req, res, next) => {
  console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * GET /api/join
 *
 * yhe player Joins (or creates) a free-play chess game.
 * expects a unique playerId as a query parameter.
 */
app.get('/api/join', (req, res) => {
  const playerId = req.query.playerId;
  if (!playerId) {
    return res.status(400).json({ success: false, error: 'playerId is required.' });
  }
  try {
    const { gameId, chess, players } = joinGame(playerId);
    const assignedColor = (players.white === playerId) ? 'white' : 'black';
    res.json({
      success: true,
      gameId,
      fen: chess.fen(),
      turn: chess.turn(),
      board: chess.board(),
      assignedColor
    });
  } catch (error) {
    console.error('[ERROR] Join game error:', error);
    // fallback: Try to create a new game instance.
    try {
      const { gameId, chess, players } = joinGame(playerId);
      const assignedColor = (players.white === playerId) ? 'white' : 'black';
      res.json({
        success: true,
        gameId,
        fen: chess.fen(),
        turn: chess.turn(),
        board: chess.board(),
        assignedColor,
        fallback: true
      });
    } catch (fallbackError) {
      res.status(500).json({ success: false, error: fallbackError.message });
    }
  }
});

/**
 * POST /api/move
 *
 * processes a move from the frontend.
 * expects gameId, playerId, from, to, and optionally promotion in the request body.
 */
app.post('/api/move', async (req, res) => {
  const { gameId, playerId, from, to, promotion } = req.body;
  if (!gameId || !playerId || !from || !to) {
    return res.status(400).json({ success: false, error: 'gameId, playerId, from, and to are required.' });
  }
  try {
    const result = await handleMove(gameId, playerId, from, to, promotion);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] Move error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/game
 *
 * retrieves the current game state.
 * expects gameId and playerId as query parameters.
 */
app.get('/api/game', (req, res) => {
  const { gameId, playerId } = req.query;
  if (!gameId || !playerId) {
    return res.status(400).json({ success: false, error: 'gameId and playerId are required.' });
  }
  try {
    const gameState = getGameState(gameId, playerId);
    res.json({ success: true, ...gameState });
  } catch (error) {
    console.error('[ERROR] Get game state error:', error);
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * GET /
 *
 * home pg root / endpoint, we keep it simple idk, not like any1 visiting
 */
app.get('/', (req, res) => {
  res.send(`<h1>Multiplayer Chess Server</h1><p>Server is running on port ${PORT}</p>`);
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Multiplayer chess server listening on port ${PORT}`);
});
