const { defineConfig } = require('@vue/cli-service');
const path = require('path');

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
  },
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false
      }
    }
  }
});