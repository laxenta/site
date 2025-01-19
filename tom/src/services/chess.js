import axios from 'axios';

const API_URL = 'http://localhost:5050/api'; // Ensure this points to your backend

export const createNewPuzzleGame = async (playerId) => {
  try {
    const response = await axios.post(`${API_URL}/random`, { playerId });
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
    const response = await axios.get(`${API_URL}/game/${gameId}`);
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
};

export default chessService;
