<template>
    <div class="chess-container">
      <!-- Header -->
      <div class="game-header">
        <div class="header-left">
          <div class="player-info">Player: {{ playerName }}</div>
          <div class="player-color">You are: {{ assignedColor }}</div>
        </div>
        <div class="header-right">
          <div class="session-info">Session: {{ sessionId.substring(0, 8) }}...</div>
          <div class="turn-info">
            Turn: 
            <span v-if="isYourTurn()" class="your-turn">Your move!</span>
            <span v-else class="waiting">Waiting for opponent...</span>
          </div>
        </div>
      </div>
  
      <div class="debug-info" v-if="showDebug">
        <h3>Debug Info</h3>
        <div>Image Path Test: 
          <img :src="testImagePath" class="debug-img" alt="Test Image" />
        </div>
        <!-- Show the board matrix in debug, useless honestly -->
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
                <!-- Use fallback display method with both image and text -->
                <div v-if="square" class="piece-container">
                  <img
                    :src="getPieceImage(square)"
                    :alt="square"
                    class="piece-image"
                    @error="handleImageError"
                  />
                  <div class="piece-fallback">{{ getPieceSymbol(square) }}</div>
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
  
  // Generate unique session/player
  const generateSessionId = () => "session-" + Math.random().toString(36).substr(2, 9);
  const generatePlayerName = () => {
    const adjectives = ['Clever', 'Swift', 'Tactical', 'Strategic', 'Bold', 'Sneaky', 'Patient'];
    const pieces = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];
    return (
      adjectives[Math.floor(Math.random() * adjectives.length)] +
      pieces[Math.floor(Math.random() * pieces.length)] +
      Math.floor(Math.random() * 1000)
    );
  };
  
  // API base
  const API_BASE_URL = "https://cuddly-rotary-phone-q744jwxwpw9qfxvjx-8081.app.github.dev/api";
  
  // Symbol mapping for fallback
  const pieceSymbols = {
    'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
    'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚',
  };
  
  // Utility: chunk a flat array into an 8×8 matrix
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
        // Session info
        sessionId: "",
        playerName: "",
        turn: "",
        // Polling
        pollIntervalId: null,
        // Debug
        showDebug: false,
        imageLoadFailures: {},
        // For quick testing
        testImagePath: "/src/assets/chesspieces/wP.png"
      };
    },
    created() {
      // Grab from localStorage or generate
      const storedSession = localStorage.getItem("chessSessionId");
      const storedPlayer = localStorage.getItem("chessPlayerName");
      this.sessionId = storedSession || generateSessionId();
      this.playerName = storedPlayer || generatePlayerName();
      if (!storedSession) localStorage.setItem("chessSessionId", this.sessionId);
      if (!storedPlayer) localStorage.setItem("chessPlayerName", this.playerName);
      
      console.log("Chess component created");
      // Join a game
      this.joinGame();
    },
    mounted() {
      console.log("Chess component mounted");
      // Poll for updates if it's the opponent's turn
      this.pollIntervalId = setInterval(() => {
        if (this.gameId && !this.isYourTurn()) {
          this.refreshGameState();
        }
      }, 2000);
    },
    beforeDestroy() {
      // Stop polling
      if (this.pollIntervalId) {
        clearInterval(this.pollIntervalId);
      }
    },
    methods: {
      /* 
        1) Fallback symbol (Unicode).
        2) The getPieceImage method uses require to bundle images.
      */
      getPieceSymbol(pieceCode) {
        return pieceSymbols[pieceCode] || '';
      },
      getPieceImage(pieceCode) {
        if (!pieceCode) return '';
        console.log("Requesting image for:", pieceCode);
        try {
          // Must match your actual file names in /assets/chesspieces
          return require(`@/assets/chesspieces/${pieceCode}.png`);
        } catch (error) {
          console.error(`Failed to load image for ${pieceCode}`, error);
          return '';
        }
      },
      handleImageError(e) {
        const img = e.target;
        const src = img.getAttribute('src');
        this.imageLoadFailures[src] = true;
        img.style.display = 'none';
        console.error(`Failed to load image: ${src}`);
      },
      
      toggleDebug() {
        this.showDebug = !this.showDebug;
      },
  
      // If boardData is flat, chunk it. Then map each square to wP, bK, etc.
      processBoardData(boardData) {
        let board = boardData;
        if (boardData.length && !Array.isArray(boardData[0])) {
          board = chunkArray(boardData, 8);
        }
        return board.map(row =>
          row.map(square => {
            if (!square) return null;
            // Example: color=w => 'w'; type='p' => 'P' => "wP"
            return (square.color === "w" ? "w" : "b") + square.type.toUpperCase();
          })
        );
      },
  
      // Joins or creates a game
      async joinGame() {
        try {
          this.isLoading = true;
          console.log("Joining game...");
          const response = await axios.get(`${API_BASE_URL}/join`, {
            params: { playerId: this.sessionId }
          });
          console.log("Join response:", response.data);
          const data = response.data;
          if (data.success) {
            this.gameId = data.gameId;
            this.turn = data.turn;
            this.assignedColor = data.assignedColor;
            this.moveHistory.push(data.fen);
            
            // Build our board matrix
            if (data.board) {
              console.log("Processing board data");
              this.boardMatrix = this.processBoardData(data.board);
              console.log("Board matrix created:", this.boardMatrix);
            }
          }
        } catch (error) {
          console.error("Error joining game:", error);
        } finally {
          this.isLoading = false;
        }
      },
  
      // Refresh the current game state from the server
      async refreshGameState() {
        try {
          const response = await axios.get(`${API_BASE_URL}/game`, {
            params: { gameId: this.gameId, playerId: this.sessionId }
          });
          const data = response.data;
          if (data.success) {
            this.turn = data.turn;
            if (data.board) {
              this.boardMatrix = this.processBoardData(data.board);
            }
            if (data.fen && !this.moveHistory.includes(data.fen)) {
              this.moveHistory.push(data.fen);
            }
          }
        } catch (error) {
          console.error("Error refreshing game state:", error);
        }
      },
  
      // Determine the square's color (light/dark)
      getSquareColor(rankIndex, fileIndex) {
        return (rankIndex + fileIndex) % 2 === 0 ? "square-light" : "square-dark";
      },
  
      // Get algebraic notation for the square
      getSquareNotation(rankIndex, fileIndex) {
        return `${this.files[fileIndex]}${this.ranks[rankIndex]}`;
      },
  
      // Clicking a square: either select your piece or make a move ;3
      handleSquareClick(rankIndex, fileIndex) {
        const square = this.getSquareNotation(rankIndex, fileIndex);
        if (!this.selectedSquare) {
          const piece = this.boardMatrix[rankIndex][fileIndex];
          if (
            piece &&
            ((piece.startsWith('w') && this.assignedColor === "white") ||
             (piece.startsWith('b') && this.assignedColor === "black")) &&
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
  
      // Check if it's our turn
      isYourTurn() {
        return (
          (this.turn === "w" && this.assignedColor === "white") ||
          (this.turn === "b" && this.assignedColor === "black")
        );
      },
  
      // Make a move on the server
      async makeMove(from, to) {
        if (!this.isYourTurn()) {
          alert("Not your turn!");
          return;
        }
        try {
          this.isLoading = true;
          const response = await axios.post(`${API_BASE_URL}/move`, {
            gameId: this.gameId,
            playerId: this.sessionId,
            from,
            to,
            promotion: "q"
          });
          const data = response.data;
          if (data.success) {
            this.turn = data.turn;
            if (data.board) {
              this.boardMatrix = this.processBoardData(data.board);
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
  
      // Reset the game by re-joining
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
