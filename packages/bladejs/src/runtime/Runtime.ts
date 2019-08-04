import { DefaultEnvironment } from '../environment/DefaultEnvironment';
import { Environment, TemplateParams } from '../environment/Environment';
import { CompiledTemplate } from '../template/CompiledTemplate';
import { TemplateProvider } from '../template/TemplateProvider';
import '../util/asyncIterator';
import { trimAsyncIterable } from '../util/trimAsyncIterable';
import { RuntimeFilter } from './RuntimeFilter';
import { RuntimeFunction } from './RuntimeFunction';

type CompiledTemplateItem = {
  readonly promise: Promise<CompiledTemplate>;

  provider?: TemplateProvider;
  value?: CompiledTemplate;
  readonly time: number;
};

export class Runtime {
  private readonly providers: ReadonlyArray<TemplateProvider>;
  private readonly compiledTemplates = new Map<string, CompiledTemplateItem>();
  private readonly filters = new Map<string, RuntimeFilter>();
  private readonly functions = new Map<string, RuntimeFunction>();

  private _cacheEnabled: boolean = true;

  public get cacheEnabled(): boolean {
    return this._cacheEnabled;
  }

  public set cacheEnabled(enabled: boolean) {
    this._cacheEnabled = enabled;
    if (!enabled) {
      this.compiledTemplates.clear();
    }
  }

  public constructor(providers: ReadonlyArray<TemplateProvider>) {
    this.providers = providers;

    this.registerFilter('currency', (_env, value, currency = '$', left = true) =>
        left
          ? `${currency} ${value}`
          : `${value} ${currency}`
      ,
    );

    this.registerFilter('trim', (_env, value) => `${value}`.trim());

    this.registerFilter('substr', (_env, value, start, length) =>
        `${value}`.substring(start, length === undefined ? undefined : start + length)
      ,
    );

    this.registerFilter('substring', (_env, value, start, end) =>
        `${value}`.substring(start, end)
      ,
    );

    this.registerFilter('ucfirst', (_env, value) => {
      const str = `${value}`;
      return str.substring(0, 1).toUpperCase() + str.substring(1);
    });

    this.registerFilter('lcfirst', (_env, value) => {
      const str = `${value}`;
      return str.substring(0, 1).toLowerCase() + str.substring(1);
    });

    this.registerFilter('reverse', (_env, value) =>
        `${value}`.split('').reverse().join('')
      ,
    );

    this.registerFunction('include', async function* (env, includedName, params) {
      yield* env.runtime.render(includedName, params);
    });

    this.registerFunction('includeIf', async function* (env, includedName, params) {
      try {
        yield* env.runtime.render(includedName, params);
      } catch (e) {
        if (!(e instanceof Error && e.message.startsWith('Could not find template '))) {
          throw e;
        }
      }
    });

    this.registerFunction('includeWhen', async function* (env, condition, includedName, params) {
      if (condition) {
        yield* env.runtime.render(includedName, params);
      }
    });

    this.registerFunction('includeFirst', async function* (env, includedNames, params) {
      for (const includedName of includedNames) {
        try {
          yield* env.runtime.render(includedName, params);
          return;
        } catch (e) {
          if (!(e instanceof Error && e.message.startsWith('Could not find template '))) {
            throw e;
          }
        }
      }
      throw new Error(`Could not find template ${includedNames.map((it: any) => `'${it}'`).join(' or ')}`);
    });

    this.registerFunction('each', async function* (env, includedName, collection, varName, emptyIncludedName) {
      let empty = true;
      for (const loop = env.pushLoop(collection); loop.__hasRemaining; loop.__next()) {
        empty = false;

        yield* env.runtime.render(includedName, {
          [varName]: loop.__value,
        });
      }
      env.popLoop();

      if (empty && emptyIncludedName !== undefined) {
        yield* env.runtime.render(emptyIncludedName);
      }
    });
  }

  public async *render(name: string, params: TemplateParams = {}): AsyncIterable<string> {
    const env = new DefaultEnvironment(this, params);
    yield* trimAsyncIterable(this.renderInternal(name, env));
  }

  public async *renderInternal(name: string, environment: Environment): AsyncIterable<string> {
    const template = await this.getTemplate(name);
    yield* environment.process(template.call(environment, environment));
  }

  public getFilter(name: string): RuntimeFilter {
    const fn = this.filters.get(name);
    if (fn === undefined) {
      throw new Error(`Filter '${name}' does not exist.`);
    }
    return fn;
  }

  public registerFilter(name: string, fn: RuntimeFilter, force: boolean = false): void {
    if (!force && this.filters.has(name)) {
      throw new Error(`Filter '${name}' is already registered.`);
    }
    this.filters.set(name, fn);
  }

  public getFunction(name: string): RuntimeFunction {
    const fn = this.functions.get(name);
    if (fn === undefined) {
      throw new Error(`Function '${name}' does not exist.`);
    }
    return fn;
  }

  public registerFunction(name: string, fn: RuntimeFunction, force: boolean = false): void {
    if (!force && this.functions.has(name)) {
      throw new Error(`Function '${name}' is already registered.`);
    }
    this.functions.set(name, fn);
  }

  public aliasInclude(view: string, name: string): void {
    this.registerFunction(name, async function* (env, params): AsyncIterable<string> {
      yield* env.runtime.render(view, params);
    });
  }

  public aliasComponent(view: string, name: string): void {
    this.registerFunction(name, async function* (env, params): AsyncIterable<string> {
      env.beginComponent(view, params);
    });

    this.registerFunction('end' + name, async function* (env): AsyncIterable<string> {
      yield* env.endComponent();
    });
  }

  private async getTemplate(name: string): Promise<CompiledTemplate> {
    if (this._cacheEnabled && this.compiledTemplates.has(name)) {
      const item = this.compiledTemplates.get(name)!;

      if (item.value !== undefined && await item.provider!.isOutdated(name, item.value, item.time)) {
        this.compiledTemplates.delete(name);
      } else {
        return item.promise;
      }
    }

    const promise = (async (): Promise<[TemplateProvider, CompiledTemplate]> => {
      for (const source of this.providers) {
        const compiled = await source.getTemplateCompiledFile(name);
        if (compiled !== undefined) {
          return [source, compiled];
        }
      }

      throw new Error(`Could not find template ${name}`);
    })();

    if (this._cacheEnabled) {
      const item: CompiledTemplateItem = {
        promise: promise.then(([, value]) => value),

        value: undefined,
        time: Date.now(),
      };

      this.compiledTemplates.set(name, item);

      promise.then(([source, value]) => {
        item.provider = source;
        item.value = value;
      });

      // Retry later on error
      promise.catch(() => this.compiledTemplates.delete(name));
    }

    return (await promise)[1];
  }
}
