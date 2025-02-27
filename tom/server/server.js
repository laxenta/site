'use strict';
// uwu let's start now aaaaaaaaaaaaaaaa, this file is for multiplayer
const express = require('express');
const cors = require('cors');
const { Chess } = require('chess.js');
const app = express();
const PORT = process.env.PORT || 8081;
const games = new Map();
let waitingGame = null;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));
app.options('*', cors());
app.use(express.json());
app.use((req, res, next) => {
  //console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
function generateGameId() {
  return 'game_' + Math.random().toString(36).substring(2, 15);
}

/**
 * ;3 joins a game or creates one if none is waiting :3 
 * @param {string} playerId - unq ID of the player joining
 * @returns {Object} Game info: gameId, chess instance, and players
 */
function joinGame(playerId) {
  for (const [gameId, game] of games.entries()) {
    if (game.players.white === playerId || game.players.black === playerId) {
      console.log(`[INFO] Player ${playerId} rejoining existing game ${gameId}`);
      return { gameId, chess: game.chess, players: game.players };
    }
  }

  //waiting game (with only one player), join that game
  if (waitingGame && waitingGame.players.black === null && waitingGame.players.white !== playerId) {
    waitingGame.players.black = playerId;
    waitingGame.lastActive = Date.now();
    const gameId = waitingGame.gameId;
    console.log(`[INFO] Player ${playerId} joined waiting game ${gameId}`);
    const joinedGame = waitingGame;
    waitingGame = null;
    return { gameId, chess: joinedGame.chess, players: joinedGame.players };
  }
  const gameId = generateGameId();
  const chess = new Chess();
  const players = { white: playerId, black: null };
  const newGame = { gameId, chess, players, lastActive: Date.now(), moves: [] };
  games.set(gameId, newGame);
  waitingGame = newGame;
  console.log(`[INFO] Player ${playerId} is waiting for an opponent in game ${gameId}`);
  return { gameId, chess, players };
}

/**
 * processes a move in a going game, idk cant use promises here ig? idk lol ;c
 * @param {string} gameId - ID of the game
 * @param {string} playerId - ID of the player making the move
 * @param {string} from - src square (like e2).
 * @param {string} to - dest square (e.g e4).
 * @param {string} [promotion] - piece to promote to (optional).
 * @returns  {Object} updated game state after the move.
 */
async function handleMove(gameId, playerId, from, to, promotion = 'q') {
  const game = games.get(gameId);
  
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }
    const isWhiteTurn = game.chess.turn() === 'w';
  const currentPlayerShouldBe = isWhiteTurn ? game.players.white : game.players.black;
  
  if (currentPlayerShouldBe !== playerId) {
    throw new Error("not your turn");
  }
  //we will not let the game start without 2 players ;) 
  if (!game.players.white || !game.players.black) {
    throw new Error("waiting for opponent to join");
  }
  
  try {
    const moveResult = game.chess.move({ from, to, promotion });
    if (!moveResult) {
      throw new Error("Invalid move");
    }
        game.lastActive = Date.now();
    game.moves.push({
      from,
      to,
      promotion,
      fen: game.chess.fen(),
      timestamp: Date.now()
    });
    
    return {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      board: game.chess.board(),
      isCheck: game.chess.isCheck(),
      isCheckmate: game.chess.isCheckmate(),
      isDraw: game.chess.isDraw(),
      moveHistory: game.moves.map(m => m.fen)
    };
  } catch (error) {
    console.error(`[ERROR] Move error in game ${gameId}:`, error);
    throw new Error(error.message || "Invalid move");
  }
}
/**
 * fetches OR creates the current state of a chess mltplyr game
 * @param {string} gameId - ID of the game, its optional yeas
 * @param {string} playerId - ID of the player requesting the state.
 * @returns {Object} get um current game state
 */
function getGameState(gameId, playerId) {
  for (const [existingGameId, game] of games.entries()) {
    if (game.players.white === playerId || game.players.black === playerId) {
      return {
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        board: game.chess.board(),
        isCheck: game.chess.isCheck(),
        isCheckmate: game.chess.isCheckmate(),
        isDraw: game.chess.isDraw(),
        players: game.players,
        moveHistory: game.moves.map(m => m.fen),
        gameId: existingGameId
      };
    }
  }
  //gameId exists, try to find and join that specific game
  let game = gameId ? games.get(gameId) : null;
  //the game exists and the player can join it
  if (game) {
    //if the game has an empty black spot and player isn't already white, he is ni--
    if (game.players.black === null && game.players.white !== playerId) {
      game.players.black = playerId;
      game.lastActive = Date.now();
      console.log(`[INFO] Player ${playerId} joined game ${gameId} as black`);
      waitingGame = null; //clear waiting game if this was it
      
      return {
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        board: game.chess.board(),
        isCheck: game.chess.isCheck(),
        isCheckmate: game.chess.isCheckmate(),
        isDraw: game.chess.isDraw(),
        players: game.players,
        moveHistory: game.moves.map(m => m.fen),
        gameId
      };
    }
    
    //if the player should already be in this game but isn't
    //(this shouldn't happen given the first check, but just in case)
    if (!game.players.white && !game.players.black) {
      game.players.white = playerId;
      game.lastActive = Date.now();
      waitingGame = game;
      console.log(`[INFO] Player ${playerId} joined empty game ${gameId} as white`);
      
      return {
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        board: game.chess.board(), 
        isCheck: game.chess.isCheck(),
        isCheckmate: game.chess.isCheckmate(),
        isDraw: game.chess.isDraw(),
        players: game.players,
        moveHistory: game.moves.map(m => m.fen),
        gameId
      };
    }
  }
    if (waitingGame && waitingGame.players.black === null && waitingGame.players.white !== playerId) {
    waitingGame.players.black = playerId;
    waitingGame.lastActive = Date.now();
    game = waitingGame;
    const newGameId = waitingGame.gameId;
    console.log(`[INFO] Player ${playerId} joined waiting game ${newGameId}`);
    waitingGame = null;
    
    return {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      board: game.chess.board(),
      isCheck: game.chess.isCheck(),
      isCheckmate: game.chess.isCheckmate(),
      isDraw: game.chess.isDraw(),
      players: game.players,
      moveHistory: game.moves.map(m => m.fen),
      gameId: newGameId
    };
  }
  
  // Create a new game if nothing else matched
  const newGameId = generateGameId();
  const chess = new Chess();
  const players = { white: playerId, black: null };
  const newGame = { gameId: newGameId, chess, players, lastActive: Date.now(), moves: [] };
  games.set(newGameId, newGame);
  waitingGame = newGame;
  console.log(`[INFO] Player ${playerId} created new game ${newGameId}`);
  
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    board: chess.board(),
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    players,
    moveHistory: [],
    gameId: newGameId
  };
}
async function makeAIMove(game) {
  const moves = game.chess.moves();  
  if (moves.length > 0) {
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    const result = game.chess.move(randomMove);
    
    if (result) {
      game.moves.push({
        from: result.from,
        to: result.to,
        promotion: result.promotion,
        fen: game.chess.fen(),
        timestamp: Date.now()
      });
    }
  }
}
//cleaner
setInterval(() => {
  const now = Date.now();
  for (const [gameId, game] of games.entries()) {
    //1h
    if (now - game.lastActive > 1 * 60 * 60 * 1000) {
      console.log(`[INFO] removing inactive game 8===> ${gameId}`);
      games.delete(gameId);
      if (waitingGame && waitingGame.gameId === gameId) {
        waitingGame = null;
      }
    }
  }
}, 60 * 60 * 1000);

