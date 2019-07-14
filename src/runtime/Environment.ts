import { Runtime } from './Runtime';

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

  print(text: any, escaped: boolean): string;

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
}
