const { defineConfig } = require('@vue/cli-service');
const CopyWebpackPlugin = require('copy-webpack-plugin');
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
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.get('*.wasm', (req, res, next) => {
        res.type('application/wasm');
        next();
      });

      return middlewares;
    }
  },
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false
      }
    },
    module: {
      rules: [
        {
          test: /\.wasm$/,
          type: "javascript/auto",
          loader: "file-loader",
          options: {
            name: '[name].[ext]',
          }
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/stockfish.wasm/stockfish.wasm'),
            to: path.resolve(__dirname, 'dist/stockfish.wasm'),
            toType: 'file'
          },
          {
            from: path.resolve(__dirname, 'node_modules/stockfish.wasm/stockfish.js'),
            to: path.resolve(__dirname, 'dist/stockfish.js'),
            toType: 'file'
          },
          {
            from: path.resolve(__dirname, 'node_modules/stockfish.wasm/stockfish.worker.js'),
            to: path.resolve(__dirname, 'dist/stockfish.worker.js'),
            toType: 'file'
          }
        ]
      })
    ]
  }
});