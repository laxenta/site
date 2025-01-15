<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col items-center">
        <!-- Chess Board Container -->
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="grid grid-cols-1 gap-4">
            <!-- Game Info -->
            <div class="text-center mb-4">
              <h2 class="text-2xl font-bold text-gray-800">Chess Puzzle</h2>
              <p class="text-gray-600">Rating: {{ puzzleRating }}</p>
              <p class="text-gray-600">Themes: {{ puzzleThemes.join(', ') }}</p>
            </div>

            <!-- Chess Board -->
            <div class="chess-board">
              <!-- File Labels (a-h) -->
              <div class="file-labels">
                <div v-for="file in files" :key="file" class="file-label">{{ file }}</div>
              </div>
              
              <!-- Board with Rank Labels -->
              <div class="board-with-ranks">
                <!-- Rank Labels (1-8) -->
                <div class="rank-labels">
                  <div v-for="rank in 8" :key="rank" class="rank-label">{{ 9 - rank }}</div>
                </div>

                <!-- Actual Board -->
                <div class="board">
                  <div v-for="(row, rowIndex) in board" :key="rowIndex" class="flex">
                    <div
                      v-for="(piece, colIndex) in row"
                      :key="`${rowIndex}-${colIndex}`"
                      :class="[
                        'square',
                        isSquareBlack(rowIndex, colIndex) ? 'black' : 'white',
                        selectedSquare === getSquareNotation(rowIndex, colIndex) ? 'selected' : '',
                        isLegalMove(getSquareNotation(rowIndex, colIndex)) ? 'legal-move' : '',
                        'text-4xl'
                      ]"
                      @click="handleSquareClick(rowIndex, colIndex)"
                    >
                      {{ piece }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Game Controls -->
            <div class="flex flex-col items-center gap-4 mt-4">
              <div v-if="message" 
                   :class="['p-3 rounded-md w-full text-center transition-all duration-300', messageClass]">
                {{ message }}
              </div>
              
              <div class="flex gap-4">
                <button 
                  @click="startNewPuzzle"
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  New Puzzle
                </button>
                <button 
                  @click="getHintMove"
                  class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
                >
                  Hint
                </button>
              </div>

              <div v-if="userStats" class="mt-4 text-center">
                <h3 class="font-bold text-lg">Your Stats</h3>
                <p>Completed Puzzles: {{ userStats.completedPuzzles }}</p>
                <p>Average Attempts: {{ userStats.averageAttempts.toFixed(1) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import chessService from '@/services/chess';

export default {
  name: 'ChessPuzzles',
  setup() {
    // State
    const board = ref([]);
    const gameId = ref(null);
    const selectedSquare = ref(null);
    const legalMoves = ref([]);
    const message = ref('');
    const messageClass = ref('');
    const puzzleRating = ref(0);
    const puzzleThemes = ref([]);
    const userStats = ref(null);
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Methods
    const getSquareNotation = (row, col) => {
      return `${files[col]}${8 - row}`;
    };

    const isSquareBlack = (row, col) => {
      return (row + col) % 2 === 1;
    };

    const isLegalMove = (square) => {
      return legalMoves.value.includes(square);
    };

    const showMessage = (text, type = 'info') => {
      message.value = text;
      messageClass.value = type === 'error' 
        ? 'bg-red-100 text-red-800' 
        : 'bg-green-100 text-green-800';
      setTimeout(() => {
        message.value = '';
      }, 3000);
    };

    const updateGameState = async () => {
      try {
        const state = await chessService.getGameState(gameId.value);
        board.value = state.unicodePieces;
        puzzleRating.value = state.puzzleRating;
        puzzleThemes.value = state.themes;
      } catch (error) {
        showMessage('Error updating game state', 'error');
      }
    };

    const startNewPuzzle = async () => {
      try {
        const result = await chessService.createNewGame('player1');
        gameId.value = result.gameId;
        board.value = result.unicodePieces;
        puzzleRating.value = result.puzzleRating;
        puzzleThemes.value = result.themes;
        selectedSquare.value = null;
        legalMoves.value = [];
        
        // Get updated user stats
        const stats = await chessService.getUserStats('player1');
        userStats.value = stats;
      } catch (error) {
        showMessage('Error starting new puzzle', 'error');
      }
    };

    const getHintMove = async () => {
      try {
        const hint = await chessService.getHint(gameId.value);
        selectedSquare.value = hint.fromSquare;
        showMessage(`Try moving the ${hint.pieceType.toUpperCase()}`);
      } catch (error) {
        showMessage('No hint available', 'error');
      }
    };

    const handleSquareClick = async (row, col) => {
      const square = getSquareNotation(row, col);
      
      if (!selectedSquare.value) {
        // First click - select piece
        selectedSquare.value = square;
        try {
          const moves = await chessService.getLegalMoves(gameId.value, square);
          legalMoves.value = moves.map(move => move.to);
        } catch (error) {
          legalMoves.value = [];
        }
      } else {
        // Second click - attempt to move
        const from = selectedSquare.value;
        const to = square;
        
        try {
          const result = await chessService.makeMove(gameId.value, from, to);
          board.value = result.unicodePieces;
          
          if (result.isCorrect) {
            if (result.isPuzzleCompleted) {
              showMessage('Puzzle completed! Well done!');
              // Update user stats
              const stats = await chessService.getUserStats('player1');
              userStats.value = stats;
            } else {
              showMessage('Good move!');
            }
          } else {
            showMessage('Incorrect move. Try again!', 'error');
          }
        } catch (error) {
          showMessage('Invalid move', 'error');
        }
        
        selectedSquare.value = null;
        legalMoves.value = [];
      }
    };

    // Lifecycle hooks
    onMounted(async () => {
      await startNewPuzzle();
    });

    return {
      board,
      selectedSquare,
      message,
      messageClass,
      puzzleRating,
      puzzleThemes,
      userStats,
      files,
      handleSquareClick,
      startNewPuzzle,
      getHintMove,
      isSquareBlack,
      getSquareNotation,
      isLegalMove
    };
  }
};
</script>

<style scoped>
.chess-board {
  display: inline-block;
  border: 1px solid #ccc;
  padding: 10px;
  background: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.board-with-ranks {
  display: flex;
  align-items: center;
}

.rank-labels {
  display: flex;
  flex-direction: column;
  padding-right: 8px;
}

.rank-label {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-weight: 500;
  width: 20px;
}

.file-labels {
  display: flex;
  justify-content: center;
  padding-left: 28px;
  margin-bottom: 8px;
}

.file-label {
  width: 50px;
  text-align: center;
  color: #666;
  font-weight: 500;
}

.board {
  border: 2px solid #444;
}

.square {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.square.white {
  background-color: #f0d9b5;
}

.square.black {
  background-color: #b58863;
}

.square.selected {
  background-color: rgba(106, 90, 205, 0.5);
}

.square.legal-move::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  pointer-events: none;
}

.square:hover {
  opacity: 0.8;
}

@media (max-width: 640px) {
  .chess-board {
    transform: scale(0.8);
    transform-origin: top center;
  }
}
</style>