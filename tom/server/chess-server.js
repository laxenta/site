const { Chess } = require('chess.js');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

// Define piece unicode representations
const PIECE_UNICODE = {
    'w': {
        'k': '♔', // White King : 3
        'q': '♕', // White Queen
        'r': '♖', // White Rook
        'b': '♗', // White Bishop
        'n': '♘', // White Knight
        'p': '♙'  // White Pawn
    },
    'b': {
        'k': '♚', // Black King
        'q': '♛', // Black Queen
        'r': '♜', // Black Rook
        'b': '♝', // Black Bishop
        'n': '♞', // Black Knight
        'p': '♟'  // Big black mommy
    }
};

// Define piece values for evaluation
const PIECE_VALUES = {
    'p': 1,
    'n': 3,
    'b': 3,
    'r': 5,
    'q': 9,
    'k': 0 // King value is 0, as it's not captured
};

// Define piece types for convenience
const PIECE_TYPES = {
    'k': 'king',
    'q': 'queen',
    'r': 'rook',
    'b': 'bishop',
    'n': 'knight',
    'p': 'pawn'
};

// Define piece colors for convenience
const PIECE_COLORS = {
    'w': 'white',
    'b': 'black'
};

// Define initial chess board setup
const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Function to create a new chess board
const createBoard = () => {
    // Create a 2D array to represent the chess board
    const board = [];
    for (let row = 0; row < 8; row++) {
        board[row] = [];
        for (let col = 0; col < 8; col++) {
            board[row][col] = null;
        }
    }
    // Place pieces on the initial board
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = INITIAL_BOARD[row][col];
            if (piece) {
                board[row][col] = {
                    type: piece.toLowerCase(),
                    color: piece.toUpperCase() === piece ? 'w' : 'b'
                };
            }
        }
    }
    return board;
};

// Function to get the unicode representation of a piece
const getUnicodePiece = (piece) => {
    if (!piece) {
        return ' ';
    }
    return PIECE_UNICODE[piece.color][piece.type];
};

// Function to get the unicode representation of a board
const getUnicodeBoard = (board) => {
    return board.map(row => {
        return row.map(piece => {
            return getUnicodePiece(piece);
        });
    });
};

// Function to get the algebraic notation of a square
const getAlgebraicNotation = (row, col) => {
    return String.fromCharCode(97 + col) + (8 - row);
};

// Function to get the row and column of a square from algebraic notation
const getSquareFromAlgebraicNotation = (notation) => {
    const col = notation.charCodeAt(0) - 97;
    const row = 8 - parseInt(notation[1]);
    return { row, col };
};

// Function to get the piece at a given square
const getPieceAtSquare = (board, row, col) => {
    return board[row][col];
};

// Function to get the piece at a given square from algebraic notation
const getPieceAtSquareFromNotation = (board, notation) => {
    const { row, col } = getSquareFromAlgebraicNotation(notation);
    return board[row][col];
};

// Function to move a piece on the board
const movePiece = (board, from, to) => {
    const { row: fromRow, col: fromCol } = getSquareFromAlgebraicNotation(from);
    const { row: toRow, col: toCol } = getSquareFromAlgebraicNotation(to);
    // Move the piece
    board[toRow][toCol] = board[fromRow][fromCol];
    // Remove the piece from the original square
    board[fromRow][fromCol] = null;
};

