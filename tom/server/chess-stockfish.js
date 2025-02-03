const path = require('path');
const { Worker } = require('worker_threads');

let engine = null;
let isReady = false;

function initializeStockfish() {
    return new Promise((resolve, reject) => {
        try {
            const workerPath = path.join(__dirname, './stockfish-node-worker.js');
            console.log('[Stockfish] Attempting to create worker from:', workerPath);
            
            engine = new Worker(workerPath);

            // Set a timeout for initialization
            const timeout = setTimeout(() => {
                if (!isReady) {
                    reject(new Error('Engine initialization timeout'));
                }
            }, 30000); // 30 second timeout

            engine.on('message', (msg) => {
                console.log('[Stockfish] Worker message:', msg);
                
                if (typeof msg === 'string') {
                    if (msg === 'ready') {
                        console.log('[Stockfish] Engine ready');
                        isReady = true;
                        clearTimeout(timeout);
                        resolve();
                    } else if (msg.startsWith('error:')) {
                        console.error('[Stockfish] Error:', msg.substring(7));
                        reject(new Error(msg.substring(7)));
                    }
                }
            });

            engine.on('error', (error) => {
                console.error('[Stockfish] Worker error:', error);
                reject(error);
            });

            engine.on('exit', (code) => {
                console.log('[Stockfish] Worker exited with code:', code);
                if (!isReady) {
                    reject(new Error(`Worker exited with code ${code}`));
                }
            });

        } catch (error) {
            console.error('[Stockfish] Init error:', error);
            reject(error);
        }
    });
}

function isEngineReady() {
    return isReady && engine !== null;
}

async function analyzePosition(fen, depth = 15) {
    console.log('[Stockfish] Analyzing position:', fen, 'at depth:', depth);
    
    return new Promise((resolve, reject) => {
        if (!isEngineReady()) {
            reject(new Error('Engine not initialized or not ready'));
            return;
        }

        let bestMove = null;
        let score = null;
        let timeoutId = null;

        const messageHandler = (msg) => {
            console.log('[Stockfish] Analysis message:', msg);
            
            if (typeof msg === 'string') {
                if (msg.includes('score cp')) {
                    const scoreMatch = msg.match(/score cp ([-\d]+)/);
                    if (scoreMatch) {
                        score = parseInt(scoreMatch[1]) / 100;
                    }
                }
                if (msg.includes('bestmove')) {
                    clearTimeout(timeoutId);
                    bestMove = msg.split('bestmove ')[1].split(' ')[0];
                    engine.off('message', messageHandler);
                    resolve({ 
                        bestMove, 
                        score,
                        depth,
                        fen 
                    });
                }
            }
        };

        // Set a timeout for the analysis
        timeoutId = setTimeout(() => {
            engine.off('message', messageHandler);
            reject(new Error('Analysis timeout'));
        }, 30000); // 30 second timeout

        try {
            engine.on('message', messageHandler);
            engine.postMessage(`position fen ${fen}`);
            engine.postMessage(`go depth ${depth}`);
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

function quitStockfish() {
    if (engine) {
        try {
            engine.postMessage('quit');
            engine.terminate();
        } catch (error) {
            console.error('[Stockfish] Error during quit:', error);
        } finally {
            engine = null;
            isReady = false;
        }
    }
}

module.exports = {
    initializeStockfish,
    analyzePosition,
    quitStockfish,
    isEngineReady
};