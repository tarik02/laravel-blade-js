import { Runtime } from '../runtime/Runtime';

export type TemplateParams = {
  [key: string]: any;
};

export interface EnvironmentLoop {
  __hasRemaining: boolean;
  __key: any;
  __value: any;
  __next(): void;

  iteration: number;
  index: number;
  remaining: number;
  count: number;
  first: boolean;
  last: boolean;
  odd: boolean;
  even: boolean;
  depth: number;
  parent?: EnvironmentLoop;
}

export interface Environment {
  readonly runtime: Runtime;
  readonly params: TemplateParams;

  process(input: AsyncIterable<string>): AsyncIterable<string>;

  print(text: any, escaped: boolean): AsyncIterable<string>;

  filter(text: any, name: string, ...args: any[]): PromiseLike<string> | string;

  call(name: string, ...args: any[]): AsyncIterable<string>;

  extends(parent: string): AsyncIterable<string>;

  section(
    name: string,
    renderer: ((parent: AsyncIterable<string>) => AsyncIterable<string>) | any,
    isShow: boolean,
  ): void | AsyncIterable<string>;

  yield(name: string, def?: string): string | string[] | AsyncIterable<string>;

  pushLoop(iteratee: any): EnvironmentLoop;
  popLoop(): void;

  push(name: string, renderer: () => AsyncIterable<string>, prepend?: boolean): void;
  stack(name: string): AsyncIterable<string>;

  beginComponent(name: string, args?: TemplateParams): void;
  endComponent(): AsyncIterable<string>;

  beginSlot(name: string): void;
  endSlot(): void;
}