// Function to check if a move is valid
const isValidMove = (board, from, to) => {
    // Get the piece to move
    const piece = getPieceAtSquareFromNotation(board, from);
    // Get the destination square
    const destinationSquare = getPieceAtSquareFromNotation(board, to);
    // If there is no piece to move, the move is invalid
    if (!piece) {
        return false;
    }
    // If the destination square is occupied by a piece of the same color, the move is invalid
    if (destinationSquare && destinationSquare.color === piece.color) {
        return false;
    }
    // Check if the move is valid for the piece type
    switch (piece.type) {
        case 'pawn':
            // Pawns can only move forward
            if (toRow < fromRow) {
                return false;
            }
            // Pawns can only move one square forward, unless they are on their starting rank
            if (Math.abs(toRow - fromRow) > 1 && fromRow !== 6 && fromRow !== 1) {
                return false;
            }
            // Pawns can only move one square diagonally forward if the destination square is occupied by an opponent's piece
            if (Math.abs(toCol - fromCol) === 1 && toRow !== fromRow + 1) {
                return false;
            }
            // Pawns cannot move diagonally forward if the destination square is empty
            if (Math.abs(toCol - fromCol) === 1 && !destinationSquare) {
                return false;
            }
            break;
        case 'rook':
            // Rooks can only move horizontally or vertically
            if (toRow !== fromRow && toCol !== fromCol) {
                return false;
            }
            // Check for obstacles
            if (toRow === fromRow) {
                // Check for obstacles in the row
                for (let i = Math.min(fromCol, toCol) + 1; i < Math.max(fromCol, toCol); i++) {
                    if (getPieceAtSquare(board, fromRow, i)) {
                        return false;
                    }
                }
            } else {
                // Check for obstacles in the column
                for (let i = Math.min(fromRow, toRow) + 1; i < Math.max(fromRow, toRow); i++) {
                    if (getPieceAtSquare(board, i, fromCol)) {
                        return false;
                    }
                }
            }
            break;
        case 'bishop':
            // Bishops can only move diagonally
            if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) {
                return false;
            }
            // Check for obstacles
            if (toRow > fromRow && toCol > fromCol) {
                // Check for obstacles in the upper-right diagonal
                for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                    if (getPieceAtSquare(board, fromRow + i, fromCol + i)) {
                        return false;
                    }
                }
            } else if (toRow < fromRow && toCol > fromCol) {
                // Check for obstacles in the upper-left diagonal
                for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                    if (getPieceAtSquare(board, fromRow - i, fromCol + i)) {
                        return false;
                    }
                }
            } else if (toRow > fromRow && toCol < fromCol) {
                // Check for obstacles in the lower-right diagonal
                for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                    if (getPieceAtSquare(board, fromRow + i, fromCol - i)) {
                        return false;
                    }
                }
            } else if (toRow < fromRow && toCol < fromCol) {
                // Check for obstacles in the lower-left diagonal
                for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                    if (getPieceAtSquare(board, fromRow - i, fromCol - i)) {
                        return false;
                    }
                }
            }
            break;
        case 'knight':
            // Knights can move two squares in one direction and one square in a perpendicular direction
            if (!((Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 1) || (Math.abs(toRow - fromRow) === 1 && Math.abs(toCol - fromCol) === 2))) {
                return false;
            }
            break;
        case 'queen':
            // Queens can move horizontally, vertically, or diagonally
            if (toRow === fromRow || toCol === fromCol || Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) {
                // Check for obstacles
                if (toRow === fromRow) {
                    // Check for obstacles in the row
                    for (let i = Math.min(fromCol, toCol) + 1; i < Math.max(fromCol, toCol); i++) {
                        if (getPieceAtSquare(board, fromRow, i)) {
                            return false;
                        }
                    }
                } else if (toCol === fromCol) {
                    // Check for obstacles in the column
                    for (let i = Math.min(fromRow, toRow) + 1; i < Math.max(fromRow, toRow); i++) {
                        if (getPieceAtSquare(board, i, fromCol)) {
                            return false;
                        }
                    }
                } else {
                    // Check for obstacles in the diagonals
                    if (toRow > fromRow && toCol > fromCol) {
                        // Check for obstacles in the upper-right diagonal
                        for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                            if (getPieceAtSquare(board, fromRow + i, fromCol + i)) {
                                return false;
                            }
                        }
                    } else if (toRow < fromRow && toCol > fromCol) {
                        // Check for obstacles in the upper-left diagonal
                        for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                            if (getPieceAtSquare(board, fromRow - i, fromCol + i)) {
                                return false;
                            }
                        }
                    } else if (toRow > fromRow && toCol < fromCol) {
                        // Check for obstacles in the lower-right diagonal
                        for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                            if (getPieceAtSquare(board, fromRow + i, fromCol - i)) {
                                return false;
                            }
                        }
                    } else if (toRow < fromRow && toCol < fromCol) {
                        // Check for obstacles in the lower-left diagonal
                        for (let i = 1; i < Math.abs(toRow - fromRow); i++) {
                            if (getPieceAtSquare(board, fromRow - i, fromCol - i)) {
                                return false;
                            }
                        }
                    }
                }
            } else {
                return false;
            }
            break;
        case 'king':
            // Kings can move one square in any direction
            if (Math.abs(toRow - fromRow) > 1 || Math.abs(toCol - fromCol) > 1) {
                return false;
            }
            break;
    }
    // If the move is valid for the piece type, return true
    return true;
};

