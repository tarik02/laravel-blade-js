import { Environment } from '../environment/Environment';

export type RuntimeFilter = (env: Environment, source: any, ...args: any[]) => PromiseLike<string> | string;
