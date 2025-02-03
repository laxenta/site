const { parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs');

console.log('[Worker] Starting initialization...');

try {
    // Update paths to use the stockfish subdirectory
    const wasmPath = path.join(__dirname, '../public/stockfish/stockfish.wasm');
    console.log('[Worker] WASM path:', wasmPath);
    
    if (!fs.existsSync(wasmPath)) {
        throw new Error(`WASM file not found at ${wasmPath}`);
    }
    
    // Read and set up WASM binary
    console.log('[Worker] Reading WASM file...');
    const wasmBinary = fs.readFileSync(wasmPath);
    const wasmBase64 = wasmBinary.toString('base64');
    
    console.log('[Worker] WASM file size:', wasmBinary.length, 'bytes');
    
    // Create a Buffer URL-like object for the WASM
    global.wasmBinary = Buffer.from(wasmBase64, 'base64');
    
    console.log('[Worker] Setting up environment...');
    
    // Emulate the Web Worker environment
    global.self = {
        onmessage: null,
        postMessage: function(msg) {
            parentPort.postMessage(msg);
        },
        // Add location for worker script resolution
        location: {
            href: path.join(__dirname, '../public/stockfish/stockfish.worker.js')
        }
    };
    
    let engine = null;
    let isInitializing = false;
    
    async function initializeEngine() {
        if (isInitializing || engine) return;
        
        isInitializing = true;
        console.log('[Worker] Starting engine initialization');
        
        try {
            console.log('[Worker] Loading Stockfish module...');
            // Update the path to stockfish.js
            const Stockfish = require('../public/stockfish/stockfish.js');
            
            console.log('[Worker] Creating Stockfish instance...');
            engine = await Stockfish({
                wasmBinary: global.wasmBinary,
                locateFile: (file) => {
                    // Help Stockfish locate its files
                    return path.join(__dirname, '../public/stockfish/', file);
                }
            });
            
            console.log('[Worker] Adding message listener...');
            engine.addMessageListener((line) => {
                console.log('[Worker] Engine message:', line);
                parentPort.postMessage(line);
            });
            
            console.log('[Worker] Initializing UCI...');
            engine.postMessage('uci');
            engine.postMessage('setoption name MultiPV value 1');
            engine.postMessage('setoption name Threads value 1');
            engine.postMessage('setoption name Hash value 16');
            engine.postMessage('ucinewgame');
            engine.postMessage('isready');
            
            console.log('[Worker] Engine initialization complete');
            parentPort.postMessage('ready');
        } catch (err) {
            console.error('[Worker] Engine initialization failed:', err);
            parentPort.postMessage('error: ' + err.message);
        } finally {
            isInitializing = false;
        }
    }
    
    // Handle messages from parent
    parentPort.on('message', (msg) => {
        if (!engine) {
            console.log('[Worker] Engine not ready, received message:', msg);
            return;
        }
        console.log('[Worker] Sending to engine:', msg);
        engine.postMessage(msg);
    });
    
    // Initialize the engine
    console.log('[Worker] Starting engine initialization...');
    initializeEngine().catch(err => {
        console.error('[Worker] Initialization error:', err);
        parentPort.postMessage('error: ' + err.message);
    });
    
} catch (error) {
    console.error('[Worker] Setup error:', error);
    parentPort.postMessage('error: ' + error.message);
}