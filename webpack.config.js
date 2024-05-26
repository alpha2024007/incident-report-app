const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin'); // ESLint plugin for linting

module.exports = {
  entry: {
    index: './src/index.js',
    cases: './src/cases.js', // Assuming you have a separate entry point for cases
  },
  output: {
    filename: '[name].bundle.js', // Use dynamic names based on entry point names
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'eval-source-map',
  plugins: [
    new ESLintPlugin(),
    new CleanWebpackPlugin({ verbose: true }),
    new HtmlWebpackPlugin({
      title: 'Home',
      filename: 'index.html',
      template: './src/index.html',
      chunks: ['index'], // JavaScript chunk to include
      inject: 'body', // Inject script tags into the body
    }),
    new HtmlWebpackPlugin({
      title: 'Cases',
      template: './src/cases.html', // Path to your HTML template
      filename: 'cases.html', // Output filename
      chunks: ['cases'], // JavaScript chunk to include
      inject: 'body', // Inject script tags into the body
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(gif|png|avif|jpe?g)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]', // Adjusted output path to include folder
          publicPath: 'assets/images/', // Adjusted public path to include folder
          outputPath: 'assets/images/', // Adjusted output path to include folder
        },
      },
      {
        test: /\.html$/,
        use: [
          'html-loader',
        ],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), 
    },
    open: true,
    hot: true,
  },
};