// Function to check if a square is under attack
const isSquareUnderAttack = (board, row, col, color) => {
    // Loop through all squares on the board
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Get the piece at the current square
            const piece = board[i][j];
            // If the piece is of the opposite color
            if (piece && piece.color !== color) {
                // Check if the piece can attack the given square
                if (isValidMove(board, getAlgebraicNotation(i, j), getAlgebraicNotation(row, col))) {
                    // If the piece can attack the given square, return true
                    return true;
                }
            }
        }
    }
    // If no piece can attack the given square, return false
    return false;
};

// Function to check if a move is legal
const isLegalMove = (board, from, to, color) => {
    // Check if the move is valid
    if (!isValidMove(board, from, to)) {
        return false;
    }
    // Get the piece to move
    const piece = getPieceAtSquareFromNotation(board, from);
    // Create a copy of the board
    const newBoard = JSON.parse(JSON.stringify(board));
    // Make the move on the copy of the board
    movePiece(newBoard, from, to);
    // Check if the move leaves the king in check
    const kingRow = newBoard.findIndex(row => row.some(square => square && square.type === 'k' && square.color === color));
    const kingCol = newBoard[kingRow].findIndex(square => square && square.type === 'k' && square.color === color);
    if (isSquareUnderAttack(newBoard, kingRow, kingCol, color)) {
        // If the move leaves the king in check, return false
        return false;
    }
    // If the move is legal, return true
    return true;
};

// Function to get all legal moves for a given square
const getLegalMovesForSquare = (board, row, col, color) => {
    // Get the algebraic notation of the square
    const square = getAlgebraicNotation(row, col);
    // Get all possible moves for the piece
    const possibleMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Get the algebraic notation of the destination square
            const destinationSquare = getAlgebraicNotation(i, j);
            // Check if the move is legal
            if (isLegalMove(board, square, destinationSquare, color)) {
                // If the move is legal, add it to the list of possible moves
                possibleMoves.push(destinationSquare);
            }
        }
    }
    // Return the list of legal moves
    return possibleMoves;
};

// Function to get all legal moves for the current player
const getLegalMovesForPlayer = (board, color) => {
    // Get all legal moves for all pieces of the current player
    const legalMoves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Get the piece at the current square
            const piece = board[i][j];
            // If the piece belongs to the current player
            if (piece && piece.color === color) {
                // Get the legal moves for the piece
                const moves = getLegalMovesForSquare(board, i, j, color);
                // Add the legal moves to the list of legal moves
                legalMoves.push(...moves.map(move => ({ from: getAlgebraicNotation(i, j), to: move })));
            }
        }
    }
    // Return the list of legal moves
    return legalMoves;
};

// Function to check if the game is over
const isGameOver = (board, color) => {
    // Check if the current player is in checkmate
    if (isCheckmate(board, color)) {
        return true;
    }
    // Check if the current player is in stalemate
    if (isStalemate(board, color)) {
        return true;
    }
    // Check if the game is a draw
    if (isDraw(board, color)) {
        return true;
    }
    // If the game is not over, return false
    return false;
};

// Function to check if the current player is in checkmate
const isCheckmate = (board, color) => {
    // Get the king's position
    const kingRow = board.findIndex(row => row.some(square => square && square.type === 'k' && square.color === color));
    const kingCol = board[kingRow].findIndex(square => square && square.type === 'k' && square.color === color);
    // Check if the king is under attack
    if (isSquareUnderAttack(board, kingRow, kingCol, color)) {
        // Check if the king can move to a safe square
        const legalMoves = getLegalMovesForSquare(board, kingRow, kingCol, color);
        if (legalMoves.length === 0) {
            // If the king cannot move to a safe square, the game is checkmate
            return true;
        }
    }
    // If the king is not under attack or can move to a safe square, the game is not checkmate
    return false;
};

