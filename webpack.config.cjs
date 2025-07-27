const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './lambda.js',  
  target: 'node18',
  externals: [nodeExternals()],
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lambda.js',
    libraryTarget: 'commonjs2'
  }
};
