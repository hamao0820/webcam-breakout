const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path")

module.exports = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  mode: "development",

  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: {
    main: ["./src/ts/main.ts", "./src/templates/index.html", "./src/scss/style.scss"],
    process: [ "./src/templates/process.html", "./src/scss/process.scss"]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: "./[name].js",
  },
  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: "ts-loader",
      },
      {
        test: /\.(css|sass|scss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: { publicPath: '../' },
          },
          {
            loader: "css-loader",
            options: {
              url: true
            }
          },
          {
            loader: "sass-loader",
          },
        ],
      },
      {
        //拡張子がpng,jpg,gif,svgを検知したら
        test: /\.(png|jpg|gif|svg)$/,
        type: "asset/resource",
        generator: {
          filename: `./images/[name].[contenthash][ext]`,
        },
      },
      {
        test: /\.(html)$/,
        use: 'html-loader'
      },
    ],
  },
  plugins: [
    // new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/templates/index.html",
      filename: "index.html",
      output: "index.html",
      chunks: ["main"]
    }),
    new HtmlWebpackPlugin({
      template: "./src/templates/process.html",
      filename: "process.html",
      output: "process.html",
      chunks: ["process"]
    }),
    new MiniCssExtractPlugin({
      filename: "./css/[name].css",
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  watchOptions: {
    ignored: [".git/**", "node_modules"]
  },
};
