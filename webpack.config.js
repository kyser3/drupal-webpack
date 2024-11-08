/**
 * This file is managed by the drupal-webpack package.
 * @see https://www.npmjs.com/package/drupal-webpack?activeTab=readme
 * @see https://github.com/kyser3/drupal-webpack
 *
 * Feel free to modify this configuration to your liking if you know what you're doing.
 *
 * Any improvements/suggestions are appreciated.
 *
 * Issues can be created on GitHub: https://github.com/kyser3/drupal-webpack
 */
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const drupal = require("./.webpack/includes/drupal.js");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = (argv && argv.mode === 'production');
  const entry = drupal.getDrupalEntries(env, argv);
  return {
    mode: isProduction ? "production" : "development",
    entry: entry,
    output: {
      path: path.resolve() + '/',
      filename: '[name].min.js'
    },
    plugins: [
      // Remove empty scripts.
      // @see https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151
      new RemoveEmptyScriptsPlugin({}),
      // CSS extraction into dedicated file.
      new MiniCssExtractPlugin({
        filename: "[name].css",
      })
    ],
    module: {
      rules: [
        // JS Babel.
        {
          test: /\.(js|jsx)$/,
          exclude: [
            /node_modules/,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
              ],
            }
          },
        },
        // SASS compilation.
        {
          test: /\.(sass|scss)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: "css-loader",
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: true
              }
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              }
            }
          ]
        },
      ]
    },
    optimization: {
      removeEmptyChunks: true,
      minimize: true,
      minimizer: [new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      })],
    },
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    }
  };
};
