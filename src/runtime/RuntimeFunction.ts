import { Environment } from './Environment';

export type RuntimeFunction = (env: Environment, ...args: any[]) => AsyncIterable<string>;
