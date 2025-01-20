const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    allowedHosts: 'all',
    client: {
      webSocketURL: {
        protocol: process.env.HTTPS === 'true' ? 'wss' : 'ws',
        hostname: 'localhost',
        port: 5050,
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