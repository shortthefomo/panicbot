const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        // allow access to process.env from within the vue app
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV)
        }
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }),
    ],
    resolve:{
      alias: {
        'constants': 'constants-browserify',
        'timers': 'timers-browserify',
        'net': 'net-browserify',
        'tls': 'tls-browserify',
        'path': 'path-browserify',
        'zlib': 'browserify-zlib',
        'fs':'browserify-fs', 
        'stream': 'stream-browserify',
        'https': 'https-browserify',
        'http': 'https-browserify',
        'crypto': 'crypto-browserify'
      },
      // extensions: ['.ts', '.js', '.tsx']
    }
  }
})