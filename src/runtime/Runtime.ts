import { DefaultEnvironment } from './DefaultEnvironment';
import { Environment, TemplateParams } from './Environment';
import { TemplateSource } from './TemplateSource';
import { trimAsyncIterable } from './trimAsyncIterable';

export type CompiledTemplate = (env: Environment) => AsyncIterable<string>;

export class Runtime {
  private readonly sources: ReadonlyArray<TemplateSource>;
  private readonly compiledTemplates = new Map<string, Promise<CompiledTemplate>>();

  public constructor(sources: ReadonlyArray<TemplateSource>) {
    this.sources = sources;
  }

  public async *render(name: string, params?: TemplateParams): AsyncIterable<string> {
    const env = new DefaultEnvironment(this, params || {});
    yield* trimAsyncIterable(this.renderInternal(name, env));
  }

  public async *renderInternal(name: string, environment: Environment): AsyncIterable<string> {
    const template = await this.getTemplate(name);
    yield* template(environment);
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
        if (compiled === undefined) {
          continue;
        }

        return (new Function('__env', 'return ' + compiled + '(__env)')) as CompiledTemplate;
      }

      throw new Error(`Could not find template ${name}`);
    })();

    this.compiledTemplates.set(name, promise);

    // Retry later on error
    promise.catch(() => this.compiledTemplates.delete(name));

    return promise;
  }
}
