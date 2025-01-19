const express = require('express');
const cors = require('cors');
const path = require('path');
const chessServer = require('./chess-server');

const app = express();
const port = process.env.PORT || 5030;

// Create server instance
const server = app.listen(port, () => {
    console.log(`Chess server running on port ${port}`);
});
  
// Middleware
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());

// Load puzzles
chessServer.loadPuzzles()
  .then(() => console.log('Chess puzzles loaded successfully'))
  .catch(err => console.error('Failed to load chess puzzles:', err));

// Rest of your routes stay the same...

// Error handlers
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});