// Function to check if the current player is in stalemate
const isStalemate = (board, color) => {
    // Check if the current player is not in check
    if (!isSquareUnderAttack(board, board.findIndex(row => row.some(square => square && square.type === 'k' && square.color === color)), board[kingRow].findIndex(square => square && square.type === 'k' && square.color === color), color)) {
        // Get the legal moves for the current player
        const legalMoves = getLegalMovesForPlayer(board, color);
        // Check if the current player has no legal moves
        if (legalMoves.length === 0) {
            // If the current player has no legal moves, the game is stalemate
            return true;
        }
    }
    // If the current player is in check or has legal moves, the game is not stalemate
    return false;
};

// Function to check if the game is a draw
const isDraw = (board, color) => {
    // Check if the game is a draw by insufficient material
    if (isDrawByInsufficientMaterial(board, color)) {
        return true;
    }
    // Check if the game is a draw by repetition
    if (isDrawByRepetition(board, color)) {
        return true;
    }
    // Check if the game is a draw by 50-move rule
    if (isDrawBy50MoveRule(board, color)) {
        return true;
    }
    // If the game is not a draw, return false
    return false;
};

// Function to check if the game is a draw by insufficient material
const isDrawByInsufficientMaterial = (board, color) => {
    // Check if the board contains only kings and pawns
    let hasOtherPieces = false;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && (piece.type !== 'p' && piece.type !== 'k')) {
                hasOtherPieces = true;
                break;
            }
        }
        if (hasOtherPieces) {
            break;
        }
    }
    // If the board contains only kings and pawns, check if the pawns are blocked
    if (!hasOtherPieces) {
        let blockedPawns = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'p') {
                    // Check if the pawn is blocked
                    if (piece.color === 'w' && i === 7) {
                        blockedPawns++;
                    } else if (piece.color === 'b' && i === 0) {
                        blockedPawns++;
                    }
                }
            }
        }
        // If all pawns are blocked, the game is a draw by insufficient material
        if (blockedPawns === 8) {
            return true;
        }
    }
    // If the board contains other pieces besides kings and pawns, or if the pawns are not blocked, the game is not a draw by insufficient material
    return false;
};

// Function to check if the game is a draw by repetition
const isDrawByRepetition = (board, color) => {
    // Check if the current board position has occurred at least three times in the game
    // (Implementation not provided, as it requires tracking the history of the game)
    return false;
};

// Function to check if the game is a draw by 50-move rule
const isDrawBy50MoveRule = (board, color) => {
    // Check if the last 50 moves have not involved any pawn moves or captures
    // (Implementation not provided, as it requires tracking the history of the game)
    return false;
};

// Function to evaluate the board for a given player
const evaluateBoard = (board, color) => {
    // Initialize the score
    let score = 0;
    // Loop through all squares on the board
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Get the piece at the current square
            const piece = board[i][j];
            // If the piece belongs to the current player
            if (piece && piece.color === color) {
                // Add the piece's value to the score
                score += PIECE_VALUES[piece.type];
            } else if (piece && piece.color !== color) {
                // Subtract the piece's value from the score
                score -= PIECE_VALUES[piece.type];
            }
        }
    }
    // Return the score
    return score;
};

// Function to get the best move for a given player using the minimax algorithm
const getBestMove = (board, color, depth = 3) => {
    // Define the alpha-beta pruning values
    let alpha = -Infinity;
    let beta = Infinity;
    // Get the legal moves for the current player
    const legalMoves = getLegalMovesForPlayer(board, color);
    // Initialize the best move
    let bestMove = null;
    // Initialize the best score
    let bestScore = -Infinity;
    // Loop through all legal moves
    for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i];
        // Create a copy of the board
        const newBoard = JSON.parse(JSON.stringify(board));
        // Make the move on the copy of the board
        movePiece(newBoard, move.from, move.to);
        // Recursively call the minimax algorithm for the opponent's turn
        const score = minimax(newBoard, depth - 1, color === 'w' ? 'b' : 'w', alpha, beta);
        // Update the best move and best score
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        // Update the alpha value for alpha-beta pruning
        alpha = Math.max(alpha, score);
        // If the beta value is less than or equal to the alpha value, stop exploring this branch
        if (beta <= alpha) {
            break;
        }
    }
    // Return the best move
    return bestMove;
};

