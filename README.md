# laravel-blade-js
[![TravisCI Build Status](https://travis-ci.org/Tarik02/laravel-blade-js.svg?branch=master)](https://travis-ci.org/Tarik02/laravel-blade-js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/f0an82rf5pdi4xl3/branch/master?svg=true)](https://ci.appveyor.com/project/Tarik02/laravel-blade-js/branch/master)
[![npm version](https://badge.fury.io/js/laravel-blade-js.svg)](https://badge.fury.io/js/laravel-blade-js)

## Packages
The project is divided into two separate packages:
- compiler - package that can compile blade templates into pure JavaScript async generator functions.
- runtime - package that can run these functions.
- loader (not ready yet) - webpack loader.

Compiler can be used together with runtime, but it is recommended to compile templates before using them in server or browser.

## Installation
```bash
# compiler:
$ yarn add @tarik02/bladejs-compiler
# or
$ npm install --save @tarik02/bladejs-compiler

# runtime:
$ yarn add @tarik02/bladejs
# or
$ npm install --save @tarik02/bladejs

# loader:
$ yarn add @tarik02/bladejs-loader
# or
$ npm install --save @tarik02/bladejs-loader

```

## Usage
WIP

## Benchmark
WIP
