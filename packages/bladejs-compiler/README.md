# bladejs-compiler
[![TravisCI Build Status](https://travis-ci.org/Tarik02/laravel-blade-js.svg?branch=master)](https://travis-ci.org/Tarik02/laravel-blade-js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/f0an82rf5pdi4xl3/branch/master?svg=true)](https://ci.appveyor.com/project/Tarik02/laravel-blade-js/branch/master)
[![npm version](https://badge.fury.io/js/%40tarik02%2Fbladejs-compiler.svg)](https://badge.fury.io/js/%40tarik02%2Fbladejs-compiler)

## Installation
```bash
$ yarn add @tarik02/bladejs-compiler
# or
$ npm install --save @tarik02/bladejs-compiler
```

## Usage
```typescript
import {
  AbstractError,
  Compiler,
  Source,
} from '@tarik02/bladejs-compiler';

const compiler = new Compiler();
compiler.addDefaults();

const source = `
<div class="alert alert-danger">
    <div class="alert-title">{{ title }}</div>

    {{ slot }}
</div>
`.trim();
const filename = 'test.bjs';

const source = new Source(source, filename);
let compiled: string;

try {
  compiled = compiler.compile(source);
} catch (e) {
  if (e instanceof AbstractError) {
    process.stdout.write(e.prettyPrint());
    process.exit(-1);
  }

  throw e;
}
```