// Function to implement the minimax algorithm with alpha-beta pruning
const minimax = (board, depth, color, alpha, beta) => {
    // If the game is over, return the evaluation of the board
    if (depth === 0 || isGameOver(board, color)) {
        return evaluateBoard(board, color);
    }
    // Get the legal moves for the current player
    const legalMoves = getLegalMovesForPlayer(board, color);
    // If the current player is maximizing
    if (color === 'w') {
        // Initialize the best score
        let bestScore = -Infinity;
        // Loop through all legal moves
        for (let i = 0; i < legalMoves.length; i++) {
            const move = legalMoves[i];
            // Create a copy of the board
            const newBoard = JSON.parse(JSON.stringify(board));
            // Make the move on the copy of the board
            movePiece(newBoard, move.from, move.to);
            // Recursively call the minimax algorithm for the opponent's turn
            const score = minimax(newBoard, depth - 1, color === 'w' ? 'b' : 'w', alpha, beta);
            // Update the best score
            bestScore = Math.max(bestScore, score);
            // Update the alpha value for alpha-beta pruning
            alpha = Math.max(alpha, score);
            // If the beta value is less than or equal to the alpha value, stop exploring this branch
            if (beta <= alpha) {
                break;
            }
        }
        // Return the best score
        return bestScore;
    } else {
        // Initialize the best score
        let bestScore = Infinity;
        // Loop through all legal moves
        for (let i = 0; i < legalMoves.length; i++) {
            const move = legalMoves[i];
            // Create a copy of the board
            const newBoard = JSON.parse(JSON.stringify(board));
            // Make the move on the copy of the board
            movePiece(newBoard, move.from, move.to);
            // Recursively call the minimax algorithm for the opponent's turn
            const score = minimax(newBoard, depth - 1, color === 'w' ? 'b' : 'w', alpha, beta);
            // Update the best score
            bestScore = Math.min(bestScore, score);
            // Update the beta value for alpha-beta pruning
            beta = Math.min(beta, score);
            // If the beta value is less than or equal to the alpha value, stop exploring this branch
            if (beta <= alpha) {
                break;
            }
        }
        // Return the best score
        return bestScore;
    }
};

// Function to get the piece type from a piece
const getPieceType = (piece) => {
    if (!piece) {
        return null;
    }
    return PIECE_TYPES[piece.type];
};

// Function to get the piece color from a piece
const getPieceColor = (piece) => {
    if (!piece) {
        return null;
    }
    return PIECE_COLORS[piece.color];
};

let puzzles = [];

const loadPuzzles = () => {
    return new Promise((resolve, reject) => {
        const puzzleData = [];
        fs.createReadStream('./src/assets/lichess_db_puzzle.csv')
            .pipe(csv())
            .on('data', (data) => {
                const processedPuzzle = {
                    id: data.PuzzleId || uuidv4(),
                    fen: data.FEN,
                    board: parseFENToUnicodeBoard(data.FEN),
                    moves: data.Moves.split(' '),
                    rating: parseInt(data.Rating) || 1500,
                    themes: data.Themes ? data.Themes.split(' ') : [],
                    initialMove: data.InitialMove || null,
                    solution: data.Solution ? data.Solution.split(' ') : []
                };
                puzzleData.push(processedPuzzle);
            })
            .on('end', () => {
                puzzles.push(...puzzleData);
                console.log(`Loaded ${puzzles.length} puzzles successfully.`);
                resolve(puzzles);
            })
            .on('error', (error) => reject(error));
    });
};

