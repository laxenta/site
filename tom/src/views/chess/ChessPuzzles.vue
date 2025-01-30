<template>
  <div class="chess-container">
    <!-- Header with player info and puzzle rating -->
    <div class="game-header">
      <div class="player-info">
        Player: {{ playerName }}
      </div>
      <div class="puzzle-rating">
        Rating: {{ puzzleRating }}
      </div>
    </div>

    <div class="board-and-analysis">
      <!-- Chess board with drag and drop support -->
      <div class="board-and-controls">
        <div class="chess-board" :class="{ 'board-animated': isAnimated }" @dragover.prevent @drop="handleDrop">
          <!-- Board coordinates -->
          <div class="coordinates files">
            <span v-for="file in files" :key="file">{{ file }}</span>
          </div>
          <div class="coordinates ranks">
            <span v-for="rank in ranks" :key="rank">{{ rank }}</span>
          </div>

          <!-- Chess board squares and pieces -->
          <div class="board">
            <div v-for="(row, rankIndex) in boardMatrix" :key="rankIndex" class="board-row">
              <div v-for="(square, fileIndex) in row" :key="`${rankIndex}-${fileIndex}`" :class="[
                'square',
                getSquareColor(rankIndex, fileIndex),
                { 'square-selected': isSquareSelected(rankIndex, fileIndex) },
                { 'square-highlight': isHighlightedSquare(rankIndex, fileIndex) },
                { 'square-last-move': isLastMoveSquare(rankIndex, fileIndex) }
              ]" @click="handleSquareClick(rankIndex, fileIndex)" @dragover.prevent
                @drop="handleDrop($event, rankIndex, fileIndex)">
                <div v-if="square" class="piece" :class="[
                  { 'piece-animated': isAnimated },
                  { 'piece-draggable': canDragPiece(rankIndex, fileIndex) }
                ]" :style="getPieceStyle(square)" draggable="true"
                  @dragstart="handleDragStart($event, rankIndex, fileIndex)" @dragend="handleDragEnd">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Game controls and status below the board -->
        <div class="game-controls">
          <div class="move-status" :class="moveStatus.type">
            {{ moveStatus.message }}
          </div>
          <button class="control-btn new-puzzle" @click="initializeBoardFromAPI" :disabled="isLoading">
            New Puzzle
          </button>
          <button class="control-btn reset" @click="resetPuzzle" :disabled="!gameId">
            Reset
          </button>
        </div>
      </div>

      <!-- Stockfish Analysis Panel -->
      <div class="analysis-panel">
        <div class="engine-status" v-if="!engineReady">
          <div class="status-indicator">
            <div v-if="stockfish === null">
              Initializing Stockfish...
            </div>
            <div v-else-if="!engineReady" class="error-message">
              Waiting for engine to be ready...
              <button @click="initializeStockfish" class="retry-btn">
                Retry
              </button>
            </div>
          </div>
        </div>

        <div class="engine-analysis" v-else>
          <h3>Engine Analysis</h3>
          <div class="evaluation-container">
            <div class="evaluation-bar" :style="getEvaluationBarStyle()">
              <div class="eval-value">{{ getEvaluationText() }}</div>
            </div>
          </div>

          <div class="analysis-info">
            <div class="analyzing-status" v-if="isAnalyzing">
              <div class="analyzing-spinner"></div>
              Analyzing position...
            </div>
            <div class="best-move" v-if="bestMove && !isAnalyzing">
              <span class="label">Best move:</span>
              <span class="move">{{ bestMove }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Move history with analysis -->
    <div class="move-history" v-if="moveHistory.length">
      <h3>Moves with Analysis</h3>
      <div class="moves-list">
        <span v-for="(move, index) in moveHistory" :key="index" :class="[
          'move-entry',
          { 'current-move': currentMoveIndex === index }
        ]">
          {{ formatMove(move, index) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { Chess } from 'chess.js';

const API_BASE_URL = 'https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-5050.app.github.dev';

const generatePlayerName = () => {
  const adjectives = ['Clever', 'Swift', 'Tactical', 'Strategic', 'Bold', 'Sneaky', 'Patient'];
  const pieces = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${pieces[Math.floor(Math.random() * pieces.length)]
    }${Math.floor(Math.random() * 1000)}`;
};

export default {
  name: 'ChessBoard',
  data() {
    return {
      files: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      ranks: ['8', '7', '6', '5', '4', '3', '2', '1'],
      boardMatrix: [],
      selectedSquare: null,
      isAnimated: true,
      gameEnded: false,
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
      playerName: generatePlayerName(),
      apiBaseUrl: API_BASE_URL,
      chess: null,
      isDragging: false,
      legalMoves: [],
      moveHistory: [],
      lastMove: null,
      isLoading: false,
      highlightedSquares: new Set(),
      // Stockfish related data
      stockfish: null,
      engineDepth: 15,
      currentEvaluation: null,
      isAnalyzing: false,
      engineReady: false,
      bestMove: null,
      analysisHistory: [],
    };
  },

  computed: {
    currentTurn() {
      return this.chess ? this.chess.turn() : null;
    },
    getEvaluationBarStyle() {
      if (this.currentEvaluation === null) return { height: '50%' };

      // Convert evaluation to percentage (clamp between 10% and 90%)
      const evalScore = Math.max(-5, Math.min(5, this.currentEvaluation));
      const percentage = 50 + (evalScore * 8);
      return {
        height: `${percentage}%`,
        background: this.currentEvaluation >= 0
          ? 'linear-gradient(to bottom, #4ade80, #22c55e)'
          : 'linear-gradient(to bottom, #f87171, #dc2626)'
      };
    }
  },

  async created() {
    this.chess = new Chess();
    await this.initializeStockfish();
    this.fetchUserStats();
    this.initializeBoardFromAPI();
  },

  beforeDestroy() {
    if (this.stockfish) {
      this.stockfish.postMessage('quit');
    }
  },

  methods: {
    async initializeStockfish() {
      try {
        // Create a new worker directly (don't load external script first)
        this.stockfish = new Worker('/stockfish.wasm');


        // Set up error handling
        this.stockfish.onerror = (error) => {
          console.error('Stockfish worker error:', error);
          this.engineReady = false;
        };

        // Set up message handling
        this.stockfish.onmessage = (event) => {
          const message = event.data;
          console.log('Stockfish message:', message); // Debug logging

          if (message === 'uciok') {
            console.log('UCI OK received');
            this.stockfish.postMessage('isready');
          }
          else if (message === 'readyok') {
            console.log('Engine ready');
            this.engineReady = true;
            this.stockfish.postMessage('ucinewgame');
            this.stockfish.postMessage('setoption name MultiPV value 1');
          }
          else if (message.includes('bestmove')) {
            this.isAnalyzing = false;
            const bestMove = message.split(' ')[1];
            this.bestMove = bestMove;
          }
          else if (message.includes('score cp')) {
            const scoreMatch = message.match(/score cp ([-\d]+)/);
            if (scoreMatch) {
              const score = parseInt(scoreMatch[1]) / 100;
              this.currentEvaluation = score;
            }
          }
        };

        // Initialize the engine
        this.stockfish.postMessage('uci');

        console.log('Stockfish initialization started');

      } catch (error) {
        console.error('Error initializing Stockfish:', error);
        this.engineReady = false;
      }
    },

    handleStockfishMessage(event) {
      const message = event.data;

      if (message === 'readyok') {
        this.engineReady = true;
      }
      else if (message.includes('bestmove')) {
        this.isAnalyzing = false;
        const bestMove = message.split(' ')[1];
        this.bestMove = bestMove;
      }
      else if (message.includes('score cp')) {
        const scoreMatch = message.match(/score cp ([-\d]+)/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]) / 100;
          this.currentEvaluation = score;

          if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            this.analysisHistory.push({
              move: lastMove,
              evaluation: score,
              bestMove: this.bestMove
            });
          }
        }
      }
    },

    // Analyze current position with debounce to prevent overload
    analyzePosition: debounce(function () {
      if (!this.engineReady || this.isAnalyzing) return;

      this.isAnalyzing = true;
      const fen = this.chess.fen();

      this.stockfish.postMessage('position fen ' + fen);
      this.stockfish.postMessage('go depth ' + this.engineDepth);
    }, 500),

    getEvaluationText() {
      if (this.currentEvaluation === null) return 'Analyzing...';

      const score = Math.abs(this.currentEvaluation);
      const color = this.currentEvaluation > 0 ? 'White' : 'Black';

      if (score > 5) {
        return `${color} is winning (+${score.toFixed(1)})`;
      } else if (score > 2) {
        return `${color} has clear advantage (+${score.toFixed(1)})`;
      } else if (score > 0.5) {
        return `${color} is slightly better (+${score.toFixed(1)})`;
      } else {
        return 'Position is equal';
      }
    },

    async fetchUserStats() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/stats/${this.playerName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        const stats = await response.json();
        this.puzzleRating = stats.rating || 0;
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    },

    async initializeBoardFromAPI() {
      this.isLoading = true;
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/puzzle/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            playerId: this.playerName,
            targetRating: this.puzzleRating
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create new game');
        }

        const game = await response.json();
        this.gameId = game.gameId;
        this.puzzleRating = game.puzzleRating;

        // Reset game state
        this.gameEnded = false;
        this.selectedSquare = null;
        this.highlightedSquares.clear();
        this.moveHistory = [];
        this.lastMove = null;
        this.currentEvaluation = null;
        this.bestMove = null;
        this.analysisHistory = [];

        // Initialize new board position
        this.initializeBoard(game.fen);

        this.moveStatus = {
          type: 'info',
          message: 'Make your move'
        };

        // Start analyzing new position
        this.analyzePosition();

      } catch (error) {
        console.error('Error initializing board:', error);
        // If API fails, initialize with default starting position
        this.initializeBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      } finally {
        this.isLoading = false;
      }
    },

    initializeBoard(fen) {
      if (!fen) {
        this.boardMatrix = Array(8).fill().map(() => Array(8).fill(null));
        return;
      }

      try {
        this.chess.load(fen);
        this.updateBoardMatrix();
      } catch (error) {
        console.error('Error initializing board:', error);
        this.boardMatrix = Array(8).fill().map(() => Array(8).fill(null));
      }
    },

    updateBoardMatrix() {
      const position = this.chess.board();
      this.boardMatrix = position.map(row =>
        row.map(square => {
          if (!square) return null;
          const piece = square.type.toLowerCase();
          //const color = square.color === 'w' ? 'w' : 'b';
          return this.pieceMap[square.color === 'w' ? piece.toUpperCase() : piece];
        })
      );
    },

    async makeMove(from, to) {
      try {
        const move = this.chess.move({
          from: from,
          to: to,
          promotion: 'q'
        });

        if (!move) {
          return false;
        }

        // Update the visual board
        this.updateBoardMatrix();

        // Record move
        const moveRecord = {
          from,
          to,
          fen: this.chess.fen(),
          evaluation: null
        };
        this.moveHistory.push(moveRecord);
        this.lastMove = moveRecord;

        // Check for game end conditions
        if (this.chess.isCheckmate()) {
          const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
          this.moveStatus = {
            type: 'success',
            message: `Checkmate! ${winner} wins!`
          };
          // Optionally disable further moves
          this.gameEnded = true;
        } else if (this.chess.isDraw()) {
          this.moveStatus = {
            type: 'info',
            message: 'Game drawn!'
          };
          this.gameEnded = true;
        } else if (this.chess.isStalemate()) {
          this.moveStatus = {
            type: 'info',
            message: 'Stalemate!'
          };
          this.gameEnded = true;
        }

        // Start position analysis
        this.analyzePosition();

        // Notify the API but don't wait for response
        fetch(`${this.apiBaseUrl}/api/puzzle/${this.gameId}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ from, to })
        }).catch(() => { });

        return true;
      } catch (error) {
        console.error('Move error:', error);
        return false;
      }
    },

    handleDragStart(event, rankIndex, fileIndex) {
      if (!this.canDragPiece(rankIndex, fileIndex)) {
        event.preventDefault();
        return;
      }

      this.isDragging = true;
      this.selectedSquare = { rank: rankIndex, file: fileIndex };
      event.dataTransfer.setData('text/plain',
        this.getSquareNotation(rankIndex, fileIndex));

      this.calculateLegalMoves(rankIndex, fileIndex);
    },

    handleDragEnd() {
      this.isDragging = false;
      this.selectedSquare = null;
      this.highlightedSquares.clear();
    },

    async handleDrop(event, toRankIndex, toFileIndex) {
      event.preventDefault();
      const fromSquare = event.dataTransfer.getData('text/plain');
      const toSquare = this.getSquareNotation(toRankIndex, toFileIndex);

      if (fromSquare === toSquare) return;

      await this.makeMove(fromSquare, toSquare);

      this.isDragging = false;
      this.selectedSquare = null;
      this.highlightedSquares.clear();
    },

    async handleSquareClick(rankIndex, fileIndex) {
      if (!this.selectedSquare) {
        if (this.canSelectSquare(rankIndex, fileIndex)) {
          this.selectedSquare = { rank: rankIndex, file: fileIndex };
          this.calculateLegalMoves(rankIndex, fileIndex);
        }
      } else {
        const fromSquare = this.getSquareNotation(
          this.selectedSquare.rank,
          this.selectedSquare.file
        );
        const toSquare = this.getSquareNotation(rankIndex, fileIndex);

        if (fromSquare === toSquare) {
          this.selectedSquare = null;
          this.highlightedSquares.clear();
          return;
        }

        await this.makeMove(fromSquare, toSquare);

        this.selectedSquare = null;
        this.highlightedSquares.clear();
      }
    },

    calculateLegalMoves(rankIndex, fileIndex) {
      const square = this.getSquareNotation(rankIndex, fileIndex);
      this.legalMoves = this.chess.moves({
        square,
        verbose: true
      });

      this.highlightedSquares.clear();
      this.legalMoves.forEach(move => {
        this.highlightedSquares.add(move.to);
      });
    },

    canSelectSquare(rankIndex, fileIndex) {
      if (this.gameEnded) return false;
      const square = this.getSquareNotation(rankIndex, fileIndex);
      const piece = this.chess.get(square);
      return piece && piece.color === this.chess.turn();
    },

    canDragPiece(rankIndex, fileIndex) {
      if (this.gameEnded) return false;
      const square = this.getSquareNotation(rankIndex, fileIndex);
      const piece = this.chess.get(square);
      return piece && piece.color === this.chess.turn();
    },

    getSquareNotation(rankIndex, fileIndex) {
      return `${this.files[fileIndex]}${this.ranks[rankIndex]}`;
    },

    getSquareColor(rankIndex, fileIndex) {
      return (rankIndex + fileIndex) % 2 === 0 ? 'square-light' : 'square-dark';
    },

    isSquareSelected(rankIndex, fileIndex) {
      return this.selectedSquare &&
        this.selectedSquare.rank === rankIndex &&
        this.selectedSquare.file === fileIndex;
    },

    isHighlightedSquare(rankIndex, fileIndex) {
      const square = this.getSquareNotation(rankIndex, fileIndex);
      return this.highlightedSquares.has(square);
    },

    isLastMoveSquare(rankIndex, fileIndex) {
      if (!this.lastMove) return false;
      const square = this.getSquareNotation(rankIndex, fileIndex);
      return square === this.lastMove.from || square === this.lastMove.to;
    },

    getPieceStyle(piece) {
      return {
        backgroundImage: `url(${require(`@/assets/chesspieces/${piece}.png`)})`,
      };
    },

    formatMove(move, index) {
      if (!move) return '';
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhite = index % 2 === 0;
      const analysis = this.analysisHistory[index];
      const evalText = analysis ? ` (${analysis.evaluation.toFixed(1)})` : '';

      return isWhite
        ? `${moveNumber}. ${move.from}-${move.to}${evalText}`
        : `${move.from}-${move.to}${evalText}`;
    },

    async resetPuzzle() {
      if (!this.gameId) return;

      // Reset game state
      this.gameEnded = false;
      this.selectedSquare = null;
      this.highlightedSquares.clear();
      this.moveHistory = [];
      this.lastMove = null;
      this.currentEvaluation = null;
      this.bestMove = null;
      this.analysisHistory = [];

      this.chess.reset();
      this.updateBoardMatrix();

      this.moveStatus = {
        type: 'info',
        message: 'Board reset'
      };

      // Start analyzing new position
      this.analyzePosition();
    }
  }
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
</script>

