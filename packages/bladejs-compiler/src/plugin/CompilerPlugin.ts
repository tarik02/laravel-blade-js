import { Compiler } from '../compiler/Compiler';

export interface CompilerPlugin {
  init(compiler: Compiler): void;
}
