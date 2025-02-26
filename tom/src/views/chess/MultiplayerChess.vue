<template>
  <div class="chess-container">
    <!-- Header -->
    <div class="game-header">
      <div class="header-left">
        <div class="player-info">Player: {{ playerName }}</div>
        <div class="player-color">You are: {{ assignedColor }}</div>
      </div>
      <div class="header-right">
        <!-- Removed session info since we don't use sessions now -->
        <div class="turn-info">
          Turn:
          <span v-if="isYourTurn()" class="your-turn">Your move!</span>
          <span v-else class="waiting">Waiting for opponent...</span>
        </div>
      </div>
    </div>

    <div class="debug-info" v-if="showDebug">
      <h3>Debug Info</h3>
      <div>
        Image Path Test:
        <img :src="testImagePath" class="debug-img" alt="Test Image" />
      </div>
      <pre>{{ JSON.stringify(boardMatrix, null, 2) }}</pre>
    </div>

    <!-- Board -->
    <div class="board-container">
      <div class="chess-board">
        <div class="coordinates files">
          <span v-for="file in files" :key="file">{{ file }}</span>
        </div>
        <div class="coordinates ranks">
          <span v-for="rank in ranks" :key="rank">{{ rank }}</span>
        </div>
        <div class="board">
          <div
            v-for="(row, rankIndex) in boardMatrix"
            :key="rankIndex"
            class="board-row"
          >
            <div
              v-for="(square, fileIndex) in row"
              :key="`${rankIndex}-${fileIndex}`"
              :class="[
                'square',
                getSquareColor(rankIndex, fileIndex),
                { 'square-selected': selectedSquare === getSquareNotation(rankIndex, fileIndex) }
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="game-controls">
      <button class="control-btn" @click="resetGame" :disabled="isLoading">
        {{ isLoading ? 'Loading...' : 'Reset Game' }}
      </button>
      <button class="control-btn" @click="toggleDebug">
        {{ showDebug ? 'Hide Debug' : 'Show Debug' }}
      </button>
    </div>

    <!-- Move History -->
    <div class="move-history" v-if="moveHistory.length">
      <h3>Move History (FENs)</h3>
      <ul>
        <li v-for="(fen, index) in moveHistory" :key="index">
          Move {{ index + 1 }}: {{ fen }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { Chess } from "chess.js";

// Generate a random player name
const generatePlayerName = () => {
  const adjectives = [
    "Clever",
    "Swift",
    "Tactical",
    "Strategic",
    "Bold",
    "Sneaky",
    "Patient"
  ];
  const pieces = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    pieces[Math.floor(Math.random() * pieces.length)] +
    Math.floor(Math.random() * 1000)
  );
};

// API base URL; update as necessary.
const API_BASE_URL =
  "https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-8081.app.github.dev/api";

