module.exports = {
  mode: 'development',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.bjs$/,
        use: [
          {
            loader: '@tarik02/bladejs-loader',
          },
        ],
      },
    ],
  },
};
