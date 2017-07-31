const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: './src/query.js',
  module: {
    rules: [{
      test: /\.js$/, exclude: /(node_modules|bower_components)/,
      use: { loader: 'babel-loader', options: { presets: ['env'] }}
    }]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true
      },
      compress: {
        screw_ie8: true
      },
      comments: false
    }),
    new BundleAnalyzerPlugin()
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'query.js',
    library: 'moQuery',
    libraryTarget: 'umd'
  }
}
