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
      { test: /\.ts$/, loader: "ts-loader", },
    ],
  },
  devServer: {
    contentBase: '.',
    port: 22000
  },
}