// Utility: If board data is flat, convert it to an 8x8 matrix.
function chunkArray(array, chunkSize) {
  const results = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

export default {
  name: "MultiplayerChess",
  data() {
    return {
      files: ["a", "b", "c", "d", "e", "f", "g", "h"],
      ranks: ["8", "7", "6", "5", "4", "3", "2", "1"],
      boardMatrix: Array(8).fill().map(() => Array(8).fill(null)),
      gameId: null,
      assignedColor: "", // "white" or "black"
      moveHistory: [],
      selectedSquare: null,
      isLoading: false,
      // Removed sessionId since we're not using sessions
      playerName: "",
      turn: "",
      pollIntervalId: null,
      showDebug: false,
      imageLoadFailures: {},
      // Test image path for debugging piece images (update if necessary)
      testImagePath: "/workspaces/site/tom/src/assets/chesspieces/wP.png"
    };
  },
  created() {
    // Retrieve player name from localStorage or generate new.
    const storedPlayer = localStorage.getItem("chessPlayerName");
    this.playerName = storedPlayer || generatePlayerName();
    if (!storedPlayer) localStorage.setItem("chessPlayerName", this.playerName);

    console.log("Chess component created");
    this.joinGame();
  },
  mounted() {
    console.log("Chess component mounted");
    // Poll game state every 2 seconds if it's not our turn.
    this.pollIntervalId = setInterval(() => {
      if (this.gameId && !this.isYourTurn()) {
        this.refreshGameState();
      }
    }, 2000);
  },
  beforeUnmount() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
  },
  methods: {
    // Load piece image using require; fallback to empty string if not found.
    getPieceImage(pieceCode) {
      if (!pieceCode) return "";
      try {
        return require(`@/assets/chesspieces/${pieceCode}.png`);
      } catch (error) {
        console.error(`Failed to load image for ${pieceCode}`, error);
        return "";
      }
    },
    handleImageError(e) {
      const img = e.target;
      const src = img.getAttribute("src");
      this.imageLoadFailures[src] = true;
      img.style.display = "none";
      console.error(`Failed to load image: ${src}`);
    },
    toggleDebug() {
      this.showDebug = !this.showDebug;
    },
    // Process board data into 8x8 matrix of piece codes (e.g., "wP", "bK")
    processBoardData(boardData) {
      let board = boardData;
      if (boardData.length && !Array.isArray(boardData[0])) {
        board = chunkArray(boardData, 8);
      }
      return board.map(row =>
        row.map(square =>
          square ? (square.color === "w" ? "w" : "b") + square.type.toUpperCase() : null
        )
      );
    },
    // Rotate a board matrix by 180° for black's perspective.
    rotateMatrix(matrix) {
      return matrix.slice().reverse().map(row => row.slice().reverse());
    },
    // Join or create a game via the backend API.
    async joinGame() {
      try {
        this.isLoading = true;
        console.log("Joining game...");
        // Use only playerName as identifier
        const response = await axios.get(`${API_BASE_URL}/join`, {
          params: { playerName: this.playerName }
        });
        console.log("Join response:", response.data);
        const data = response.data;
        if (data.success) {
          this.gameId = data.gameId;
          this.turn = data.turn;
          this.assignedColor = data.assignedColor;
          this.moveHistory = [data.fen];
          let processedBoard = this.processBoardData(data.board);
          if (this.assignedColor === "black") {
            processedBoard = this.rotateMatrix(processedBoard);
          }
          this.boardMatrix = processedBoard;
        } else {
          throw new Error(data.error || "Unknown error from API");
        }
      } catch (error) {
        console.error("Error joining game, using fallback board:", error);
        // Fallback: Use chess.js to set up a standard board.
        const chess = new Chess();
        this.gameId = null;
        this.turn = chess.turn();
        this.assignedColor = "white";  // Default fallback color.
        this.moveHistory = [chess.fen()];
        let fallbackBoard = this.processBoardData(chess.board());
        if (this.assignedColor === "black") {
          fallbackBoard = this.rotateMatrix(fallbackBoard);
        }
        this.boardMatrix = fallbackBoard;
      } finally {
        this.isLoading = false;
      }
    },
    // Refresh current game state using the backend API.
    async refreshGameState() {
      try {
        const response = await axios.get(`${API_BASE_URL}/game`, {
          params: { gameId: this.gameId, playerName: this.playerName }
        });
        const data = response.data;
        if (data.success) {
          this.turn = data.turn;
          if (data.board) {
            let updatedBoard = this.processBoardData(data.board);
            if (this.assignedColor === "black") {
              updatedBoard = this.rotateMatrix(updatedBoard);
            }
            this.boardMatrix = updatedBoard;
          }
          if (data.fen && !this.moveHistory.includes(data.fen)) {
            this.moveHistory.push(data.fen);
          }
        }
      } catch (error) {
        console.error("Error refreshing game state:", error);
      }
    },
    // Determine square color based on its position.
    getSquareColor(rankIndex, fileIndex) {
      return (rankIndex + fileIndex) % 2 === 0 ? "square-light" : "square-dark";
    },
    // Translate board coordinates into algebraic notation.
    getSquareNotation(rankIndex, fileIndex) {
      return `${this.files[fileIndex]}${this.ranks[rankIndex]}`;
    },
    // Handle click event on board square.
    handleSquareClick(rankIndex, fileIndex) {
      const square = this.getSquareNotation(rankIndex, fileIndex);
      if (!this.selectedSquare) {
        const piece = this.boardMatrix[rankIndex][fileIndex];
        if (
          piece &&
          ((piece.startsWith("w") && this.assignedColor === "white") ||
           (piece.startsWith("b") && this.assignedColor === "black")) &&
          this.isYourTurn()
        ) {
          this.selectedSquare = square;
        }
      } else {
        const from = this.selectedSquare;
        const to = square;
        this.makeMove(from, to);
        this.selectedSquare = null;
      }
    },
    // Determine if it is the current player's turn.
    isYourTurn() {
      return (
        (this.turn === "w" && this.assignedColor === "white") ||
        (this.turn === "b" && this.assignedColor === "black")
      );
    },
    // Send a move to the backend API.
    async makeMove(from, to) {
      if (!this.isYourTurn()) {
        alert("Not your turn!");
        return;
      }
      try {
        this.isLoading = true;
        const response = await axios.post(`${API_BASE_URL}/move`, {
          gameId: this.gameId,
          playerName: this.playerName,
          from,
          to,
          promotion: "q"  // Default promotion.
        });
        const data = response.data;
        if (data.success) {
          this.turn = data.turn;
          if (data.board) {
            let updatedBoard = this.processBoardData(data.board);
            if (this.assignedColor === "black") {
              updatedBoard = this.rotateMatrix(updatedBoard);
            }
            this.boardMatrix = updatedBoard;
          }
          this.moveHistory.push(data.fen);
        } else {
          alert(data.error || "Move failed");
        }
      } catch (error) {
        console.error("Error making move:", error);
        alert("Move failed: " + (error.response?.data?.error || error.message));
      } finally {
        this.isLoading = false;
      }
    },
    // Reset the game by rejoining.
    async resetGame() {
      this.selectedSquare = null;
      this.moveHistory = [];
      await this.joinGame();
    }
  }
};
</script>


  
  <style scoped>
  /* Container */
  .chess-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100vh; 
    width: 100%;
    background: linear-gradient(to bottom right, #1e293b, #0f172a);
    color: #0effcb;
    position: relative;
    overflow-y: auto;
    padding: 20px 0;
  }
  
  /* Debug Info */
  .debug-info {
    width: 90%;
    max-width: 700px;
    margin: 10px auto;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #ffffff;
    font-family: monospace;
    font-size: 12px;
    overflow-x: auto;
  }
  .debug-img {
    max-width: 50px;
    max-height: 50px;
    background-color: #fff;
    margin: 5px;
  }
  
  /* Header */
  .game-header {
    display: flex;
    justify-content: space-between;
    width: 90%;
    max-width: 700px;
    padding: 15px 30px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    font-size: 18px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    margin: 0 auto 30px;
  }
  .header-left,
  .header-right {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .your-turn {
    color: yellow;
    font-weight: bold;
  }
  .waiting {
    color: #888;
  }
  
  /* Board Container */
  .board-container {
    position: relative;
    width: 90%;
    max-width: 600px;
    aspect-ratio: 1/1;
    margin: 0 auto;
  }
  
  /* Chess Board Outer Container */
  .chess-board {
    width: 100%;
    height: 100%;
    position: relative;
    background: #d1b899;
    border: 2px solid #333;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }
  
  /* Coordinates */
  .coordinates {
    position: absolute;
    font-size: 14px;
    font-weight: bold;
    color: #cbd5e1;
    z-index: 3;
  }
  .coordinates.files {
    bottom: 5px;
    left: 30px;
    right: 30px;
    display: flex;
    justify-content: space-between;
  }
  .coordinates.ranks {
    top: 30px;
    bottom: 30px;
    left: 5px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  /* Board Grid (Inner Board) */
  .board {
    position: absolute;
    top: 30px;
    left: 30px;
    width: calc(100% - 60px);
    height: calc(100% - 60px);
    display: flex;
    flex-direction: column;
  }
  .board-row {
    display: flex;
    width: 100%;
    height: 12.5%;
  }
  .square {
    width: 12.5%;
    height: 100%;
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
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
    background-color: rgba(6, 255, 97, 0.8) !important;
    box-shadow: inset 0 0 0 3px #2a9d8f;
  }
  
  /* Piece Container */
  .piece-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Piece Images */
  .piece-image {
    width: 85%;
    height: 85%;
    object-fit: contain;
  }
  
  /* Fallback (Unicode) */
  .piece-fallback {
    position: absolute;
    font-size: 2.5vw;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
  @media (min-width: 700px) {
    .piece-fallback {
      font-size: 32px;
    }
  }
  
  /* Game Controls */
  .game-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
    width: 90%;
    max-width: 700px;
  }
  .control-btn {
    padding: 10px 28px;
    border-radius: 12px;
    background: linear-gradient(to right, #babec9, #111211);
    color: #ffffff;
    font-size: 15px;
    font-weight: bold;
    border: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease-in-out;
    cursor: pointer;
  }
  .control-btn:hover:not(:disabled) {
    background: linear-gradient(to right, #2563eb, #1d4ed8);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }
  .control-btn:disabled {
    background: #4b5563;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  /* Move History */
  .move-history {
    width: 90%;
    max-width: 700px;
    margin: 20px auto;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    color: #ffffff;
    max-height: 300px;
    overflow-y: auto;
  }
  .move-history ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .move-history li {
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Responsive */
  @media screen and (max-width: 768px) {
    .game-header {
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .header-right {
      text-align: center;
    }
    .game-controls {
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
  }
  @media screen and (max-width: 480px) {
    .coordinates {
      font-size: 10px;
    }
    .control-btn {
      font-size: 14px;
      padding: 8px 16px;
    }
  }
    /* not yet done */
  </style>
