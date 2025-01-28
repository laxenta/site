<!-- ChessBoard.vue -->
<template>
  <div class="chess-container">
    <div class="chess-board" :class="{ 'board-animated': isAnimated }">
      <!-- Board coordinates -->
      <div class="coordinates files">
        <span v-for="file in files" :key="file">{{ file }}</span>
      </div>
      <div class="coordinates ranks">
        <span v-for="rank in ranks" :key="rank">{{ rank }}</span>
      </div>

      <!-- Chess board squares and pieces -->
      <div class="board">
        <div v-for="(row, rankIndex) in boardMatrix" 
             :key="rankIndex" 
             class="board-row">
          <div v-for="(square, fileIndex) in row" 
               :key="`${rankIndex}-${fileIndex}`"
               :class="[
                 'square',
                 getSquareColor(rankIndex, fileIndex),
                 { 'square-selected': isSquareSelected(rankIndex, fileIndex) }
               ]"
               @click="handleSquareClick(rankIndex, fileIndex)">
            <div v-if="square" 
                 class="piece" 
                 :class="{ 'piece-animated': isAnimated }"
                 :style="getPieceStyle(square)">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Game info panel -->
    <div class="game-info">
      <div class="puzzle-rating">Puzzle Rating: {{ puzzleRating }}</div>
      <div class="move-status" :class="moveStatus.type">{{ moveStatus.message }}</div>
    </div>
  </div>
</template>

<script>
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
      }
    }
  },
  methods: {
    initializeBoard(fen) {
      const [position] = fen.split(' ');
      const rows = position.split('/');
      this.boardMatrix = rows.map(row => {
        const squares = [];
        for (let char of row) {
          if (isNaN(char)) {
            squares.push(this.pieceMap[char]);
          } else {
            squares.push(...Array(parseInt(char)).fill(null));
          }
        }
        return squares;
      });
    },

    getSquareColor(rankIndex, fileIndex) {
      return (rankIndex + fileIndex) % 2 === 0 ? 'square-light' : 'square-dark';
    },

    getPieceStyle(piece) {
      return {
        backgroundImage: `url(${require(`@/assets/chesspieces/${piece}.png`)})`,
      };
    },

    isSquareSelected(rankIndex, fileIndex) {
      return this.selectedSquare && 
             this.selectedSquare.rank === rankIndex && 
             this.selectedSquare.file === fileIndex;
    },

    handleSquareClick(rankIndex, fileIndex) {
      if (!this.selectedSquare) {
        if (this.boardMatrix[rankIndex][fileIndex]) {
          this.selectedSquare = { rank: rankIndex, file: fileIndex };
        }
      } else {
        // Handle move
        const from = this.getSquareNotation(this.selectedSquare.rank, this.selectedSquare.file);
        const to = this.getSquareNotation(rankIndex, fileIndex);
        this.$emit('move', { from, to });
        this.selectedSquare = null;
      }
    },

    getSquareNotation(rankIndex, fileIndex) {
      return `${this.files[fileIndex]}${this.ranks[rankIndex]}`;
    },

    updateMoveStatus(status) {
      this.moveStatus = status;
    }
  },
  props: {
    fen: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      default: 0
    }
  },
  watch: {
    fen: {
      immediate: true,
      handler(newFen) {
        this.initializeBoard(newFen);
      }
    },
    rating: {
      immediate: true,
      handler(newRating) {
        this.puzzleRating = newRating;
      }
    }
  }
}
</script>

<style scoped>
.chess-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chess-board {
  position: relative;
  width: 640px;
  height: 640px;
  margin: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
  justify-content: space-around;
  color: #666;
  font-size: 14px;
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
  transition: background-color 0.2s;
}

.square-light {
  background-color: #f0d9b5;
}

.square-dark {
  background-color: #b58863;
}

.square-selected {
  background-color: rgba(155, 199, 0, 0.41);
}

.square:hover {
  cursor: pointer;
  box-shadow: inset 0 0 0 3px rgba(155, 199, 0, 0.75);
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
  transform: scale(1.1);
}

.game-info {
  margin-top: 20px;
  text-align: center;
}

.puzzle-rating {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.move-status {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;
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
</style>