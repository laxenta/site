// public/wasm-loader.js
self.wasmSupport = {
    supported: typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function'
  };
  
  self.importScripts = (function(originalImportScripts) {
    return function(...urls) {
      return urls.map(url => {
        if (url.endsWith('.wasm')) {
          return fetch(url)
            .then(response => response.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes))
            .then(results => {
              self.wasmModule = results.instance;
              self.wasmInstance = results.instance;
              return results;
            });
        } else {
          return originalImportScripts(url);
        }
      });
    };
  })(self.importScripts);