# bladejs
[![TravisCI Build Status](https://travis-ci.org/Tarik02/laravel-blade-js.svg?branch=master)](https://travis-ci.org/Tarik02/laravel-blade-js)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/f0an82rf5pdi4xl3/branch/master?svg=true)](https://ci.appveyor.com/project/Tarik02/laravel-blade-js/branch/master)
[![npm version](https://badge.fury.io/js/%40tarik02%2Fbladejs.svg)](https://badge.fury.io/js/%40tarik02%2Fbladejs)

## Installation
```bash
$ yarn add @tarik02/bladejs
# or
$ npm install --save @tarik02/bladejs
```

## Usage
```typescript
import {
  CompiledTemplate,
  Runtime,
  TemplateProvider,
} from '@tarik02/bladejs';

const templateProvider: TemplateProvider = {
  async getTemplateCompiledFile(name: string): Promise<CompiledTemplate | undefined> {
    // TODO: Load template, return undefined if does not exist
  },

  async isOutdated(name: string, template: CompiledTemplate, creationTime: number): Promise<boolean> {
    // TODO: Return true if template is outdated (this will cause to {getTemplateCompiledFile} call)
  },
};

const runtime = new Runtime([templateProvider]);

(async () => {
  for await (const chunk of runtime.render('test')) {
    process.stdout.write(chunk);
  }
})();
```
