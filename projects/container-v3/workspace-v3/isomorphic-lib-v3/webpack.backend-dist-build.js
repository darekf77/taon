// var webpack = require('webpack'),
var path = require('path'),
  fs = require('fs');

// var WebpackOnBuildPlugin = require('on-build-webpack');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './src/app.ts',
  target: 'node',
  output: {
    path: __dirname + '/dist',
    libraryTarget: "commonjs",
    filename: 'app.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: path.resolve(__dirname, "node_modules"),
        loaders: ['ts-loader']
      },
      // { test: /\.json$/, loaders: ['json-loader'] }
    ]
  },
  externals: [
    function (context, request, callback) {
      console.log(request[0])
      if (request[0] == '.') {
        callback();
      } else {
        callback(null, request);
      }
    }
  ],
  node: {
    __dirname: false,
    __filename: false
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: true
    //   }
    // }),
    // new WebpackOnBuildPlugin(function (stats) {
    //   // Do whatever you want...
    // }),
  ]
}