const parseFENToUnicodeBoard = (fen) => {
    const rows = fen.split(' ')[0].split('/');
    return rows.map(row => {
        let expandedRow = '';
        for (let char of row) {
            if (isNaN(char)) {
                expandedRow += char;
            } else {
                expandedRow += ' '.repeat(parseInt(char));
            }
        }
        return expandedRow.split('').map(piece => {
            if (piece === ' ') return ' ';
            const color = piece.toUpperCase() === piece ? 'w' : 'b';
            const type = piece.toLowerCase();
            return PIECE_UNICODE[color][type];
        });
    });
};

const games = {};
//let puzzles = [];

const userPuzzleStats = {};

const createNewPuzzleGame = (playerId, targetRating = 1500) => {
  const ratingRange = 100;
  const eligiblePuzzles = puzzles.filter(puzzle => 
      Math.abs(puzzle.rating - targetRating) <= ratingRange
  );

  const puzzle = eligiblePuzzles[Math.floor(Math.random() * eligiblePuzzles.length)];
  const chess = new Chess(puzzle.fen);

  const gameId = uuidv4();
  games[gameId] = {
      chess,
      playerId,
      puzzle,
      currentMoveIndex: 0,
      startTime: Date.now(),
      attempts: 0,
      completed: false
  };

  return {
      gameId,
      board: chess.board(),
      turn: chess.turn(),
      fen: chess.fen(),
      puzzleRating: puzzle.rating,
      themes: puzzle.themes,
      unicodePieces: getUnicodePieces(chess.board())
  };
};

const handleMove = (gameId, from, to, promotion = 'q') => {
  const game = games[gameId];
  if (!game) throw new Error('Game not found');

  const move = game.chess.move({ from, to, promotion });
  if (!move) throw new Error('Invalid move');

  game.attempts++;

  const expectedMove = game.puzzle.moves[game.currentMoveIndex];
  const isCorrectMove = moveToString(move) === expectedMove;

  if (!isCorrectMove) {
      game.chess.undo();
      return {
          isCorrect: false,
          message: 'Incorrect move. Try again!',
          board: game.chess.board(),
          fen: game.chess.fen(),
          unicodePieces: getUnicodePieces(game.chess.board())
      };
  }

  game.currentMoveIndex++;

  if (game.currentMoveIndex < game.puzzle.moves.length) {
      const opponentMove = game.puzzle.moves[game.currentMoveIndex];
      game.chess.move(opponentMove);
      game.currentMoveIndex++;
    }

    const isPuzzleCompleted = game.currentMoveIndex >= game.puzzle.moves.length;
    if (isPuzzleCompleted) {
        game.completed = true;
        updateUserStats(game.playerId, game);
    }

    return {
        isCorrect: true,
        board: game.chess.board(),
        move,
        turn: game.chess.turn(),
        fen: game.chess.fen(),
        isGameOver: game.chess.game_over(),
        isPuzzleCompleted,
        unicodePieces: getUnicodePieces(game.chess.board())
    };
};

const moveToString = (move) => {
    return `${move.from}${move.to}${move.promotion || ''}`;
};


const getUnicodePieces = (board) => {
    return board.map(row => 
        row.map(square => 
            square ? PIECE_UNICODE[square.color][square.type] : ' '
        )
    );
};

const updateUserStats = (playerId, game) => {
  if (!userPuzzleStats[playerId]) {
    userPuzzleStats[playerId] = {
      totalPuzzles: 0,
      completedPuzzles: 0,
      totalAttempts: 0,
      averageAttempts: 0,
      totalTime: 0
    };
  }

  userPuzzleStats[playerId].totalPuzzles++;
  userPuzzleStats[playerId].completedPuzzles++;
  userPuzzleStats[playerId].totalAttempts += game.attempts;
  userPuzzleStats[playerId].totalTime += Date.now() - game.startTime;

  userPuzzleStats[playerId].averageAttempts = userPuzzleStats[playerId].totalAttempts / userPuzzleStats[playerId].completedPuzzles;
};

module.exports = {
  createNewPuzzleGame,
  handleMove,
  loadPuzzles,
  getUnicodePieces,
  userPuzzleStats
};