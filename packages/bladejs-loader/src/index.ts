// This is a peer dependency
// @ts-ignore
import { AbstractError, Compiler, Source } from '@tarik02/bladejs-compiler';
import { getOptions } from 'loader-utils';
import * as path from 'path';
import validateOptions = require('schema-utils');
import { inspect } from 'util';
import * as webpack from 'webpack';

const schema = {
  type: 'object',
  properties: {
    defaults: {
      type: 'boolean',
    },
    plugins: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

const loader: webpack.loader.Loader = function (this: webpack.loader.LoaderContext, source: string | Buffer) {
  this.cacheable(true);

  const options: any = getOptions(this) || {};

  validateOptions(schema, options, 'bladejs-loader');

  if (source instanceof Buffer) {
    source = source.toString('utf-8');
  }

  const compiler = new Compiler();

  if (!('defaults' in options) || options.defaults === true) {
    compiler.addDefaults();
  }

  if ('plugins' in options) {
    for (const plugin of options.plugins) {
      const pluginCons = require(plugin);
      const basename = path.parse(plugin).name;

      if (typeof pluginCons === 'function') {
        compiler.addPlugin(pluginCons);
      } else if (typeof pluginCons.default === 'function') {
        compiler.addPlugin(pluginCons.default);
      } else if (typeof pluginCons[basename] === 'function') {
        compiler.addPlugin(pluginCons[basename]);
      } else {
        this.emitError(`Cannot include plugin ${inspect(plugin)}: it should export function (constructor)`);
      }
    }
  }

  try {
    const compiled = compiler.compile(new Source(source, this.resourcePath));
    return `export default ${compiled}`;
  } catch (e) {
    if (e instanceof AbstractError) {
      this.emitError(e.prettyPrint(true));
    }

    return;
  }
};

export default loader;
