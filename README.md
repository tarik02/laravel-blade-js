# laravel-blade-js
[![TravisCI Build Status](https://travis-ci.org/Tarik02/laravel-blade-js.svg?branch=master)](https://travis-ci.org/Tarik02/laravel-blade-js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/f0an82rf5pdi4xl3/branch/master?svg=true)](https://ci.appveyor.com/project/Tarik02/laravel-blade-js/branch/master)
[![npm version](https://badge.fury.io/js/%40tarik02%2Fbladejs.svg)](https://badge.fury.io/js/%40tarik02%2Fbladejs)

## Packages
The project is divided into two separate packages:
- compiler - package that can compile blade templates into pure JavaScript async generator functions.
- runtime - package that can run these functions.
- loader - webpack loader.

Compiler can be used together with runtime, but it is recommended to compile templates before using them in server or browser.

## Installation and Usage
- [runtime](https://github.com/Tarik02/laravel-blade-js/tree/master/packages/bladejs)
- [compiler](https://github.com/Tarik02/laravel-blade-js/tree/master/packages/bladejs-compiler)
- [loader](https://github.com/Tarik02/laravel-blade-js/tree/master/packages/bladejs-loader)

## Examples
- [express](https://github.com/Tarik02/laravel-blade-js/tree/master/examples/express)
- [webpack loader](https://github.com/Tarik02/laravel-blade-js/tree/master/examples/loader)

