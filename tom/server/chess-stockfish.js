// chess-stockfish.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class StockfishEngine {
    constructor() {
        this.process = null;
        this.isReady = false;
        this.callbacks = new Map();
        
        // Find the stockfish executable
        const engineDir = path.join(__dirname, 'engines');
        const entries = fs.readdirSync(engineDir);
        const stockfishDir = entries.find(entry => entry.startsWith('stockfish'));
        
        if (!stockfishDir) {
            throw new Error('Stockfish directory not found in engines/');
        }

        this.enginePath = path.join(engineDir, stockfishDir, 'stockfish');
        
        if (!fs.existsSync(this.enginePath)) {
            // Try alternate path
            this.enginePath = path.join(engineDir, stockfishDir, 'bin', 'stockfish');
            
            if (!fs.existsSync(this.enginePath)) {
                throw new Error('Stockfish executable not found');
            }
        }
        
        console.log('[Stockfish] Found engine at:', this.enginePath);
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                console.log('[Stockfish] Starting engine...');
                this.process = spawn(this.enginePath, {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                this.process.stdout.on('data', (data) => {
                    const lines = data.toString().trim().split('\n');
                    lines.forEach(line => this.handleEngineOutput(line));
                });

                this.process.stderr.on('data', (data) => {
                    console.error('[Stockfish] Error:', data.toString());
                });

                this.process.on('error', (error) => {
                    console.error('[Stockfish] Process error:', error);
                    reject(error);
                });

                this.process.on('close', (code) => {
                    console.log('[Stockfish] Process closed with code:', code);
                    this.isReady = false;
                });

                // Initialize UCI
                this.sendCommand('uci');

                // Wait for engine to be ready
                this.callbacks.set('init', {
                    resolve,
                    reject,
                    timeout: setTimeout(() => {
                        this.callbacks.delete('init');
                        reject(new Error('Engine initialization timeout'));
                    }, 10000)
                });

            } catch (error) {
                console.error('[Stockfish] Initialization error:', error);
                reject(error);
            }
        });
    }

    handleEngineOutput(line) {
        console.log('[Stockfish] ←', line);

        if (line === 'uciok') {
            this.sendCommand('isready');
        }
        else if (line === 'readyok') {
            const init = this.callbacks.get('init');
            if (init) {
                clearTimeout(init.timeout);
                this.callbacks.delete('init');
                this.isReady = true;
                init.resolve();
            }
        }
        else if (line.includes('bestmove')) {
            const analysis = this.callbacks.get('analysis');
            if (analysis) {
                clearTimeout(analysis.timeout);
                this.callbacks.delete('analysis');
                
                const bestMove = line.split('bestmove ')[1].split(' ')[0];
                analysis.resolve({
                    bestMove,
                    score: analysis.score,
                    fen: analysis.fen
                });
            }
        }
        else if (line.includes('score cp')) {
            const analysis = this.callbacks.get('analysis');
            if (analysis) {
                const match = line.match(/score cp ([-\d]+)/);
                if (match) {
                    analysis.score = parseInt(match[1]) / 100;
                }
            }
        }
    }

    sendCommand(cmd) {
        if (this.process && this.process.stdin.writable) {
            console.log('[Stockfish] →', cmd);
            this.process.stdin.write(cmd + '\n');
        }
    }

    analyzePosition(fen, depth = 15) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                reject(new Error('Engine not ready'));
                return;
            }

            this.callbacks.set('analysis', {
                resolve,
                reject,
                fen,
                score: null,
                timeout: setTimeout(() => {
                    this.callbacks.delete('analysis');
                    reject(new Error('Analysis timeout'));
                }, 30000)
            });

            this.sendCommand('position fen ' + fen);
            this.sendCommand('go depth ' + depth);
        });
    }

    quit() {
        if (this.process) {
            this.sendCommand('quit');
            this.process.kill();
            this.process = null;
            this.isReady = false;
        }
    }
}

const engine = new StockfishEngine();

module.exports = {
    initializeStockfish: () => engine.init(),
    analyzePosition: (fen, depth) => engine.analyzePosition(fen, depth),
    quitStockfish: () => engine.quit(),
    isEngineReady: () => engine.isReady
};