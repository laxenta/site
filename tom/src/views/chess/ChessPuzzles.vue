<template>
  <div class="chess-container">
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
    <div class="board-and-analysis-wrapper">
      <div class="board-section">
        <div class="vertical-eval-bar">
          <div class="eval-bar-container">
            <div class="eval-bar" :style="getEvaluationBarStyle">
              <span class="eval-number">
                {{ currentEvaluation ? currentEvaluation.toFixed(1) : '0.0' }}
              </span>
            </div>
          </div>
        </div>

        <div class="chess-board" :class="{ 'board-animated': isAnimated }" @dragover.prevent @drop="handleDrop">
          <div class="coordinates files">
            <span v-for="file in files" :key="file">{{ file }}</span>
          </div>
          <div class="coordinates ranks">
            <span v-for="rank in ranks" :key="rank">{{ rank }}</span>
          </div>
          <div class="board">
            <div v-for="(row, rankIndex) in boardMatrix" :key="rankIndex" class="board-row">
              <div
                v-for="(square, fileIndex) in row"
                :key="`${rankIndex}-${fileIndex}`"
                :class="[
                  'square',
                  getSquareColor(rankIndex, fileIndex),
                  { 'square-selected': isSquareSelected(rankIndex, fileIndex) },
                  { 'square-highlight': isHighlightedSquare(rankIndex, fileIndex) },
                  { 'square-last-move': isLastMoveSquare(rankIndex, fileIndex) }
                ]"
                @click="handleSquareClick(rankIndex, fileIndex)"
                @dragover.prevent
                @drop="handleDrop($event, rankIndex, fileIndex)"
              >
                <div
                  v-if="square"
                  class="piece"
                  :class="[
                    { 'piece-animated': isAnimated },
                    { 'piece-draggable': canDragPiece(rankIndex, fileIndex) }
                  ]"
                  :style="getPieceStyle(square)"
                  draggable="true"
                  @dragstart="handleDragStart($event, rankIndex, fileIndex)"
                  @dragend="handleDragEnd"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div class="game-controls">
          <div
            class="move-status"
            :class="[ moveStatus.type, chess?.turn() === 'w' ? 'white-turn' : 'black-turn' ]"
          >
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

      <!-- Sidebar: Analysis & Move History -->
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
        <div class="move-history" v-if="moveHistory.length">
          <h3>Moves with Analysis</h3>
          <div class="moves-list">
            <span
              v-for="(move, index) in moveHistory"
              :key="index"
              :class="['move-entry', { 'current-move': currentMoveIndex === index }]"
            >
              {{ formatMove(move, index) }}
            </span>
          </div>
        </div>
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
      const response = await fetch(
        `${this.baseUrl}/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
          }
        }
      );

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
      puzzlesSolved: 0,
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

        this.gameEnded = false;
        this.selectedSquare = null;
        this.highlightedSquares.clear();
        this.moveHistory = [];
        this.lastMove = null;
        this.currentEvaluation = null;
        this.bestMove = null;
        this.analysisHistory = [];

        this.initializeBoard(game.fen);

        this.moveStatus = {
          type: 'info',
          message: 'Make your move'
        };

        this.analyzePosition();

      } catch (error) {
        console.error('Error initializing board:', error);
        this.initializeBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      } finally {
        this.isLoading = false;
      }
    },

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

        this.updateBoardMatrix();

        const moveRecord = {
          from,
          to,
          fen: this.chess.fen(),
          evaluation: null
        };
        this.moveHistory.push(moveRecord);
        this.lastMove = moveRecord;

        if (this.chess.isCheckmate()) {
          const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
          this.moveStatus = {
            type: 'success',
            message: `Checkmate! ${winner} wins!`
          };
          this.gameEnded = true;
          // Increment puzzles solved and update progress in localStorage
          this.puzzlesSolved++;
          this.updateChessProgress();
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

        this.analyzePosition();

        fetch(`${this.apiBaseUrl}/api/puzzle/${this.gameId}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ from, to })
        }).catch(() => {});

        return true;
      } catch (error) {
        console.error('Move error:', error);
        return false;
      }
    },

    updateChessProgress() {
      const progress = {
        puzzlesSolved: this.puzzlesSolved
      };
      localStorage.setItem('chessProgress', JSON.stringify(progress));
    },

    handleDragStart(event, rankIndex, fileIndex) {
      if (!this.canDragPiece(rankIndex, fileIndex)) {
        event.preventDefault();
        return;
      }
      this.isDragging = true;
      this.selectedSquare = { rank: rankIndex, file: fileIndex };
      event.dataTransfer.setData('text/plain', this.getSquareNotation(rankIndex, fileIndex));
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
      if (!toRankIndex !== undefined && toFileIndex !== undefined) {
        const toSquare = this.getSquareNotation(toRankIndex, toFileIndex);
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
        const fromSquare = this.getSquareNotation(this.selectedSquare.rank, this.selectedSquare.file);
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
      this.legalMoves = this.chess.moves({ square, verbose: true });
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
        backgroundImage: `url(${require(`@/assets/chesspieces/${piece}.png`)})`
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

<!--honestly writting without spacing is so easy on eyes for me ;c like damn 600-700 lines of styling in like 100 ;p so cooolllllll, imma show it to ma friends-->
<style scoped>
*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;font-family:'Inter',sans-serif;background:#000;color:#fff}*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
.chess-container{width:100%;min-height:100vh;padding:20px;background:#000;display:flex;flex-direction:column;align-items:center}
.game-header{width:100%;max-width:1200px;margin-bottom:20px;padding:15px 30px;background:#111;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
.game-header .header-left,.game-header .header-right{display:flex;flex-direction:column;gap:8px}
.game-header .player-info,.game-header .puzzle-rating,.game-header .user-info,.game-header .current-time{font-size:16px;color:#fff}
.board-and-analysis-wrapper{display:flex;width:100%;max-width:1200px;gap:20px;min-height:800px;flex-wrap:nowrap}
.board-section{flex:0 0 70%;position:relative;display:flex;flex-direction:column;align-items:center}
.chess-board{width:80vh;height:80vh;background:#222;border-radius:8px;box-shadow:0 8px 16px rgba(0,0,0,0.7);position:relative;overflow:hidden}
.vertical-eval-bar{position:absolute;left:-60px;top:50px;width:40px;height:calc(100% - 100px);background:#333;border-radius:8px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:10px}
.eval-bar{width:100%;transition:height 0.3s ease}
.eval-number{position:absolute;right:-50px;font-size:14px;color:#fff;font-weight:bold}
.coordinates{position:absolute;font-size:14px;font-weight:bold;color:#fff}
.coordinates.files{bottom:10px;left:50px;right:50px;display:flex;justify-content:space-between}
.coordinates.ranks{top:50px;bottom:50px;left:10px;display:flex;flex-direction:column;justify-content:space-between}
.board{position:absolute;top:50px;left:50px;width:calc(100% - 100px);height:calc(100% - 100px);display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:3px solid #444;border-radius:4px}
.board-row{display:contents}
.square{position:relative;width:100%;height:100%;transition:background-color 0.2s ease,transform 0.2s ease;display:flex;align-items:center;justify-content:center}
.square-light{background-color:#f0d9b5}
.square-dark{background-color:#b58863}
.square:hover{transform:scale(1.05);z-index:2;box-shadow:inset 0 0 0 3px rgba(255,255,255,0.3);cursor:pointer}
.square-selected{background-color:rgba(6,255,97,0.8);box-shadow:inset 0 0 0 3px #2a9d8f}
.square-highlight::after{content:"";position:absolute;width:30%;height:30%;background:rgba(79,242,188,0.7);border-radius:50%;top:35%;left:35%}
.square-last-move{background-color:rgba(255,255,0,0.3);box-shadow:inset 0 0 0 2px #ffd700}
.piece{width:90%;height:90%;background-size:contain;background-position:center;background-repeat:no-repeat;cursor:grab;transition:transform 0.3s ease}
.piece-animated{animation:pieceBounce 0.5s ease-in-out}
@keyframes pieceBounce{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
.piece-draggable{cursor:grab}
.king-in-check{border:2px solid red;box-shadow:0 0 8px red}
.game-controls{width:100%;margin-top:20px;display:flex;justify-content:center;gap:20px}
.control-btn{padding:10px 24px;border-radius:12px;background:linear-gradient(45deg,#babec9,#111211);color:#fff;font-size:16px;font-weight:bold;border:none;box-shadow:0 4px 6px rgba(0,0,0,0.3);transition:transform 0.3s ease}
.control-btn:hover{background:linear-gradient(45deg,#2563eb,#1d4ed8);transform:translateY(-2px);box-shadow:0 6px 12px rgba(0,0,0,0.4)}
.control-btn:disabled{background:#4b5563;cursor:not-allowed}
.move-status{padding:12px 24px;border-radius:8px;font-size:16px;font-weight:bold;text-align:center;min-width:200px;background:rgba(255,255,255,0.1)}
.white-turn{background:linear-gradient(45deg,#f3f4f6,#d1d5db);color:#1f2937;border:2px solid #e5e7eb}
.black-turn{background:linear-gradient(45deg,#1f2937,#111827);color:#fff;border:2px solid #374151}
.move-status.success{background:linear-gradient(45deg,#34d399,#10b981);color:#fff;border:2px solid #059669}
.move-status.error{background:linear-gradient(45deg,#ef4444,#dc2626);color:#fff;border:2px solid #b91c1c}
.analysis-panel{flex:0 0 30%;background:#000;border:2px solid #444;border-radius:8px;padding:20px;box-shadow:0 8px 16px rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:20px;max-height:800px;overflow-y:auto}
.engine-analysis{background:#111;border-radius:8px;padding:15px;box-shadow:0 4px 8px rgba(255,255,255,0.1)}
.engine-analysis h3{font-size:20px;color:#fff;margin-bottom:10px;text-align:center}
.analysis-info{font-size:16px;line-height:1.4;background:#000;padding:10px;border-radius:6px;color:#fff}
.analyzing-status{display:flex;align-items:center;gap:10px;color:#aaa;font-style:italic}
.analyzing-spinner{width:16px;height:16px;border:2px solid #fff;border-top:2px solid transparent;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.move-history{background:#000;border:2px solid #444;border-radius:8px;padding:15px;box-shadow:0 4px 8px rgba(255,255,255,0.1)}
.move-history h3{font-size:18px;margin-bottom:10px;color:#fff;text-align:center}
.moves-list{display:flex;flex-wrap:wrap;gap:8px}
.move-entry{background:rgba(255,255,255,0.1);padding:6px 10px;border-radius:4px;transition:background 0.2s;cursor:pointer}
.move-entry:hover{background:rgba(255,255,255,0.2)}
.current-move{background:#2563eb;color:#fff}
@media screen and (max-width:1200px){.board-and-analysis-wrapper{flex-direction:column;align-items:center}.board-section,.analysis-panel{width:100%}.analysis-panel{margin-top:20px}}
@media screen and (max-width:768px){.chess-board{width:70vh;height:70vh}.coordinates{font-size:12px}.control-btn{font-size:14px;padding:8px 16px}}
@media screen and (max-width:480px){.chess-board{width:60vh;height:60vh}.game-header{flex-direction:column;align-items:center}}
.flex{display:flex}.flex-col{flex-direction:column}.flex-row{flex-direction:row}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.align-center{align-items:center}.text-center{text-align:center}.w-full{width:100%}.h-full{height:100%}
.mt-1{margin-top:0.25rem}.mt-2{margin-top:0.5rem}.mt-3{margin-top:0.75rem}.mt-4{margin-top:1rem}.mt-5{margin-top:1.25rem}.mt-6{margin-top:1.5rem}.mt-7{margin-top:1.75rem}.mt-8{margin-top:2rem}
.mb-1{margin-bottom:0.25rem}.mb-2{margin-bottom:0.5rem}.mb-3{margin-bottom:0.75rem}.mb-4{margin-bottom:1rem}.mb-5{margin-bottom:1.25rem}.mb-6{margin-bottom:1.5rem}.mb-7{margin-bottom:1.75rem}.mb-8{margin-bottom:2rem}
.text-sm{font-size:0.875rem}.text-base{font-size:1rem}.text-lg{font-size:1.125rem}.text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}.text-3xl{font-size:1.875rem}.text-4xl{font-size:2.25rem}.text-5xl{font-size:3rem}
.font-thin{font-weight:100}.font-light{font-weight:300}.font-normal{font-weight:400}.font-medium{font-weight:500}.font-bold{font-weight:700}.font-extrabold{font-weight:800}.font-black{font-weight:900}
.p-1{padding:0.25rem}.p-2{padding:0.5rem}.p-3{padding:0.75rem}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.p-7{padding:1.75rem}.p-8{padding:2rem}
.m-1{margin:0.25rem}.m-2{margin:0.5rem}.m-3{margin:0.75rem}.m-4{margin:1rem}.m-5{margin:1.25rem}.m-6{margin:1.5rem}.m-7{margin:1.75rem}.m-8{margin:2rem}
</style>
