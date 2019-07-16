import { Environment } from '../environment/Environment';

export type CompiledTemplate = (this: Environment, env: Environment) => AsyncIterable<string>;