<style scoped>
/* General container styling */
.chess-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  height: 300vh;
  /* Adjust height to approximately 3 viewports */
  width: 100%;
  background: linear-gradient(to bottom right, #1e293b, #0f172a);
  color: #e5e7eb;
  position: relative;
  overflow: hidden;
  padding: 20px 0;
}

.board-and-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}

/* Chess Board Styling */

.chess-board {
  width: 640px;
  height: 640px;
  background: #2a2a2a;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  position: relative;
}

/* Smooth board entry animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Board squares */
.board {
  position: absolute;
  top: 30px;
  left: 30px;
  width: calc(100% - 60px);
  height: calc(100% - 60px);
  background: repeating-linear-gradient(45deg, #f4f4f4, #f4f4f4 12.5%, #aaa 12.5%, #aaa 25%);
}

/* Coordinates (letters/numbers on sides of the board) */
.coordinates {
  position: absolute;
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  font-weight: bold;
  color: #cbd5e1;
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

/* Squares */
.board-row {
  display: flex;
  height: 12.5%;
}

.square {
  width: 12.5%;
  height: 100%;
  position: relative;
  transition: background-color 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.square-light {
  background-color: #f3edda;
}

.square-dark {
  background-color: #806e5f;
}

.square:hover {
  cursor: pointer;
  transform: scale(1.05);
  z-index: 10;
  box-shadow: inset 0 0 0 3px rgba(255, 255, 0, 0.5);
}

/* Selected square */
.square-selected {
  background-color: rgba(42, 157, 143, 0.8);
  box-shadow: inset 0 0 0 3px #2a9d8f;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

/* Highlighted legal move dots */
.square-highlight::after {
  content: '';
  width: 12%;
  height: 12%;
  background: rgba(79, 242, 188, 0.7);
  border-radius: 50%;
  display: block;
  position: absolute;
}

/* Pieces */
.piece {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  cursor: grab;
  transition: transform 0.3s ease-in-out;
}



/* Game Header */
.game-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 18px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.player-info,
.puzzle-rating {
  color: #f8fafc;
}

/* Game Controls */
.game-controls {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
  width: 100%;
}

.control-btn {
  padding: 12px 20px;
  border-radius: 8px;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease-in-out;
}

.control-btn:hover {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.control-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
}

/* Move Status */

.move-status {
  padding: 12px 18px;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  text-align: center;
}

/* Move History */
.move-history {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 640px;
  color: #f9fafb;
}

.moves-list span {
  padding: 6px 12px;
  border-radius: 4px;
  margin: 2px;
  display: inline-block;
  transition: background 0.2s;
}

.moves-list span.current-move {
  background: #2563eb;
  color: #ffffff;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .chess-board {
    width: 90vw;
    height: 90vw;
  }

  .game-header {
    flex-direction: column;
    align-items: center;
  }

  .game-controls {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .move-history {
    font-size: 14px;
  }
}

@media screen and (max-width: 480px) {
  .coordinates {
    font-size: 12px;
  }

  .piece {
    background-size: 90%;
  }

  .control-btn {
    font-size: 14px;
    padding: 8px 16px;
  }
}


/* Add these to your existing CSS */

.board-and-analysis {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.analysis-panel {
  width: 280px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.engine-status {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator {
  color: #60a5fa;
  font-size: 16px;
  text-align: center;
}

.engine-analysis h3 {
  color: #f8fafc;
  margin-bottom: 15px;
  font-size: 18px;
}

.evaluation-container {
  height: 200px;
  background: #1e293b;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  margin-bottom: 15px;
}

.evaluation-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(to bottom, #4ade80, #22c55e);
  transition: height 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eval-value {
  color: #f8fafc;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  padding: 4px 8px;
}

.analysis-info {
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.analyzing-status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #60a5fa;
  font-style: italic;
}

.analyzing-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #60a5fa;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.best-move {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.best-move .label {
  color: #94a3b8;
}

.best-move .move {
  color: #4ade80;
  font-weight: bold;
}

.move-entry {
  display: inline-block;
  padding: 4px 8px;
  margin: 2px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s;
}

.move-entry:hover {
  background: rgba(255, 255, 255, 0.1);
}

.current-move {
  background: #2563eb;
  color: white;
}

/* Responsive Design */
@media screen and (max-width: 1200px) {
  .board-and-analysis {
    flex-direction: column;
  }

  .analysis-panel {
    width: 100%;
    max-width: 640px;
  }

  .evaluation-container {
    height: 100px;
  }
}

.error-message {
  color: #ef4444;
  text-align: center;
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}
</style>