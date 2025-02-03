// services/lichess.js ( backup file, no use in code)
export default class LichessService {
    constructor() {
        this.baseUrl = 'https://lichess.org/api';
        this.token = 'lip_2iBBN7H4Hs38jGw5bLlZ';
    }

    async analyzePosition(fen, multiPv = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                evaluation: data
            };
        } catch (error) {
            console.error('Lichess analysis failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async createExternalEngine(name, maxThreads = 8, maxHash = 2048) {
        try {
            const response = await fetch(`${this.baseUrl}/external-engine`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    maxThreads,
                    maxHash
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create external engine:', error);
            throw error;
        }
    }
}