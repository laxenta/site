const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: 'localhost', // Ensure the server binds to localhost
    port: 8080, // Use port 8080 (or your preferred port)
    https: false, // Disable HTTPS for local development
    client: {
      webSocketURL: 'ws://localhost:8080/ws', // Use WebSocket for HMR on localhost
    },
  },
});