// all our API endpoints

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
      assignedColor,
      opponent: assignedColor === 'white' ? players.black : players.white
    });
  } catch (error) {
    console.error('[ERROR] Join game error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/move', async (req, res) => {
  const { gameId, playerId, from, to, promotion } = req.body;
  
  if (!gameId || !playerId || !from || !to) {
    return res.status(400).json({ 
      success: false, 
      error: 'gameId, playerId, from, and to are required.' 
    });
  }
  
  try {
    const result = await handleMove(gameId, playerId, from, to, promotion);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[ERROR] Move error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});
app.get('/api/game', (req, res) => {
  const { gameId, playerId } = req.query;
  
  if (!playerId) {
    return res.status(400).json({ success: false, error: 'playerId is required.' });
  }
  
  try {
    const gameState = getGameState(gameId, playerId);
    res.json({ 
      success: true, 
      ...gameState
    });
  } catch (error) {
    console.error('[ERROR] Get game state error:', error);
    res.status(404).json({ success: false, error: error.message });
  }
});






app.post('/api/resign', (req, res) => {
  const { gameId, playerId } = req.body;
  
  if (!gameId || !playerId) {
    return res.status(400).json({ success: false, error: 'gameId and playerId are required.' });
  }
  
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ success: false, error: 'Game not found.' });
  }
  
  if (game.players.white !== playerId && game.players.black !== playerId) {
    return res.status(400).json({ success: false, error: 'Player is not in this game.' });
  }
    game.result = 'resigned';
  game.resignedBy = playerId;
  games.delete(gameId);
  console.log(`[INFO] Player ${playerId} resigned game ${gameId}`);
  
  res.json({ success: true, message: 'You have resigned. Game over.', code: 'resigned' });
});
app.post('/api/newgame', (req, res) => {
  const { gameId, playerId } = req.body;
  
  if (!playerId) {
    return res.status(400).json({ success: false, error: 'playerId is required.' });
  }
    if (gameId) {
    const oldGame = games.get(gameId);
    if (oldGame && (oldGame.players.white === playerId || oldGame.players.black === playerId)) {
      oldGame.result = 'abandoned';
      oldGame.abandonedBy = playerId;
      games.delete(gameId);
      console.log(`[INFO] Player ${playerId} abandoned game ${gameId}`);
    }
  }
    const { gameId: newGameId, chess, players } = joinGame(playerId);
  const assignedColor = (players.white === playerId) ? 'white' : 'black';
  
  res.json({
    success: true,
    message: 'Started a new game. Previous game ended.',
    gameId: newGameId,
    fen: chess.fen(),
    turn: chess.turn(),
    board: chess.board(),
    assignedColor,
    opponent: assignedColor === 'white' ? players.black : players.white,
    code: 'new_game'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    games: games.size, 
    waiting: waitingGame ? true : false 
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Multiplayer Chess Server</h1>
    <p>Server is running on port ${PORT}</p>
    <p>Active games: ${games.size}</p>
    <p>Waiting game: ${waitingGame ? 'Yes' : 'No'}</p>
  `);
});
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});
app.listen(PORT, () => {
  console.log(`Multiplayer chess server listening on port ${PORT}`);
});
module.exports = {
  joinGame,
  handleMove,
  getGameState
};
