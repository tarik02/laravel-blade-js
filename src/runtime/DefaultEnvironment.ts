import { Environment, EnvironmentLoop, TemplateParams } from './Environment';
import { Runtime } from './Runtime';

type SectionInfo = {
  readonly renderer: (parent: AsyncIterable<string>) => AsyncIterable<string>;
  readonly isShow: boolean;
};

export class DefaultEnvironment implements Environment {
  public readonly runtime: Runtime;
  public readonly params: TemplateParams;

  private readonly loopsStack: EnvironmentLoop[] = [];
  private readonly sections = new Map<string, SectionInfo>();

  public constructor(runtime: Runtime, params: TemplateParams) {
    this.runtime = runtime;
    this.params = params;
  }

  public print(text: any, escaped: boolean): string {
    let result: string;

    switch (true) {
    case typeof text === 'string' || text instanceof String:
      result = text;
      break;
    case typeof text === 'number' || text instanceof Number:
      result = text.toString();
      break;
    case typeof text === 'boolean' || text instanceof Boolean:
      result = text ? 'true' : 'false';
      break;
    case typeof text === 'undefined':
      result = 'undefined';
      break;
    case typeof text === 'symbol' || text instanceof Symbol:
    case typeof text === 'function' || text instanceof Function:
      result = text.toString();
      break;
    case typeof text === 'object':
    default:
      result = JSON.stringify(text, undefined, '  ');
      break;
    }

    return escaped ? encodeURIComponent(result) : result;
  }

  public async* call(name: string, ...args: any[]): AsyncIterable<string> {
    const fn = this.runtime.getFunction(name);
    yield* fn(this, ...args);
  }

  public async* extends(name: string): AsyncIterable<string> {
    yield* this.runtime.renderInternal(name, this);
  }

  public async* section(
    name: string,
    renderer: ((parent: AsyncIterable<string>) => AsyncIterable<string>) | any,
    isShow: boolean,
  ): void | AsyncIterable<string> {
    // TODO: append

    const print = this.print.bind(this);
    if (this.sections.has(name)) {
      const old = this.sections.get(name)!;

      this.sections.set(name, {
        renderer: typeof renderer === 'string'
          ? async function* () {
            yield print(renderer, true);
          }
          : async function* () {
            yield* old.renderer(renderer());
          }
        ,
        isShow,
      });
    } else {
      this.sections.set(name, {
        renderer: typeof renderer === 'function'
          ? renderer
          : async function* () {
            yield print(renderer, true);
          },
        isShow,
      });
    }

    if (isShow) {
      yield* this.yield(name);
    }
  }

  public async* yield(name: string, def?: string): AsyncIterable<string> {
    const section = this.sections.get(name);
    if (section === undefined) {
      if (def === undefined) {
        throw new Error(`Section '${name}' does not exist.`);
      }

      yield def;
      return '';
    }

    yield* section.renderer((async function* (): AsyncIterable<string> {
      if (def === undefined) {
        throw new Error(`Section '${name}' does not have parent.`);
      }

      yield def;
    })());
  }

  public pushLoop(data: any) {
    let iteratee: ArrayLike<any>;
    let keyRetriever: (index: any) => any;
    let valueRetriever: (index: any) => any;

    if (
      data instanceof Array ||
      data instanceof String ||
      typeof data === 'string'
    ) {
      iteratee = data;
      keyRetriever = index => index;
      valueRetriever = index => data[index];
    } else if (data instanceof Set) {
      iteratee = [...data.values()];
      keyRetriever = index => index;
      valueRetriever = key => iteratee[key];
    } else if (data instanceof Map) {
      iteratee = [...data.keys()];
      keyRetriever = index => iteratee[index];
      valueRetriever = key => data.get(key);
    } else if (typeof data === 'object' && data !== null) {
      iteratee = Object.keys(data);
      keyRetriever = index => iteratee[index];
      valueRetriever = key => data[key];
    } else {
      throw new TypeError(data + ' is not iterable');
    }

    const { loopsStack } = this;
    const loop: EnvironmentLoop = {
      __hasRemaining: iteratee.length !== 0,
      __key: null,
      __value: null,

      iteration: 0,
      index: 0,
      remaining: iteratee.length,
      count: iteratee.length,
      first: true,
      last: iteratee.length === 1,
      odd: false,
      even: true,
      depth: loopsStack.length + 1,
      parent: loopsStack.length === 0 ? undefined : loopsStack[loopsStack.length - 1],

      __next() {
        this.index = this.iteration;
        ++this.iteration;

        this.__hasRemaining = this.index !== this.count;
        this.__key = keyRetriever(this.index);
        this.__value = valueRetriever(this.__key);

        this.remaining = this.count - this.iteration;
        this.first = this.iteration === 1;
        this.last = this.index + 1 === iteratee.length;

        this.odd = !this.odd;
        this.even = !this.even;
      },
    };

    loop.__next();
    loopsStack.push(loop);

    return loop;
  }

  public popLoop() {
    this.loopsStack.pop();
  }
}
