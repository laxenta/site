import axios from 'axios';

const API_URL = 'http://localhost:3000/api/chess';

export const PIECE_UNICODE = {
  'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
  'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
};

export const createNewPuzzleGame = async (playerId) => {
  try {
    const response = await axios.post(`${API_URL}/new-puzzle`, { playerId });
    return response.data;
  } catch (error) {
    console.error('Error creating new puzzle:', error);
    throw error;
  }
};

export const handleMove = async (gameId, from, to) => {
  try {
    const response = await axios.post(`${API_URL}/move`, { gameId, from, to });
    return response.data;
  } catch (error) {
    console.error('Error making move:', error);
    throw error;
  }
};

export const getGameState = async (gameId) => {
  try {
    const response = await axios.get(`${API_URL}/state/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting game state:', error);
    throw error;
  }
};

const chessService = {
  createNewPuzzleGame,
  handleMove,
  getGameState,
  PIECE_UNICODE
};

export default chessService;