// stockfish.worker.js
let engine = null;
let isInitializing = false;

function debug(...args) {
    console.log('[Stockfish Worker]', ...args);
}

async function initializeEngine() {
    if (isInitializing || engine) {
        return;
    }

    isInitializing = true;
    debug('Starting engine initialization');

    try {
        const stockfish = await Stockfish();
        debug('Stockfish WASM initialized');
        engine = stockfish;
        
        // Add the message listener
        engine.addMessageListener((line) => {
            self.postMessage(line);
        });

        // Test the engine
        engine.postMessage('uci');
        
        debug('Engine initialization complete');
        self.postMessage('ready');
    } catch (err) {
        debug('Engine initialization failed:', err);
        self.postMessage('error: ' + err.message);
    } finally {
        isInitializing = false;
    }
}

// Handle messages
self.onmessage = function(e) {
    const message = e.data;
    
    if (message.cmd === 'load') {
        // Ignore duplicate load commands if already initialized or initializing
        if (!engine && !isInitializing) {
            debug('Received load command, initializing engine');
            initializeEngine();
        }
        return;
    }

    if (!engine) {
        debug('Engine not ready, ignoring command:', message);
        return;
    }

    if (typeof message === 'string') {
        debug('Sending command to engine:', message);
        engine.postMessage(message);
    }
};

// Initial setup
debug('Worker started');
importScripts('stockfish.js');
debug('Stockfish.js loaded');