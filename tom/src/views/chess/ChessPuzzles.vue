<template>
  <div class="chess-puzzles">
    <div id="myBoard" style="width: 400px"></div>
    <div class="controls">
      <button @click="startNewPuzzle">New Puzzle</button>
      <button @click="resetBoard">Reset</button>
    </div>
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script>
// Import chessboardjs if using npm
import Chessboard from 'chessboardjs'; // Add this line

import chessService from '@/services/chess'; // Adjust the import based on your project structure
import { onMounted, ref } from 'vue';

export default {
  name: 'ChessPuzzles',
  setup() {
    const board = ref(null);
    const message = ref('');
    const gameId = ref(null);

    // Initialize the chessboard with Chessboard.js
    const initializeBoard = (fen = 'start') => {
      board.value = Chessboard('myBoard', {
        draggable: true,
        dropOffBoard: 'snapback',
        position: fen,
        onDrop: handleDrop
      });
    };

    // Fetch a new puzzle and set up the board
    const startNewPuzzle = async () => {
      try {
        const puzzle = await chessService.createNewPuzzleGame('player1'); // Replace with actual player ID
        gameId.value = puzzle.gameId;
        initializeBoard(puzzle.fen);
        message.value = '';
      } catch (error) {
        console.error('Error fetching new puzzle:', error);
        message.value = 'Failed to load new puzzle. Try again later.';
      }
    };

    // Handle piece drop and validate the move
    const handleDrop = async (source, target) => {
      try {
        const moveResult = await chessService.handleMove(gameId.value, source, target);
        if (moveResult.isCorrect) {
          board.value.position(moveResult.fen);
          if (moveResult.isPuzzleCompleted) {
            message.value = 'Puzzle Completed!';
          }
        } else {
          message.value = moveResult.message;
        }
      } catch (error) {
        console.error('Error handling move:', error);
        message.value = 'Invalid move.';
      }
    };

    // Reset the board to the current puzzle's initial position
    const resetBoard = async () => {
      try {
        const gameState = await chessService.getGameState(gameId.value);
        board.value.position(gameState.fen);
        message.value = '';
      } catch (error) {
        console.error('Error resetting board:', error);
      }
    };

    onMounted(startNewPuzzle);

    return {
      startNewPuzzle,
      resetBoard,
      message
    };
  }
};
</script>

<style scoped>
.chess-puzzles {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}
.controls {
  margin-top: 10px;
}
.message {
  margin-top: 10px;
  color: green;
  font-weight: bold;
}
</style>
