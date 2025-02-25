// chess-server.js
const express = require('express');
const cors = require('cors');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

// Configuration
const CONFIG = {
  PUZZLE_EXPIRY_TIME: 30 * 60 * 1000, // 30 minutes
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  PORT: 8081 // Ensure the server runs on port 8081
};

// In-memory storage for games (multiplayer sessions)
const games = {};

// Helper: rotate board matrix for black's view
const rotateBoard = (board) => {
  return board.slice().reverse().map(row => row.slice().reverse());
};

// Helper: create a new free-play game
const createFreePlayGame = (playerId) => {
  const gameId = uuidv4();
  const chess = new Chess();
  // First player becomes white
  games[gameId] = {
    chess,
    players: { white: playerId, black: null },
    moveHistory: [],
    startTime: Date.now()
  };
  console.log(`Created new free-play game ${gameId} for player ${playerId} as white`);
  return { gameId, chess };
};

// Helper: join an existing game or create a new one
const joinGame = (playerId) => {
  // Check if player is already in a game
  for (const gameId in games) {
    const game = games[gameId];
    if (game.players.white === playerId || game.players.black === playerId) {
      console.log(`Player ${playerId} re-joined game ${gameId}`);
      return { gameId, chess: game.chess, players: game.players };
    }
    // If game has only white assigned, let this player join as black.
    if (game.players.white && !game.players.black) {
      game.players.black = playerId;
      console.log(`Player ${playerId} joined game ${gameId} as black`);
      return { gameId, chess: game.chess, players: game.players };
    }
  }
  // No available game: create a new one.
  return createFreePlayGame(playerId);
};

// Endpoint: join a game
const joinGameEndpoint = (req, res) => {
  // Use query parameter "playerId" or fallback to req.ip
  const playerId = req.query.playerId || req.ip;
  try {
    const { gameId, chess, players } = joinGame(playerId);
    // Determine assigned color for the caller
    let assignedColor = 'white';
    if (players.black === playerId) {
      assignedColor = 'black';
    }
    res.json({
      success: true,
      gameId,
      fen: chess.fen(),
      turn: chess.turn(),
      board: chess.board(),
      assignedColor
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper: handle a move
const handleMove = (gameId, playerId, from, to, promotion = 'q') => {
  const game = games[gameId];
  if (!game) throw new Error('Game not found');

  const chess = game.chess;
  const turn = chess.turn(); // "w" or "b"
  let playerColor = 'white';
  if (game.players.black === playerId) playerColor = 'black';
  // If the player is not yet assigned and game is free-play, assign as white.
  if (!game.players.white && !game.players.black) {
    game.players.white = playerId;
    playerColor = 'white';
  }
  // Validate turn: if it's not this player's turn, throw error.
  if ((turn === 'w' && playerColor !== 'white') ||
      (turn === 'b' && playerColor !== 'black')) {
    throw new Error("Not your turn");
  }

  const move = chess.move({ from, to, promotion });
  if (!move) throw new Error("Illegal move");

  // Record move with timestamp
  game.moveHistory.push({ move, timestamp: Date.now() });
  console.log(`Game ${gameId}: Player ${playerId} (${playerColor}) moved from ${from} to ${to}`);

  return { move, fen: chess.fen(), board: chess.board(), turn: chess.turn(), gameOver: chess.game_over() };
};

// Endpoint: make a move
const moveEndpoint = (req, res) => {
  // Expect JSON body: { gameId, playerId, from, to, promotion(optional) }
  const { gameId, playerId, from, to, promotion } = req.body;
  try {
    const result = handleMove(gameId, playerId || req.ip, from, to, promotion);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Move error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Endpoint: get game state
const gameStateEndpoint = (req, res) => {
  const { gameId, playerId } = req.query;
  const game = games[gameId];
  if (!game) return res.status(404).json({ success: false, error: 'Game not found' });
  let board = game.chess.board();
  // If the requesting player is black, rotate the board for his view.
  if (game.players.black === playerId) {
    board = rotateBoard(board);
  }
  res.json({
    success: true,
    fen: game.chess.fen(),
    turn: game.chess.turn(),
    board,
    moveHistory: game.moveHistory
  });
};

// Cleanup expired games
const cleanupGames = () => {
  const now = Date.now();
  Object.keys(games).forEach(gameId => {
    if (now - games[gameId].startTime > CONFIG.PUZZLE_EXPIRY_TIME) {
      console.log(`Cleaning up expired game ${gameId}`);
      delete games[gameId];
    }
  });
};

// Start periodic cleanup
setInterval(cleanupGames, CONFIG.CLEANUP_INTERVAL);

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/join', joinGameEndpoint);
app.post('/api/move', moveEndpoint);
app.get('/api/game', gameStateEndpoint);

// Start server on port 8081
app.listen(CONFIG.PORT, () => {
  console.log(`Chess multiplayer server listening on port ${CONFIG.PORT}`);
});
