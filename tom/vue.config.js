const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
    transpileDependencies: true,
    devServer: {
        port: 8080,
        proxy: {
            '/api': {
                target: 'http://localhost:5050',
                changeOrigin: true,
                pathRewrite: { '^/api': '' },
                secure: false,
                ws: true
            }
        },
        allowedHosts: 'all',
        client: {
            webSocketURL: {
                protocol: process.env.HTTPS === 'true' ? 'wss' : 'ws',
                hostname: 'localhost',
                port: 8080,
                pathname: '/ws'
            }
        },
        webSocketServer: {
            type: 'ws',
            options: {
                path: '/ws'
            }
        }
    }
});
