import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';

export class IncludesCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSimpleFunction('include', 1, 2);
    compiler.addSimpleFunction('includeIf', 1, 2);
    compiler.addSimpleFunction('includeWhen', 2, 3);
    compiler.addSimpleFunction('includeFirst', 1, 2);

    compiler.addSimpleFunction('each', 3, 4);
  }
}
