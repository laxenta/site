// stockfish.worker.js
let wasmModule = null;

// Set up Module configuration before loading stockfish.js
self.Module = {
  onRuntimeInitialized: function() {
    console.log('WASM Runtime initialized');
    wasmModule = this;
    // Signal that we're ready
    self.postMessage('ready');
  },
  print: function(text) {
    // Forward engine output to main thread
    self.postMessage(text);
  },
  locateFile: function(path) {
    if (path.endsWith('.wasm')) {
      return '/stockfish.wasm';
    }
    return path;
  }
};

console.log('Loading Stockfish WASM module...');
self.importScripts('stockfish.js');

// Handle messages from the main thread
self.onmessage = function(e) {
  const message = e.data;
  
  if (!wasmModule) {
    console.error('WASM module not initialized yet');
    return;
  }

  if (typeof message === 'string') {
    wasmModule.postMessage(message);
  }
};