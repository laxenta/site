<!-- ChessBoard.vue -->
<template>
  <div class="chess-container">
    <!-- Game Info and Controls -->
    <div class="game-info-panel">
      <div class="info-header">
        <h2 class="game-title">Chess Puzzle</h2>
        <div class="puzzle-rating">
          <strong>Puzzle Rating:</strong> {{ puzzleRating }}
        </div>
      </div>
      <div class="move-status" :class="moveStatus.type">
        <span>{{ moveStatus.message }}</span>
      </div>
      <button class="fetch-game-btn" @click="initializeBoardFromAPI">
        New Puzzle
      </button>
      <button class="reset-board-btn" @click="fetchGameState">
        Reset Puzzle
      </button>
    </div>

    <!-- Chess Board -->
    <div class="chess-board-wrapper">
      <div class="chess-board" :class="{ 'board-animated': isAnimated }">
        <div class="coordinates ranks">
          <span v-for="rank in ranks" :key="rank" class="coordinate">
            {{ rank }}
          </span>
        </div>

        <div class="board-container">
          <div v-for="(row, rankIndex) in boardMatrix" :key="rankIndex" class="board-row">
            <div v-for="(square, fileIndex) in row" :key="`${rankIndex}-${fileIndex}`" :class="[
              'square',
              getSquareColor(rankIndex, fileIndex),
              { 'square-selected': isSquareSelected(rankIndex, fileIndex) }
            ]" @click="handleSquareClick(rankIndex, fileIndex)">
              <div v-if="square" class="piece" :class="{ 'piece-animated': isAnimated }" :style="getPieceStyle(square)">
              </div>
            </div>
          </div>
        </div>

        <div class="coordinates files">
          <span v-for="file in files" :key="file" class="coordinate">
            {{ file }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE_URL = 'https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-5050.app.github.dev';

export default {
  name: 'ChessBoard',
  data() {
    return {
      files: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      ranks: ['8', '7', '6', '5', '4', '3', '2', '1'],
      boardMatrix: [],
      selectedSquare: null,
      isAnimated: true,
      puzzleRating: 0,
      moveStatus: {
        type: 'info',
        message: 'Make your move'
      },
      pieceMap: {
        'p': 'bP', 'n': 'bN', 'b': 'bB', 'r': 'bR', 'q': 'bQ', 'k': 'bK',
        'P': 'wP', 'N': 'wN', 'B': 'wB', 'R': 'wR', 'Q': 'wQ', 'K': 'wK'
      },
      gameId: null,
      playerId: 'player123',
      apiBaseUrl: API_BASE_URL,
    };
  },
  methods: {
    async initializeBoardFromAPI() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/puzzle/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ playerId: this.playerId, targetRating: this.puzzleRating })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create a new game');
        }

        const game = await response.json();
        this.gameId = game.id;
        this.initializeBoard(game.fen);
      } catch (error) {
        console.error('[DEBUG] Error initializing board from API:', error.message);
        this.moveStatus = { type: 'error', message: error.message };
      }
    },

    async makeMove(from, to, promotion = null) {
      if (!this.gameId) {
        console.warn('[DEBUG] No active game to make a move');
        return;
      }

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/puzzle/${this.gameId}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ from, to, promotion })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to make the move');
        }

        const result = await response.json();
        this.initializeBoard(result.fen);
        this.updateMoveStatus({ type: 'success', message: 'Move successful' });
      } catch (error) {
        console.error('[DEBUG] Error making move:', error.message);
        this.updateMoveStatus({ type: 'error', message: error.message });
      }
    },

    async fetchGameState() {
      if (!this.gameId) {
        console.warn('[DEBUG] No active game to fetch state');
        return;
      }

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/puzzle/${this.gameId}/state`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch game state');
        }

        const state = await response.json();
        this.initializeBoard(state.fen);
        this.moveStatus = { type: 'info', message: 'Game state updated' };
      } catch (error) {
        console.error('[DEBUG] Error fetching game state:', error.message);
        this.moveStatus = { type: 'error', message: error.message };
      }
    },

    async fetchUserStats() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/stats/${this.playerId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch user stats');
        }

        const stats = await response.json();
        console.log('[DEBUG] User stats:', stats);
        this.puzzleRating = stats.rating || 0;
      } catch (error) {
        console.error('[DEBUG] Error fetching user stats:', error.message);
        this.moveStatus = { type: 'error', message: 'Failed to load user stats' };
      }
    },

    initializeBoard(fen) {
      if (!fen) {
        console.warn('FEN is undefined or null, initializing empty board');
        this.boardMatrix = Array(8).fill().map(() => Array(8).fill(null));
        return;
      }

      try {
        const [position] = fen.split(' ');
        if (!position) {
          throw new Error('Invalid FEN format');
        }

        const rows = position.split('/');
        if (rows.length !== 8) {
          throw new Error('Invalid number of ranks in FEN');
        }

        this.boardMatrix = rows.map(row => {
          const squares = [];
          for (let char of row) {
            if (isNaN(char)) {
              if (!this.pieceMap[char]) {
                console.warn(`Unknown piece character: ${char}`);
                squares.push(null);
              } else {
                squares.push(this.pieceMap[char]);
              }
            } else {
              squares.push(...Array(parseInt(char)).fill(null));
            }
          }
          return squares;
        });
      } catch (error) {
        console.error('Error initializing board:', error);
        this.boardMatrix = Array(8).fill().map(() => Array(8).fill(null));
      }
    },

    getPieceStyle(piece) {
      return {
        backgroundImage: `url(${require(`@/assets/chesspieces/${piece}.png`)})`,
      };
    },

    getSquareColor(rankIndex, fileIndex) {
      return (rankIndex + fileIndex) % 2 === 0 ? 'square-light' : 'square-dark';
    },

    isSquareSelected(rankIndex, fileIndex) {
      return this.selectedSquare && 
             this.selectedSquare.rank === rankIndex && 
             this.selectedSquare.file === fileIndex;
    },

    updateMoveStatus(status) {
      this.moveStatus = status;
    }
  },
  props: {
    fen: {
      type: String,
      required: false,
      default: '8/8/8/8/8/8/8/8 w - - 0 1' // Empty board FEN
    },
    rating: {
      type: Number,
      default: 0
    }
  },
  created() {
    this.fetchUserStats();
    this.initializeBoardFromAPI();
  },
  watch: {
    rating: {
      immediate: true,
      handler(newRating) {
        this.puzzleRating = newRating;
      }
    }
  }
};
</script>

<style scoped>
.chess-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f7f9fc;
  /* Light neutral background */
  border-radius: 12px;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: auto;
}

.chess-board {
  position: relative;
  width: 640px;
  height: 640px;
  margin: 20px 0;
  background: linear-gradient(145deg, #ffffff, #e0e0e0);
  /* Subtle gradient */
  border-radius: 10px;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.board {
  position: absolute;
  top: 30px;
  left: 30px;
  width: calc(100% - 60px);
  height: calc(100% - 60px);
}

.coordinates {
  position: absolute;
  display: flex;
  justify-content: space-between;
  color: #444;
  font-size: 16px;
  font-weight: bold;
}

.files {
  bottom: 5px;
  left: 30px;
  right: 30px;
}

.ranks {
  flex-direction: column;
  top: 30px;
  bottom: 30px;
  left: 5px;
}

.board-row {
  display: flex;
  height: 12.5%;
}

.square {
  width: 12.5%;
  height: 100%;
  position: relative;
  transition: background-color 0.2s, transform 0.2s;
}

.square-light {
  background-color: #eed6b7;
  /* Light beige tone */
}

.square-dark {
  background-color: #a47551;
  /* Rich brown tone */
}

.square-selected {
  background-color: rgba(155, 199, 0, 0.5);
  box-shadow: inset 0 0 0 3px rgba(155, 199, 0, 0.8);
}

.square:hover {
  cursor: pointer;
  transform: scale(1.05);
  box-shadow: inset 0 0 0 3px rgba(255, 223, 0, 0.75);
  /* Highlight effect */
}

.piece {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.piece-animated {
  transition: transform 0.2s;
}

.piece-animated:hover {
  transform: scale(1.2);
}

.game-info {
  margin-top: 20px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 640px;
}

.puzzle-rating {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.move-status {
  padding: 12px 18px;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 15px;
}

.move-status.info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.move-status.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.move-status.error {
  background-color: #ffebee;
  color: #c62828;
}

.fetch-game-btn,
.reset-board-btn {
  background: #0078ff;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 10px;
  width: 48%;
  /* Half width for two buttons side by side */
  display: inline-block;
  text-align: center;
}

.fetch-game-btn:hover,
.reset-board-btn:hover {
  background: #005db8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.board-animated {
  animation: boardAppear 0.5s ease-out;
}

@keyframes boardAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Add responsiveness for smaller screens */
@media screen and (max-width: 768px) {
  .chess-board {
    width: 90vw;
    height: 90vw;
  }

  .game-info {
    padding: 15px;
    font-size: 14px;
  }

  .fetch-game-btn,
  .reset-board-btn {
    width: 100%;
    /* Full width for smaller screens */
    margin-bottom: 10px;
  }
}

@media screen and (max-width: 480px) {
  .coordinates {
    font-size: 12px;
    /* Smaller text for coordinates */
  }

  .square {
    transform: none;
    /* Disable hover effects for small screens */
  }

  .piece {
    background-size: 90%;
    /* Adjust piece size */
  }
}
</style>
