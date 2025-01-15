const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    allowedHosts: 'all',
    client: {
      // Force secure websocket
      webSocketURL: {
        protocol: 'wss',
        hostname: '0.0.0.0'
      }
    },
    webSocketServer: {
      // Enable WSS in dev server
      type: 'ws',
      options: {
        path: '/ws'
      }
    }
  }
})