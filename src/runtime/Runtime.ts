import './asyncIterator';
import { DefaultEnvironment } from './DefaultEnvironment';
import { Environment, TemplateParams } from './Environment';
import { RuntimeFunction } from './RuntimeFunction';
import { TemplateSource } from './TemplateSource';
import { trimAsyncIterable } from './trimAsyncIterable';

export type CompiledTemplate = (env: Environment) => AsyncIterable<string>;

export class Runtime {
  private readonly sources: ReadonlyArray<TemplateSource>;
  private readonly compiledTemplates = new Map<string, Promise<CompiledTemplate>>();
  private readonly functions = new Map<string, RuntimeFunction>();

  public constructor(sources: ReadonlyArray<TemplateSource>) {
    this.sources = sources;

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
    yield* template(environment);
  }

  public getFunction(name: string): RuntimeFunction {
    const fn = this.functions.get(name);
    if (fn === undefined) {
      throw new Error(`Function '${name}' does not exist.`);
    }
    return fn;
  }

  public registerFunction(name: string, fn: RuntimeFunction): void {
    if (this.functions.has(name)) {
      throw new Error(`Function '${name}' is already registered.`);
    }
    this.functions.set(name, fn);
  }

  public aliasInclude(view: string, name: string): void {
    this.registerFunction(name, async function* (env, params): AsyncIterable<string> {
      yield* env.runtime.render(view, params);
    });
  }

  private getTemplate(name: string): Promise<CompiledTemplate> {
    // TODO: An ability to disable cache
    // TODO: An ability to check modified time and reload compiled template

    if (this.compiledTemplates.has(name)) {
      return this.compiledTemplates.get(name)!;
    }

    const promise = (async () => {
      for (const source of this.sources) {
        const compiled = await source.getTemplateCompiledFile(name);
        if (compiled !== undefined) {
          return compiled;
        }
      }

      throw new Error(`Could not find template ${name}`);
    })();

    this.compiledTemplates.set(name, promise);

    // Retry later on error
    promise.catch(() => this.compiledTemplates.delete(name));

    return promise;
  }
}
