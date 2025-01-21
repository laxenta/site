    <template>
      <div class="chess-puzzles">
        <div id="myBoard" class="board-container"></div>
        <div class="controls">
          <button @click="startNewPuzzle">New Puzzle</button>
          <button @click="resetBoard">Reset</button>
        </div>
        <div v-if="message" class="message">{{ message }}</div>
        <div class="stats">
          <p>Rating: {{ puzzleRating }}</p>
          <p>Themes: {{ puzzleThemes.join(', ') }}</p>
          <p>Solution: {{ puzzleSolution.join(', ') }}</p>
        </div>
      </div>
    </template>

    <script>
    import Chessboard from 'chessboardjs'; // see first we import chessboard.js library
    //,import chessService from '@/services/chess';
    import { onMounted, ref } from 'vue';
    import { PIECE_UNICODE, generateRandomPuzzle, isValidMove, getGameState  } from '/workspaces/site/tom/server/chess-server.js'; // Import Unicode pieces

    // utility function to convert FEN to a board array, i mean its duplicate , just writting for refrence, duplicated in chess-server.js 
    const fenToBoardArray = (fen) => {
      const rows = fen.split(' ')[0].split('/');
      return rows.map(row => {
        let expandedRow = '';
        for (let char of row) {
          if (isNaN(char)) {
            expandedRow += char;
          } else {
            expandedRow += ' '.repeat(char);
          }
        }
        return expandedRow.split('');
      });
    };

    export default {
      name: 'ChessPuzzles',
      setup() {
        const board = ref(null);
        const message = ref('');
        const gameId = ref(null);
        const puzzleRating = ref(null);
        const puzzleThemes = ref([]);
        const puzzleSolution = ref([]);
        const boardArray = ref([]);

        // Function to initialize the board
        const initializeBoard = (fen = 'start') => {
          board.value = Chessboard('myBoard', {
            draggable: true,
            dropOffBoard: 'snapback',
            position: fen,
            onDrop: handleDrop,
            pieceTheme: (piece) => {
              const color = piece.color === 'w' ? 'White' : 'Black';
              const unicodePiece = PIECE_UNICODE[color][piece.type];
              return `<span class="chess-piece">${unicodePiece}</span>`;
            }
          });

          // Update the board array from the FEN
          boardArray.value = fenToBoardArray(fen);
        };

        // Function to start a new puzzle
        const startNewPuzzle = async () => {
          try {
            // Replace chessService.createNewPuzzleGame with a function that generates a random FEN
            const puzzle = generateRandomPuzzle();
            gameId.value = puzzle.gameId;
            puzzleRating.value = puzzle.rating;
            puzzleThemes.value = puzzle.themes;
            puzzleSolution.value = puzzle.solution;
            initializeBoard(puzzle.fen);
            message.value = '';

            // Convert FEN to board array and log it
            const boardArray = fenToBoardArray(puzzle.fen);
            console.log('Board Array:', boardArray);
          } catch (error) {
            console.error('Error fetching new puzzle:', error);
            message.value = 'Failed to load new puzzle. Try again later.';
          }
        };

        // Function to handle a move
        const handleDrop = async (source, target) => {
          try {
            // Replace chessService.handleMove with a function that checks if the move is valid
            const moveResult = isValidMove(source, target);
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

        // Function to reset the board
        const resetBoard = async () => {
          try {
            // Replace chessService.getGameState with a function that gets the current state of the board
            const gameState = getGameState();
            board.value.position(gameState.fen);
            message.value = '';
          } catch (error) {
            console.error('Error resetting board:', error);
          }
        };

        // Initialize a new puzzle on mount
        onMounted(startNewPuzzle);

        return {
          startNewPuzzle,
          resetBoard,
          message,
          puzzleRating,
          puzzleThemes,
          puzzleSolution,
          boardArray
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

    .board-container {
      width: 100%;
      max-width: 400px;
    }

    .stats {
      margin-top: 10px;
    }

    .chess-piece {
      font-size: 3em; /* Adjust font size for piece visibility */
    }
    </style>