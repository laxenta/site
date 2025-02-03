const { parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs');

console.log('[Worker] Starting initialization...');

// Create a proper self object for Node.js environment
global.self = {
    postMessage: function(msg) {
        parentPort.postMessage(msg);
    },
    location: {
        href: path.join(__dirname, '../public/stockfish/stockfish.worker.js')
    }
};

// Set up WebAssembly environment
try {
    const wasmPath = path.join(__dirname, '../public/stockfish/stockfish.wasm');
    console.log('[Worker] WASM path:', wasmPath);
    
    if (!fs.existsSync(wasmPath)) {
        throw new Error(`WASM file not found at ${wasmPath}`);
    }
    
    console.log('[Worker] Reading WASM file...');
    const wasmBinary = fs.readFileSync(wasmPath);
    const wasmBase64 = wasmBinary.toString('base64');
    
    console.log('[Worker] WASM file size:', wasmBinary.length, 'bytes');
    global.wasmBinary = Buffer.from(wasmBase64, 'base64');

    let engine = null;
    let isInitializing = false;
    let currentEvaluation = null;
    let currentDepth = 0;
    let isAnalyzing = false;

    function debug(...args) {
        console.log('[Worker]', ...args);
    }

    function handleEngineMessage(line) {
        debug('Engine message:', line);
        parentPort.postMessage(line);

        if (line.includes('bestmove')) {
            const bestMove = line.split('bestmove ')[1].split(' ')[0];
            isAnalyzing = false;
            parentPort.postMessage({
                type: 'bestmove',
                move: bestMove,
                evaluation: currentEvaluation,
                depth: currentDepth
            });
        } 
        else if (line.includes('score cp')) {
            const matches = line.match(/score cp ([-\d]+)/);
            if (matches) {
                currentEvaluation = parseInt(matches[1]) / 100;
            }
            
            const depthMatch = line.match(/depth (\d+)/);
            if (depthMatch) {
                currentDepth = parseInt(depthMatch[1]);
            }

            parentPort.postMessage({
                type: 'evaluation',
                evaluation: currentEvaluation,
                depth: currentDepth
            });
        }
    }

    async function initializeEngine() {
        if (isInitializing || engine) return;
        
        isInitializing = true;
        debug('Starting engine initialization');
        
        try {
            debug('Loading Stockfish module...');
            const Stockfish = require('../public/stockfish/stockfish.js');
            
            debug('Creating Stockfish instance...');
            engine = await Stockfish({
                wasmBinary: global.wasmBinary,
                locateFile: (file) => path.join(__dirname, '../public/stockfish/', file)
            });
            
            debug('Adding message listener...');
            engine.addMessageListener(handleEngineMessage);
            
            debug('Initializing UCI...');
            engine.postMessage('uci');
            engine.postMessage('setoption name MultiPV value 1');
            engine.postMessage('setoption name Threads value 1');
            engine.postMessage('setoption name Hash value 16');
            engine.postMessage('ucinewgame');
            engine.postMessage('isready');
            
            debug('Engine initialization complete');
            parentPort.postMessage('ready');
        } catch (err) {
            console.error('[Worker] Engine initialization failed:', err);
            parentPort.postMessage('error: ' + err.message);
        } finally {
            isInitializing = false;
        }
    }

    function analyzePosition(fen, depth = 15) {
        if (!engine) {
            parentPort.postMessage({ 
                type: 'error', 
                message: 'Engine not initialized' 
            });
            return;
        }

        isAnalyzing = true;
        currentEvaluation = null;
        currentDepth = 0;

        engine.postMessage('position fen ' + fen);
        engine.postMessage('go depth ' + depth);
    }

    // Handle messages from the main thread
    parentPort.on('message', (msg) => {
        debug('Received message:', msg);
        
        if (typeof msg === 'object') {
            switch (msg.type) {
                case 'init':
                    if (!engine && !isInitializing) {
                        initializeEngine();
                    }
                    break;

                case 'analyze':
                    if (msg.fen) {
                        analyzePosition(msg.fen, msg.depth);
                    }
                    break;

                case 'stop':
                    if (engine && isAnalyzing) {
                        engine.postMessage('stop');
                        isAnalyzing = false;
                    }
                    break;

                case 'quit':
                    if (engine) {
                        engine.postMessage('quit');
                        engine = null;
                    }
                    break;
            }
        } else if (typeof msg === 'string' && engine) {
            engine.postMessage(msg);
        }
    });

    // Start initialization
    initializeEngine().catch(err => {
        console.error('[Worker] Initialization error:', err);
        parentPort.postMessage('error: ' + err.message);
    });

} catch (error) {
    console.error('[Worker] Setup error:', error);
    parentPort.postMessage('error: ' + error.message);
}