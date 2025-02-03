<template>
  <div class="chess-container">
    <!-- Header -->
    <div class="game-header">
      <div class="header-left">
        <div class="player-info">Player: {{ playerName }}</div>
        <div class="puzzle-rating">Rating: {{ puzzleRating }}</div>
      </div>
      <div class="header-right">
        <div class="user-info">{{ currentUser }}</div>
        <div class="current-time">{{ formattedDateTime }}</div>
      </div>
    </div>

    <!-- Main board and analysis section -->
    <div class="board-and-analysis">
      <!-- Left side - Board and controls -->
      <div class="board-section">
        <!-- Vertical evaluation bar -->
        <div class="vertical-eval-bar">
          <div class="eval-bar-container">
            <div class="eval-bar" :style="getEvaluationBarStyle">
              <span class="eval-number">
                {{ currentEvaluation ? currentEvaluation.toFixed(1) : '0.0' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Chess board -->
        <div class="chess-board" :class="{ 'board-animated': isAnimated }" @dragover.prevent @drop="handleDrop">
          <div class="coordinates files">
            <span v-for="file in files" :key="file">{{ file }}</span>
          </div>
          <div class="coordinates ranks">
            <span v-for="rank in ranks" :key="rank">{{ rank }}</span>
          </div>

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

        <!-- Controls -->
        <div class="game-controls">
          <!-- Replace your existing move-status div in the game-controls section -->
          <div class="move-status" :class="[
            moveStatus.type,
            chess?.turn() === 'w' ? 'white-turn' : 'black-turn'
          ]">
            {{ getMoveStatusMessage() }}
          </div>
          <button class="control-btn new-puzzle" @click="initializeBoardFromAPI" :disabled="isLoading">
            New Puzzle
          </button>
          <button class="control-btn reset" @click="resetPuzzle" :disabled="!gameId">
            Reset
          </button>
        </div>
      </div>

      <!-- Right side - Analysis panel -->
      <div class="analysis-panel">
        <div class="engine-analysis">
          <h3>Position Analysis</h3>
          <div class="analysis-info">
            <div v-if="isAnalyzing" class="analyzing-status">
              <div class="analyzing-spinner"></div>
              Analyzing...
            </div>
            <div v-else>
              {{ getEvaluationText() }}
            </div>
            <div v-if="bestMove" class="best-move">
              <span class="label">Best move:</span>
              <span class="move">{{ bestMove }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Move history -->
    <div class="move-history" v-if="moveHistory.length">
      <h3>Moves with Analysis</h3>
      <div class="moves-list">
        <span v-for="(move, index) in moveHistory" :key="index"
          :class="['move-entry', { 'current-move': currentMoveIndex === index }]">
          {{ formatMove(move, index) }}
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import { Chess } from 'chess.js';

const API_BASE_URL = 'https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-5050.app.github.dev';

class LichessService {
    constructor() {
        this.baseUrl = 'https://lichess.org/api';
        this.token = 'lip_2iBBN7H4Hs38jGw5bLlZ';
    }

    async analyzePosition(fen, multiPv = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                score: data.pvs[0].cp / 100,
                bestMove: data.pvs[0].moves.split(' ')[0],
                depth: data.depth
            };
        } catch (error) {
            console.error('Lichess analysis failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const generatePlayerName = () => {
    const adjectives = ['Clever', 'Swift', 'Tactical', 'Strategic', 'Bold', 'Sneaky', 'Patient'];
    const pieces = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${pieces[Math.floor(Math.random() * pieces.length)]}${Math.floor(Math.random() * 1000)}`;
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
            currentMoveIndex: 0,
            engineDepth: 15,
            currentEvaluation: null,
            isAnalyzing: false,
            bestMove: null,
            analysisHistory: [],

            lichessService: new LichessService()
        };
    },

    computed: {
        currentTurn() {
            return this.chess ? this.chess.turn() : null;
        },
        getEvaluationBarStyle() {
            if (this.currentEvaluation === null) return { height: '50%' };

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
        this.fetchUserStats();
        this.initializeBoardFromAPI();
    },

    methods: {
        analyzePosition: debounce(async function() {
            if (this.isAnalyzing) return;
            
            this.isAnalyzing = true;
            try {
                const result = await this.lichessService.analyzePosition(this.chess.fen());
                if (result.success) {
                    this.currentEvaluation = result.score;
                    this.bestMove = result.bestMove;
                    
                    // Add to analysis history
                    this.analysisHistory.push({
                        fen: this.chess.fen(),
                        evaluation: result.score,
                        depth: result.depth
                    });
                }
            } catch (error) {
                console.error('Analysis failed:', error);
            } finally {
                this.isAnalyzing = false;
            }
        }, 500),

        // Rest of your methods remain the same
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
// just added
    getMoveStatusMessage() {
  if (this.gameEnded) {
    return this.moveStatus.message;
  }
  
  const turn = this.chess?.turn();
  const color = turn === 'w' ? 'White' : 'Black';
  return `${color} to move`;
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

        // Start position analysis (now via API)
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

    handleDrop(event, toRankIndex, toFileIndex) {
      event.preventDefault();
      const fromSquare = event.dataTransfer.getData('text/plain');
      
      // Add validation
      if (!toRankIndex !== undefined && toFileIndex !== undefined) {
        const toSquare = this.getSquareNotation(toRankIndex, toFileIndex);
        console.log('Move attempt:', { from: fromSquare, to: toSquare });
        if (fromSquare && toSquare) {
          this.makeMove(fromSquare, toSquare);
        }
      }

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

      this.analyzePosition();
    }
  }
};

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
.chess-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  height: 169vh; 
  width: 100%;
  background: linear-gradient(to bottom right, #1e293b, #0f172a);
  color: #0effcb;
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

.chess-board {
  width: 640px;
  height: 640px;
  margin-left: 5px;
  background: #2a2a2a;
  border-radius: 2px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: relative;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(1.9);
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
  font-size: 12px;
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

.square-selected {
  background-color: rgba(6, 255, 97, 0.8);
  box-shadow: inset 0 0 0 3px #2a9d8f;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

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
  cursor: grab; /* let people ggrab those lil pieces fr will change this to something cool if got time*/
  transition: transform 0.3s ease-in-out;
}

.game-header {
  display: flex;
  justify-content: space-between;
  width: 300%; 
  max-width: 1200px;
  margin: 20px auto; 
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 18px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.player-info,
.puzzle-rating {
  color: #fcf8fb;
}

.game-controls {
  display: flex;
  justify-content: space-around;
  margin: 20px 5;
  width: 95%;
}
/* if bts look ugly change them from here, considering idh much time so i write her jus in case someone tried to find it*/
.control-btn {
  padding: 4px 28px;
  border-radius: 12px;
  background: linear-gradient(to right, #babec9, #111211);
  color: #ffffff;
  font-size: 15px;
  font-weight: bold;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
  width: 90%;
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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

.board-and-analysis {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  justify-content: center;
  margin: 30px auto;
  width: 90%;
  max-width: 1200px;
  position: relative;
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
  color: #27fa38;
  font-size: 16px;
  text-align: center;
}

.engine-analysis h3 {
  color: #0c6ccb;
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

.analysis-info {
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.analyzing-status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #bfd1e7;
  font-style: italic;
}

.analyzing-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #eeeeee;
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
  margin-top: 3px;
  padding: 2px 4px;
  background: #3b82f6;
  border: none;
  border-radius: 2px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.vertical-eval-bar {
  position: absolute;
  left: -30px;
  top: 30px;
  height: calc(100% - 60px);
  width: 25px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
  z-index: 1;
}

.eval-bar-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.eval-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  transition: height 0.3s ease;
  background: linear-gradient(to bottom, #4ade80, #22c55e);
}

.eval-number {
  position: absolute;
  right: 30px;
  font-size: 12px;
  color: #ffffff;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

/* Optional: Add some padding to the board container to ensure proper spacing */
.board-and-controls {
  padding-left: 20px; /* Add padding to account for eval bar */
}

.move-status {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #ffffff;
    text-align: center;
    transition: all 0.3s ease;
    min-width: 200px;
}

.white-turn {
    background: linear-gradient(to right, #f3f4f6, #d1d5db);
    color: #1f2937;
    border: 2px solid #e5e7eb;
}

.black-turn {
    background: linear-gradient(to right, #1f2937, #111827);
    color: #ffffff;
    border: 2px solid #374151;
}

.move-status.success {
    background: linear-gradient(to right, #34d399, #10b981);
    color: #ffffff;
    border: 2px solid #059669;
}

.move-status.error {
    background: linear-gradient(to right, #ef4444, #dc2626);
    color: #ffffff;
    border: 2px solid #b91c1c;
}
</style>