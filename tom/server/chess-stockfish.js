const path = require('path');
const { Worker } = require('worker_threads');

let engine = null;
let isReady = false;

function initializeStockfish() {
    return new Promise((resolve, reject) => {
        try {
            const workerPath = path.join(__dirname, './stockfish-node-worker.js');
            console.log('[Stockfish] Creating worker from:', workerPath);
            
            engine = new Worker(workerPath);

            const timeout = setTimeout(() => {
                if (!isReady) {
                    reject(new Error('Engine initialization timeout'));
                }
            }, 30000);

            engine.on('message', (msg) => {
                console.log('[Stockfish] Worker message:', msg);
                
                if (msg === 'ready') {
                    console.log('[Stockfish] Engine ready');
                    isReady = true;
                    clearTimeout(timeout);
                    resolve();
                } else if (typeof msg === 'string' && msg.startsWith('error:')) {
                    console.error('[Stockfish] Error:', msg.substring(7));
                    clearTimeout(timeout);
                    reject(new Error(msg.substring(7)));
                }
            });

            engine.on('error', (error) => {
                console.error('[Stockfish] Worker error:', error);
                clearTimeout(timeout);
                reject(error);
            });

            engine.on('exit', (code) => {
                console.log('[Stockfish] Worker exited with code:', code);
                if (!isReady) {
                    clearTimeout(timeout);
                    reject(new Error(`Worker exited with code ${code}`));
                }
            });

            // Send initialization message
            engine.postMessage({ type: 'init' });

        } catch (error) {
            console.error('[Stockfish] Init error:', error);
            reject(error);
        }
    });
}

function analyzePosition(fen, depth = 15) {
    console.log('[Stockfish] Analyzing position:', fen, 'at depth:', depth);
    
    return new Promise((resolve, reject) => {
        if (!engine || !isReady) {
            reject(new Error('Engine not initialized or not ready'));
            return;
        }

        let result = null;
        let timeoutId = setTimeout(() => {
            reject(new Error('Analysis timeout'));
        }, 30000);

        function messageHandler(msg) {
            if (typeof msg === 'object' && msg.type === 'bestmove') {
                clearTimeout(timeoutId);
                engine.off('message', messageHandler);
                resolve({
                    bestMove: msg.move,
                    evaluation: msg.evaluation,
                    depth: msg.depth
                });
            }
        }

        engine.on('message', messageHandler);
        engine.postMessage({
            type: 'analyze',
            fen: fen,
            depth: depth
        });
    });
}

function isEngineReady() {
    return isReady && engine !== null;
}

function quitStockfish() {
    if (engine) {
        engine.postMessage({ type: 'quit' });
        engine.terminate();
        engine = null;
        isReady = false;
    }
}

module.exports = {
    initializeStockfish,
    analyzePosition,
    quitStockfish,
    isEngineReady
};