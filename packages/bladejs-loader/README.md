# bladejs
[![TravisCI Build Status](https://travis-ci.org/Tarik02/laravel-blade-js.svg?branch=master)](https://travis-ci.org/Tarik02/laravel-blade-js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/f0an82rf5pdi4xl3/branch/master?svg=true)](https://ci.appveyor.com/project/Tarik02/laravel-blade-js/branch/master)
[![npm version](https://badge.fury.io/js/%40tarik02%2Fbladejs-loader.svg)](https://badge.fury.io/js/%40tarik02%2Fbladejs-loader)

## Installation
```bash
$ yarn add --dev @tarik02/bladejs-loader
# or
$ npm install --save-dev @tarik02/bladejs-loader
```

## Usage
Add as loader to `webpack.config.js`:
```javascript
...
  module: {
    rules: [
      ...
      {
        test: /\.bjs$/,
        use: [
          {
            loader: '@tarik02/bladejs-loader',
            options: {
              // use default blade functions and constructions (default: true)
              defaults: true,

              // list of custom plugins (paths to them)
              plugins: [
                require.resolve('./plugins/SomePlugin'),
              ],
            },
          },
        ],
      },
      ...
    ],
  },
...
```
