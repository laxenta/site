// stockfish.worker.js
let engine = null;
let isInitializing = false;
let currentEvaluation = null;
let currentDepth = 0;
let isAnalyzing = false;

function debug(...args) {
    console.log('[Stockfish Worker]', ...args);
}

async function initializeEngine() {
    if (isInitializing || engine) return;

    isInitializing = true;
    debug('Starting engine initialization');

    try {
        const stockfish = await Stockfish();
        engine = stockfish;
        
        engine.addMessageListener((line) => {
            handleEngineMessage(line);
        });

        // Initialize engine with UCI and default settings
        engine.postMessage('uci');
        engine.postMessage('setoption name MultiPV value 1');
        engine.postMessage('setoption name Threads value 1');
        engine.postMessage('setoption name Hash value 16');
        engine.postMessage('ucinewgame');
        engine.postMessage('isready');
        
        debug('Engine initialization complete');
        self.postMessage({ type: 'ready' });
    } catch (err) {
        debug('Engine initialization failed:', err);
        self.postMessage({ 
            type: 'error', 
            message: err.message 
        });
    } finally {
        isInitializing = false;
    }
}

function handleEngineMessage(line) {
    // Debug all messages
    debug('Engine:', line);

    // Parse different types of engine output
    if (line.includes('bestmove')) {
        const bestMove = line.split('bestmove ')[1].split(' ')[0];
        isAnalyzing = false;
        self.postMessage({
            type: 'bestmove',
            move: bestMove,
            evaluation: currentEvaluation,
            depth: currentDepth
        });
    } 
    else if (line.includes('score cp')) {
        // Parse evaluation score
        const matches = line.match(/score cp ([-\d]+)/);
        if (matches) {
            currentEvaluation = parseInt(matches[1]) / 100;
        }
        
        // Parse depth
        const depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) {
            currentDepth = parseInt(depthMatch[1]);
        }

        // Send progress update
        self.postMessage({
            type: 'evaluation',
            evaluation: currentEvaluation,
            depth: currentDepth
        });
    }
    else if (line.includes('score mate')) {
        // Parse mate score
        const matches = line.match(/score mate ([-\d]+)/);
        if (matches) {
            const moves = parseInt(matches[1]);
            currentEvaluation = moves > 0 ? Infinity : -Infinity;
        }
        
        self.postMessage({
            type: 'mate',
            moves: matches ? parseInt(matches[1]) : null,
            depth: currentDepth
        });
    }
    
    // Forward raw message for debug purposes
    self.postMessage({
        type: 'raw',
        line: line
    });
}

function analyzePosition(fen, depth = 15) {
    if (!engine) {
        self.postMessage({ 
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

function stopAnalysis() {
    if (isAnalyzing && engine) {
        engine.postMessage('stop');
        isAnalyzing = false;
    }
}

// Handle incoming messages
self.onmessage = function(e) {
    const msg = e.data;

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
            stopAnalysis();
            break;

        case 'quit':
            if (engine) {
                engine.postMessage('quit');
                engine = null;
            }
            break;

        default:
            if (typeof msg === 'string' && engine) {
                engine.postMessage(msg);
            }
    }
};

// Initial setup
debug('Worker started');
importScripts('stockfish.js');
debug('Stockfish.js loaded');