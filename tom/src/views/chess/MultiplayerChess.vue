<template>
  <div class="chess-container">
    <div class="game-header">
      <div class="header-left">
        <div class="player-info">Player: {{ playerName }}</div>
        <div class="player-color">You are: {{ assignedColor }}</div>
      </div>
      <div class="header-right">
        <div class="turn-info">
          Turn:
          <span v-if="isYourTurn()" class="your-turn">Your move!</span>
          <span v-else class="waiting">Waiting for opponent...</span>
        </div>
        <div v-if="gameStatus" class="game-status">
          {{ gameStatus }}
        </div>
      </div>
    </div>
    <div class="board-container">
      <div class="chess-board">
        <!--uh these are the coloums-->
        <div class="coordinates files">
          <div v-for="file in displayFiles" :key="file">{{ file }}</div>
        </div>
        
        <!--rank coordinates (rows)-->
        <div class="coordinates ranks">
          <div v-for="rank in displayRanks" :key="rank">{{ rank }}</div>
        </div>
        
        <div class="board">
          <div v-for="(row, rankIndex) in boardMatrix" :key="rankIndex" class="board-row">
            <div
              v-for="(square, fileIndex) in row"
              :key="`${rankIndex}-${fileIndex}`"
              :class="[
                'square',
                getSquareColor(rankIndex, fileIndex),
                { 'square-selected': selectedSquare === getSquareNotation(rankIndex, fileIndex) },
                { 'square-last-move': isPartOfLastMove(rankIndex, fileIndex) }
              ]"
              @click="handleSquareClick(rankIndex, fileIndex)"
            >
              <div v-if="square" class="piece-container">
                <img
                  :src="getPieceImage(square)"
                  :alt="square"
                  class="piece-image"
                  @error="handleImageError"
                />
                <div v-if="!pieceImagesLoaded" class="piece-fallback">
                  {{ getPieceFallback(square) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="control-panel-button">
      <button class="control-btn" @click="toggleOptionsModal" :disabled="isLoading">
        Options
      </button>
    </div>
    <div class="options-modal" v-if="showOptionsModal">
      <div class="modal-content">
        <h3>Game Options</h3>
        <div class="modal-buttons">
          <button class="modal-btn new-game" @click="newGame" :disabled="isLoading">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            New Game
          </button>
          <button class="modal-btn resign" @click="resignGame" :disabled="isLoading">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Resign
          </button>
        </div>
        <button class="modal-close" @click="toggleOptionsModal">Close</button>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import { Chess } from "chess.js";

const DEFAULT_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const DEFAULT_RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
const generatePlayerName = () => {
  const adjectives = ["Clever", "Swift", "Tactical", "Bold", "Sneaky", "Royal", "Daring"];
  const pieces = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    pieces[Math.floor(Math.random() * pieces.length)] +
    Math.floor(Math.random() * 1000)
  );
};
//the backend will generate that automatically, replace it yrself niga
const API_BASE_URL = "https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-8081.app.github.dev/api";
export default {
  name: "MultiplayerChess",
  data() {
    return {
      files: [...DEFAULT_FILES],
      ranks: [...DEFAULT_RANKS],
      displayFiles: [...DEFAULT_FILES],
      displayRanks: [...DEFAULT_RANKS],
      boardMatrix: Array(8).fill().map(() => Array(8).fill(null)),
      gameId: null,
      playerId: null,
      assignedColor: "",
      moveHistory: [],
      lastMove: { from: null, to: null },
      selectedSquare: null,
      isLoading: false,
      playerName: "",
      turn: "",
      gameStatus: "",
      pollIntervalId: null,
      showOptionsModal: false,
      fallbackChess: null,
      pieceImagesLoaded: true,
      formattedMoveHistory: []
    };
  },
  created() {
    const storedPlayerName = localStorage.getItem("chessPlayerName");
    this.playerName = storedPlayerName || generatePlayerName();
    if (!storedPlayerName) localStorage.setItem("chessPlayerName", this.playerName);
    
    const storedPlayerId = localStorage.getItem("chessPlayerId");
    this.playerId = storedPlayerId || this.playerName + Date.now();
    if (!storedPlayerId) localStorage.setItem("chessPlayerId", this.playerId);
    
    this.joinGame();
  },
  mounted() {
    this.pollIntervalId = setInterval(() => {
      if (this.gameId) {
        this.refreshGameState();
      }
    }, 2000);
  },
  beforeUnmount() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
  },
  methods: {
    chunkArray(array, chunkSize) {
      const results = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        results.push(array.slice(i, i + chunkSize));
      }
      return results;
    },
    processBoardData(boardData) {
      let board = boardData;
      if (boardData.length && !Array.isArray(boardData[0])) {
        board = this.chunkArray(boardData, 8);
      }
      return board.map(row =>
        row.map(square =>
          square ? (square.color === "w" ? "w" : "b") + square.type.toUpperCase() : null
        )
      );
    },
    rotateMatrix(matrix) {
      return matrix.slice().reverse().map(row => row.slice().reverse());
    },
    async joinGame() {
      try {
        this.isLoading = true;
        this.gameStatus = "one moment..finding an opponent...";
        this.files = [...DEFAULT_FILES];
        this.ranks = [...DEFAULT_RANKS];
        const response = await axios.get(`${API_BASE_URL}/join`, {
          params: { playerId: this.playerId }
        });
        const data = response.data;
        if (data.success) {
          this.gameId = data.gameId;
          this.turn = data.turn;
          this.assignedColor = data.assignedColor;
          this.moveHistory = [data.fen];
          this.formattedMoveHistory = ["Game started"];
          this.updateDisplayCoordinates();
          let processedBoard = this.processBoardData(data.board);
          if (this.assignedColor === "black") {
            processedBoard = this.rotateMatrix(processedBoard);
          }
          this.boardMatrix = processedBoard;
          this.fallbackChess = null;
          this.gameStatus = data.opponent ? "" : "waiting for opponent to join...";
        } else {
          throw new Error(data.error || "Unknown error from API");
        }
      } catch (error) {
        console.error("ummm error joining game, using fallback local game ;c:", error);
        this.setupLocalGame();
      } finally {
        this.isLoading = false;
      }
    },
    setupLocalGame() {
      const chess = new Chess();
      this.fallbackChess = chess;
      this.gameId = null;
      this.turn = chess.turn();
      this.assignedColor = "white";
      this.moveHistory = [chess.fen()];
      this.formattedMoveHistory = ["Local game started"];
      this.gameStatus = "playing locally (server unavailable)";
      this.updateDisplayCoordinates();
      const fallbackBoard = this.processBoardData(chess.board());
      this.boardMatrix = fallbackBoard;
    },
    updateDisplayCoordinates() {
      if (this.assignedColor === "black") {
        this.displayFiles = [...DEFAULT_FILES].reverse();
        this.displayRanks = [...DEFAULT_RANKS].reverse();
      } else {
        this.displayFiles = [...DEFAULT_FILES];
        this.displayRanks = [...DEFAULT_RANKS];
      }
    },
    async refreshGameState() {
      if (!this.gameId) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/game`, {
          params: { gameId: this.gameId, playerId: this.playerId }
        });
        const data = response.data;
        if (data.success) {
          this.turn = data.turn;
          this.updateGameStatus(data);
          let updatedBoard = this.processBoardData(data.board);
          if (this.assignedColor === "black") {
            updatedBoard = this.rotateMatrix(updatedBoard);
          }
          this.boardMatrix = updatedBoard;
          if (data.fen && !this.moveHistory.includes(data.fen)) {
            this.moveHistory.push(data.fen);
            this.formattedMoveHistory.push(`Move ${this.formattedMoveHistory.length}: ${data.turn === 'w' ? 'Black' : 'White'} moved`);
          }
          if (data.players && (!data.players.white || !data.players.black)) {
            this.gameStatus = "Waiting for opponent to join...";
          } else if (this.gameStatus === "Waiting for opponent to join...") {
            this.gameStatus = "";
          }
        }
      } catch (error) {
        console.error("Ummm there's an error refreshing game state:", error);
      }
    },
    updateGameStatus(data) {
      if (data.isCheckmate) {
        const winner = data.turn === 'w' ? 'Black' : 'White';
        this.gameStatus = `Checkmate! ${winner} wins!`;
      } else if (data.isCheck) {
        const inCheck = data.turn === 'w' ? 'White' : 'Black';
        this.gameStatus = `${inCheck} is in check!`;
      } else if (data.isDraw) {
        this.gameStatus = ";c Game ended in a draw!";
      } else {
        if (this.gameStatus && (this.gameStatus.includes("check") || this.gameStatus.includes("Waiting"))) {
          this.gameStatus = "";
        }
      }
    },
    async makeMove(from, to) {
      if (!from || !to || !from.match(/^[a-h][1-8]$/) || !to.match(/^[a-h][1-8]$/)) {
        console.error('invalid move coordinates:', { from, to });
        alert('invalid move coordinates');
        return false;
      }
      if (!this.isYourTurn()) {
        alert("not your turn..;-;");
        return false;
      }
      this.lastMove = { from, to };
      if (!this.gameId) {
        return this.handleLocalMove(from, to);
      }
      try {
        this.isLoading = true;
        const moveData = {
          gameId: this.gameId,
          playerId: this.playerId,
          from,
          to,
          promotion: 'q'
        };
        console.debug('attempting move:', moveData);
        const response = await axios.post(`${API_BASE_URL}/move`, moveData);
        const data = response.data;
        if (data.success) {
          await this.handleSuccessfulMove(data);
          return true;
        } else {
          throw new Error(data.error || 'move failed wtf');
        }
      } catch (error) {
        this.handleMoveError(error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },
    handleLocalMove(from, to) {
      if (this.fallbackChess) {
        try {
          const move = this.fallbackChess.move({ from, to, promotion: 'q' });
          if (move) {
            this.turn = this.fallbackChess.turn();
            const board = this.fallbackChess.board();
            const processedBoard = this.processBoardData(board);
            this.boardMatrix = processedBoard;
            this.moveHistory.push(this.fallbackChess.fen());
            this.formattedMoveHistory.push(`Move ${this.formattedMoveHistory.length}: ${from} to ${to}`);
            this.updateLocalGameStatus();
            return true;
          }
        } catch (error) {
          console.error('Local move got an error while idk executing:', error);
          alert('Invalid move');
        }
      } else {
        alert('no game available');
      }
      return false;
    },
    updateLocalGameStatus() {
      if (this.fallbackChess.isCheckmate()) {
        const winner = this.fallbackChess.turn() === 'w' ? 'Black' : 'White';
        this.gameStatus = `Checkmate! ${winner} wins!`;
      } else if (this.fallbackChess.isCheck()) {
        const inCheck = this.fallbackChess.turn() === 'w' ? 'White' : 'Black';
        this.gameStatus = `${inCheck} is in check!`;
      } else if (this.fallbackChess.isDraw()) {
        this.gameStatus = "Game ended in a draw!";
      }
    },
    async handleSuccessfulMove(data) {
      this.turn = data.turn;
      if (data.fen && !this.moveHistory.includes(data.fen)) {
        this.moveHistory.push(data.fen);
        const moveNumber = this.formattedMoveHistory.length;
        this.formattedMoveHistory.push(`Move ${moveNumber}: ${this.lastMove.from} to ${this.lastMove.to}`);
      }
      this.updateGameStatus(data);
      let updatedBoard = this.processBoardData(data.board);
      if (this.assignedColor === "black") {
        updatedBoard = this.rotateMatrix(updatedBoard);
      }
      this.boardMatrix = updatedBoard;
    },
    handleMoveError(error) {
      console.error('Move error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      alert(`Move failed: ${errorMessage}`);
    },
    getSquareColor(rankIndex, fileIndex) {
      return (rankIndex + fileIndex) % 2 === 0 ? "square-light" : "square-dark";
    },
    getSquareNotation(rankIndex, fileIndex) {
      let fileIdx = fileIndex;
      let rankIdx = rankIndex;
      if (this.assignedColor === "black") {
        fileIdx = 7 - fileIndex;
        rankIdx = 7 - rankIndex;
      }
      const file = this.files[fileIdx];
      const rank = this.ranks[rankIdx];
      if (!file || !rank) {
        console.error('Invalid indices:', rankIndex, fileIndex);
        return null;
      }
      return file + rank;
    },
    handleSquareClick(rankIndex, fileIndex) {
      const square = this.getSquareNotation(rankIndex, fileIndex);
      if (!square) return;
      if (!this.selectedSquare) {
        const piece = this.boardMatrix[rankIndex][fileIndex];
        const isPieceYours = piece && 
          ((piece.startsWith("w") && this.assignedColor === "white") ||
           (piece.startsWith("b") && this.assignedColor === "black"));
        if (isPieceYours && this.isYourTurn()) {
          this.selectedSquare = square;
          console.debug(`selected piece at ${square}`); // we can later on remove all debug logs but meh who cares?
        }
      } else {
        const from = this.selectedSquare;
        const to = square;
        if (from === to) {
          this.selectedSquare = null;
          return;
        }
        console.debug(`Attempting move from ${from} to ${to}`);
        this.makeMove(from, to);
        this.selectedSquare = null;
      }
    },
    isYourTurn() {
      return (
        (this.turn === "w" && this.assignedColor === "white") ||
        (this.turn === "b" && this.assignedColor === "black")
      );
    },
    //new Game function using /api/newgame endpoint from server.js
    async newGame() {
      if (this.gameId) {
        try {
          this.isLoading = true;
          const response = await axios.post(`${API_BASE_URL}/newgame`, {
            gameId: this.gameId,
            playerId: this.playerId
          });
          const data = response.data;
          if (data.success) {
            this.gameId = data.gameId;
            this.turn = data.turn;
            this.assignedColor = data.assignedColor;
            this.moveHistory = [data.fen];
            this.formattedMoveHistory = ["Game started"];
            this.updateDisplayCoordinates();
            let processedBoard = this.processBoardData(data.board);
            if (this.assignedColor === "black") {
              processedBoard = this.rotateMatrix(processedBoard);
            }
            this.boardMatrix = processedBoard;
            this.gameStatus = "";
            this.toggleOptionsModal(); // close modal after new game
          } else {
            throw new Error(data.error || "New game failed");
          }
        } catch (error) {
          console.error("Error starting new game:", error);
          alert("Failed to start new game: " + error.message);
        } finally {
          this.isLoading = false;
        }
      }
    },
    async resignGame() {
      if (!confirm("Are you sure you want to resign?")) return;
      if (this.gameId) {
        try {
          this.isLoading = true;
          const response = await axios.post(`${API_BASE_URL}/resign`, {
            gameId: this.gameId,
            playerId: this.playerId
          });
          if (response.data.success) {
            this.gameStatus = "You resigned. Game over.";
            clearInterval(this.pollIntervalId);
            this.toggleOptionsModal(); // close modal if open
          } else {
            throw new Error(response.data.error || "Resignation failed");
          }
        } catch (error) {
          console.error("Error resigning:", error);
          alert("Failed to resign: " + error.message);
        } finally {
          this.isLoading = false;
        }
      } else {
        this.gameStatus = "You resigned. Game over (local game).";
        clearInterval(this.pollIntervalId);
      }
    },
    toggleOptionsModal() {
      this.showOptionsModal = !this.showOptionsModal;
    },
    handleImageError(e) {
      this.pieceImagesLoaded = false;
      const img = e.target;
      img.style.display = "none";
      console.error(`Failed to load image`);
    },
    getPieceImage(pieceCode) {
      if (!pieceCode) return "";
      try {
        return require(`@/assets/chesspieces/${pieceCode}.png`);
      } catch (error) {
        console.error(`Failed to load image for ${pieceCode}`, error);
        this.pieceImagesLoaded = false;
        return "";
      }
    },
    getPieceFallback(pieceCode) {
      if (!pieceCode) return "";
      const pieceSymbols = {
        wP: "♙", wN: "♘", wB: "♗", wR: "♖", wQ: "♕", wK: "♔",
        bP: "♟", bN: "♞", bB: "♝", bR: "♜", bQ: "♛", bK: "♚"
      };
      return pieceSymbols[pieceCode] || pieceCode;
    },
    isPartOfLastMove(rankIndex, fileIndex) {
      if (!this.lastMove.from || !this.lastMove.to) return false;
      const squareNotation = this.getSquareNotation(rankIndex, fileIndex);
      return squareNotation === this.lastMove.from || squareNotation === this.lastMove.to;
    }
  }
};
</script>
<!--time to goon-->
<style scoped>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #1e293b;
  color: #0effcb;
  overflow-x: hidden;
  line-height: 1.5;
}

.chess-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  position: relative;
}

.game-header {
  width: 90%;
  max-width: 1200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.header-left,
.header-right {
  display: flex;
  flex-direction: column;
}

.player-info {
  font-size: 1.2rem;
  font-weight: bold;
}

.player-color {
  font-size: 1rem;
  color: #a0aec0;
}

.turn-info {
  font-size: 1.1rem;
}

.your-turn {
  color: #ffff00;
  font-weight: bold;
}

.waiting {
  color: #cbd5e1;
}

.game-status {
  font-size: 1.1rem;
  color: #f56565;
  margin-top: 5px;
}

.board-container {
  width: 90%;
  max-width: 600px;
  position: relative;
  margin-bottom: 30px;
}

.chess-board {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 aspect Ratio is fine ig */
  background-color: #d1b899;
  border: 2px solid #333;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.coordinates {
  position: absolute;
  font-size: 1rem;
  font-weight: bold;
  color: #cbd5e1;
  z-index: 2;
}

.coordinates.files {
  bottom: 5px;
  left: 50px;
  right: 50px;
  display: flex;
  justify-content: space-between;
}

.coordinates.ranks {
  top: 50px;
  bottom: 50px;
  left: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.board {
  position: absolute;
  top: 50px;
  left: 50px;
  right: 50px;
  bottom: 50px;
  display: flex;
  flex-direction: column;
}

.board-row {
  display: flex;
  flex: 1;
}

.square {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
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
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.5);
}

.square:active {
  transform: scale(1.03);
}

.square-selected {
  background-color: rgba(6, 255, 97, 0.8) !important;
  box-shadow: inset 0 0 0 3px #2a9d8f;
}

.square-last-move {
  outline: 2px solid #ffeb3b;
}

.piece-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.piece-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  animation: fadeInPiece 0.5s ease-in-out;
}

@keyframes fadeInPiece {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.piece-fallback {
  font-size: 2rem;
}

.control-panel-button {
  margin-bottom: 20px;
}

.control-panel-button .control-btn {
  background-color: #2ecc71;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 1.2rem;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-panel-button .control-btn:hover {
  background-color: #27ae60;
}

/*modal */
.options-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: #0f172a;
  border: 2px solid #0effcb;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  padding: 20px;
  text-align: center;
  color: #0effcb;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-content h3 {
  margin-bottom: 20px;
  font-size: 1.5rem;
  border-bottom: 1px solid #0effcb;
  padding-bottom: 10px;
}

.modal-buttons {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.modal-btn {
  background-color: #2ecc71;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.modal-btn:hover {
  background-color: #27ae60;
}

.modal-btn svg {
  stroke: #fff;
}

.modal-btn.new-game {
  background-color: #2ecc71;
}

.modal-btn.resign {
  background-color: #e74c3c;
}

.modal-btn.resign:hover {
  background-color: #c0392b;
}

.modal-close {
  background-color: transparent;
  border: none;
  color: #0effcb;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #27ae60;
}

@media screen and (max-width: 768px) {
  .game-header {
    flex-direction: column;
    align-items: center;
    padding: 15px;
  }
  .header-left,
  .header-right {
    align-items: center;
  }
  .coordinates.files,
  .coordinates.ranks {
    font-size: 0.9rem;
  }
  .modal-content {
    width: 95%;
  }
}

@media screen and (max-width: 480px) {
  .game-header {
    padding: 10px;
  }
  .player-info {
    font-size: 1rem;
  }
  .control-panel-button .control-btn {
    font-size: 1rem;
    padding: 8px 16px;
  }
  .modal-content {
    padding: 15px;
  }
  .modal-btn {
    font-size: 0.9rem;
    padding: 8px 12px;
  }
}

.control-panel-button .control-btn:focus,
.modal-btn:focus,
.modal-close:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.7);
}

.square:hover {
  transform: scale(1.07);
}

.square:active {
  transform: scale(1.05);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.options-modal {
  transition: opacity 0.3s ease-in-out;
}

.board-container::-webkit-scrollbar,
.options-modal::-webkit-scrollbar {
  width: 8px;
}

.board-container::-webkit-scrollbar-track,
.options-modal::-webkit-scrollbar-track {
  background: #0f172a;
  border-radius: 4px;
}

.board-container::-webkit-scrollbar-thumb,
.options-modal::-webkit-scrollbar-thumb {
  background: #0effcb;
  border-radius: 4px;
}

.section-divider {
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, #0effcb, #2ecc71);
  margin: 20px 0;
}

.padding-small { padding: 5px; }
.padding-medium { padding: 15px; }
.padding-large { padding: 30px; }
.margin-small { margin: 5px; }
.margin-medium { margin: 15px; }
.margin-large { margin: 30px; }
.flex { display: flex; }
.flex-column { flex-direction: column; }
.flex-row { flex-direction: row; }
.justify-center { justify-content: center; }
.align-center { align-items: center; }
.space-around { justify-content: space-around; }
.space-between { justify-content: space-between; }

h1, h2, h3, h4, h5, h6 { color: #0effcb; margin-bottom: 10px; }
p { color: #cbd5e1; margin-bottom: 10px; }

a { color: #0effcb; text-decoration: none; transition: color 0.3s; }
a:hover { color: #2ecc71; }

input[type="text"],
input[type="email"],
input[type="password"],
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #0effcb;
  border-radius: 4px;
  background-color: #0f172a;
  color: #0effcb;
  margin-bottom: 10px;
  transition: border-color 0.3s;
}
input:focus, textarea:focus {
  border-color: #2ecc71;
}

/*simple button stlyingggggggggggggggg */
button {
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.status-success { color: #2ecc71; }
.status-error { color: #e74c3c; }
.status-warning { color: #f1c40f; }

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #0effcb;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: auto;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media screen and (min-width: 1600px) {
  .chess-container { padding: 40px; }
  .game-header { max-width: 1400px; padding: 20px 40px; }
  .board-container { max-width: 800px; }
}

.no-flexbox .chess-container { display: block; }
.no-flexbox .game-header, .no-flexbox .board-container { width: 100%; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.5s; }
.modal-enter, .modal-leave-to { opacity: 0; }

/* Spacing1 */
.extra-spacing { margin: 50px 0; }

.debug {
  font-size: 0.8rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: #f1c40f;
  padding: 5px;
  border-radius: 4px;
  margin-top: 10px;
}
/* adding these for no serious reason */
.filler-1  { color: #0effcb; }
.filler-2  { background-color: #0f172a; }
.filler-3  { border: 1px solid #2ecc71; }
.filler-4  { margin: 10px; padding: 10px; }
.filler-5  { font-size: 1.1rem; }
.filler-6  { text-align: center; }
.filler-7  { display: inline-block; width: 100%; }
.filler-8  { height: 20px; }
.filler-9  { margin-bottom: 20px; }
.filler-10 { margin-top: 20px; }
.filler-11 { padding: 5px; }
.filler-12 { padding: 15px; }
.filler-13 { background: linear-gradient(45deg, #0effcb, #2ecc71); }
.filler-14 { border-radius: 8px; }
.filler-15 { box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.filler-16 { opacity: 0.9; }
.filler-17 { transform: scale(1); }
.filler-18 { transition: all 0.3s; }
.filler-19 { animation: spin 1s linear infinite; }
.filler-20 { border: 2px dashed #0effcb; }
.filler-21 { background-color: #1e293b; }
.filler-22 { color: #a0aec0; }
.filler-23 { margin: 15px 0; }
.filler-24 { padding: 15px; }
.filler-25 { border: 1px dotted #0effcb; }
.filler-26 { font-weight: bold; }
.filler-27 { font-style: italic; }
.filler-28 { text-transform: uppercase; }
.filler-29 { text-transform: lowercase; }
.filler-30 { letter-spacing: 1px; }
.filler-31 { line-height: 1.6; }
.filler-32 { word-spacing: 2px; }
.filler-33 { text-shadow: 1px 1px 2px #0effcb; }
.filler-34 { background: #0f172a; }
.filler-35 { padding: 20px; }
.filler-36 { margin: 20px; }
.filler-37 { border: 2px solid #2ecc71; }
.filler-38 { border-radius: 12px; }
.filler-39 { box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4); }
.filler-40 { opacity: 0.85; }
.filler-41 { transform: rotate(5deg); }
.filler-42 { transform: rotate(-5deg); }
.filler-43 { transition: transform 0.5s; }
.filler-44 { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'); }
.filler-45 { background-repeat: repeat; }
.filler-46 { border-bottom: 2px solid #0effcb; }
.filler-47 { border-top: 2px solid #0effcb; }
.filler-48 { border-left: 2px solid #0effcb; }
.filler-49 { border-right: 2px solid #0effcb; }
.filler-50 { padding: 25px; }
.filler-51 { margin: 5px 10px; }
.filler-52 { padding: 5px 10px; }
.filler-53 { color: #0effcb; }
.filler-54 { background-color: #0f172a; }
.filler-55 { border: 1px solid #2ecc71; }
.filler-56 { margin: 10px 5px; }
.filler-57 { padding: 10px 5px; }
.filler-58 { font-size: 1rem; }
.filler-59 { text-align: left; }
.filler-60 { display: flex; }
.filler-61 { flex-direction: row; }
.filler-62 { flex-direction: column; }
.filler-63 { justify-content: center; }
.filler-64 { align-items: center; }
.filler-65 { gap: 10px; }
.filler-66 { margin: 5px; }
.filler-67 { padding: 5px; }
.filler-68 { border: 1px solid #0effcb; }
.filler-69 { border-radius: 4px; }
.filler-70 { box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
.filler-71 { opacity: 0.7; }
.filler-72 { transition: background-color 0.3s; }
.filler-73 { background-color: #0f172a; }
.filler-74 { color: #0effcb; }
.filler-75 { padding: 10px; }
.filler-76 { margin: 10px; }
.filler-77 { border: 2px solid #0effcb; }
.filler-78 { border-radius: 8px; }
.filler-79 { box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
.filler-80 { opacity: 0.9; }
.filler-81 { transform: scale(1); }
.filler-82 { transition: all 0.3s; }
.filler-83 { animation: spin 1s linear infinite; }
.filler-84 { border: 2px dashed #0effcb; }
.filler-85 { background-color: #1e293b; }
.filler-86 { color: #a0aec0; }
.filler-87 { margin: 15px 0; }
.filler-88 { padding: 15px; }
.filler-89 { border: 1px dotted #0effcb; }
.filler-90 { font-weight: bold; }
.filler-91 { font-style: italic; }
.filler-92 { text-transform: uppercase; }
.filler-93 { text-transform: lowercase; }
.filler-94 { letter-spacing: 1px; }
.filler-95 { line-height: 1.6; }
.filler-96 { word-spacing: 2px; }
.filler-97 { text-shadow: 1px 1px 2px #0effcb; }
.filler-98 { background: #0f172a; }
.filler-99 { padding: 20px; }
.filler-100 { margin: 20px; }
.filler-101 { background-color: #0f172a; }
.filler-102 { background-color: #1e293b; }
.filler-103 { border: 1px solid #0effcb; }
.filler-104 { padding: 8px; margin: 8px; }
.filler-105 { font-size: 1rem; }
.filler-106 { color: #0effcb; }
.filler-107 { background-color: #0f172a; }
.filler-108 { border-radius: 4px; }
.filler-109 { box-shadow: 0 2px 4px rgba(0,0,0,0.25); }
.filler-110 { opacity: 0.8; }
.filler-111 { transform: scale(1); }
.filler-112 { transition: all 0.3s; }
.filler-113 { margin: 10px; }
.filler-114 { padding: 10px; }
.filler-115 { border: 2px solid #2ecc71; }
.filler-116 { background: linear-gradient(45deg, #0effcb, #2ecc71); }
.filler-117 { text-align: center; }
.filler-118 { display: inline-block; }
.filler-119 { width: 100%; }
.filler-120 { height: 20px; }
.filler-800 { margin: 20px; padding: 20px; border: 2px dashed #0effcb; }
/*          
               8===========>
FINALLYYYYYYYY ;)*/
</style>