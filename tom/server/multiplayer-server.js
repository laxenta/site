const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

// In-memory store for multiplayer games.
// Structure:
// {
//   [gameId]: {
//      chess: Chess instance,
//      players: { white: <ip>, black: <ip> },
//      moveHistory: [ { move, timestamp } ],
//      startTime: timestamp
//   }
// }
const multiplayerGames = {};

/**
 * Create a new multiplayer game.
 * The first joining player is assigned white.
 *
 * @param {string} ip - The requester's IP address.
 * @returns {object} - Object containing gameId, fen, and players.
 */
function createNewMultiplayerGame(ip) {
  const gameId = `mp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  multiplayerGames[gameId] = {
    chess: new Chess(),
    players: { white: ip, black: null },
    moveHistory: [],
    startTime: Date.now()
  };
  return { gameId, fen: multiplayerGames[gameId].chess.fen(), players: multiplayerGames[gameId].players };
}

/**
 * Join an existing multiplayer game or create a new one if none is available.
 * - If the IP is already in a game, return that game.
 * - If an open game exists (with no black player) and white is not the same IP, assign black.
 *
 * @param {string} ip - The requester's IP address.
 * @returns {object} - Object containing gameId, fen, and players.
 */
function joinMultiplayerGame(ip) {
  for (const gameId in multiplayerGames) {
    const game = multiplayerGames[gameId];
    // If this IP is already in the game, return it.
    if (game.players.white === ip || game.players.black === ip) {
      return { gameId, fen: game.chess.fen(), players: game.players };
    }
    // If there's an open black seat (and white isn't the same IP), assign black.
    if (!game.players.black && game.players.white !== ip) {
      game.players.black = ip;
      return { gameId, fen: game.chess.fen(), players: game.players };
    }
  }
  // No game found, so create a new one.
  return createNewMultiplayerGame(ip);
}

/**
 * Handle a move in a multiplayer game.
 * Checks that the player making the move (by IP) matches the player whose turn it is.
 *
 * @param {string} gameId - The multiplayer game ID.
 * @param {string} from - Starting square (e.g., "e2").
 * @param {string} to - Destination square (e.g., "e4").
 * @param {string} [promotion='q'] - Optional promotion piece.
 * @param {string} ip - The requester's IP address.
 * @returns {object} - Object containing updated fen, moveHistory, and turn.
 * @throws {Error} - With code 'GAME_NOT_FOUND', 'NOT_YOUR_TURN', or 'ILLEGAL_MOVE'.
 */
async function handleMultiplayerMove(gameId, from, to, promotion = 'q', ip) {
  const game = multiplayerGames[gameId];
  if (!game) {
    const error = new Error('Game not found');
    error.code = 'GAME_NOT_FOUND';
    throw error;
  }
  const turn = game.chess.turn(); // 'w' or 'b'
  const playerIp = turn === 'w' ? game.players.white : game.players.black;
  if (playerIp !== ip) {
    const error = new Error('Not your turn');
    error.code = 'NOT_YOUR_TURN';
    throw error;
  }
  // Try to make the move.
  const move = game.chess.move({ from, to, promotion });
  if (!move) {
    const error = new Error('Illegal move');
    error.code = 'ILLEGAL_MOVE';
    throw error;
  }
  // Record the move.
  game.moveHistory.push({
    move,
    timestamp: Date.now()
  });
  return { fen: game.chess.fen(), moveHistory: game.moveHistory, turn: game.chess.turn() };
}

/**
 * Get the current state of a multiplayer game.
 *
 * @param {string} gameId - The multiplayer game ID.
 * @returns {object} - Object containing fen, board, players, moveHistory, and turn.
 * @throws {Error} - With code 'GAME_NOT_FOUND' if the game doesn't exist.
 */
function getMultiplayerGameState(gameId) {
  const game = multiplayerGames[gameId];
  if (!game) {
    const error = new Error('Game not found');
    error.code = 'GAME_NOT_FOUND';
    throw error;
  }
  return {
    fen: game.chess.fen(),
    board: game.chess.board(),
    players: game.players,
    moveHistory: game.moveHistory,
    turn: game.chess.turn()
  };
}

/**
 * (Optional) Cleanup function to remove expired multiplayer games.
 *
 * @param {number} [expiryTime=1800000] - Expiry time in milliseconds (default: 30 minutes).
 */
function cleanupMultiplayerGames(expiryTime = 30 * 60 * 1000) {
  const now = Date.now();
  for (const gameId in multiplayerGames) {
    if (now - multiplayerGames[gameId].startTime > expiryTime) {
      delete multiplayerGames[gameId];
    }
  }
}

module.exports = {
  joinMultiplayerGame,
  handleMultiplayerMove,
  getMultiplayerGameState,
  cleanupMultiplayerGames
};
