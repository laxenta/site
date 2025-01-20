import axios from 'axios';

const API_URL = 'https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-5050.app.github.dev/api';

export const createNewPuzzleGame = async (playerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/random`,
      { playerId },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating new puzzle:', error.response?.data || error.message);
    throw error;
  }
};

export const handleMove = async (gameId, from, to) => {
  try {
    const response = await axios.post(
      `${API_URL}/move`,
      { gameId, from, to },
      {
        headers: {
          'Content-Type': 'application/json', // Keep only Content-Type
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error making move:', error.response?.data || error.message);
    throw error;
  }
};

export const getGameState = async (gameId) => {
  try {
    const response = await axios.get(
      `${API_URL}/game/${gameId}`,
      {
        headers: {
          'Content-Type': 'application/json', // Keep only Content-Type
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting game state:', error.response?.data || error.message);
    throw error;
  }
};

const chessService = {
  createNewPuzzleGame,
  handleMove,
  getGameState,
};

export default chessService;