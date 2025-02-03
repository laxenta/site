// chess-lichess.js
const fetch = require('node-fetch'); // Make sure to install: npm install node-fetch

class LichessEngine {
    constructor() {
        this.baseUrl = 'https://lichess.org/api';
        this.token = 'lip_2iBBN7H4Hs38jGw5bLlZ';  //put yr own, i will rmeove mine when i push give the code.
        this.isReady = true;
    }

    init() {
        return Promise.resolve();
    }

    async analyzePosition(fen, depth = 15) {
        try {
            console.log('[Lichess] Analyzing position:', fen);
            
            const response = await fetch(
                `${this.baseUrl}/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Lichess API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Lichess] Analysis result:', data);

            // Convert Lichess format to match your existing format
            return {
                bestMove: data.pvs[0].moves.split(' ')[0],
                score: data.pvs[0].cp / 100, // Convert centipawns to pawns
                fen: fen,
                depth: data.depth
            };

        } catch (error) {
            console.error('[Lichess] Analysis error:', error);
            
            // If Lichess cloud analysis is not available, return a neutral evaluation
            return {
                bestMove: null,
                score: 0,
                fen: fen,
                depth: 0
            };
        }
    }

    quit() {
        // No cleanup needed
        return Promise.resolve();
    }
}

const engine = new LichessEngine();

module.exports = {
    initializeStockfish: () => engine.init(), // Keep same function names for compatibility
    analyzePosition: (fen, depth) => engine.analyzePosition(fen, depth),
    quitStockfish: () => engine.quit(),
    isEngineReady: () => engine.isReady
};