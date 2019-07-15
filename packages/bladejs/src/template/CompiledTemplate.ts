import { Environment } from '../environment/Environment';

export type CompiledTemplate = (env: Environment) => AsyncIterable<string>;
