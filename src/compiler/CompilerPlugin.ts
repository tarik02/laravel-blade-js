import { Compiler } from './Compiler';

export interface CompilerPlugin {
  init(compiler: Compiler): void;
}
