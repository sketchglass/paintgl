"use strict";

const webpack = require("webpack")

module.exports = {
  entry: "./example.ts",
  output: {
    filename: "./bundle.js"
  },
  resolve: {
    extensions: ["", ".ts", ".js"]
  },
  module: {
    loaders: [
      {test: /\.ts$/, loader: "ts-loader"},
      {test: /\.(glsl|frag|vert)$/, loader: 'raw', exclude: /node_modules/},
      {test: /\.(glsl|frag|vert)$/, loader: 'glslify', exclude: /node_modules/}
    ],
  },
  devServer: {
    contentBase: '.',
    port: 22000
  },
}
