import { Compiler } from '../compiler/Compiler';
import { CompilerPlugin } from './CompilerPlugin';

export class JsonCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addFunction('json', (delegate, node) => {
      delegate.expectedArgs(node, 1, 3);

      delegate.append('yield JSON.stringify(');
      delegate.append(node.args!.join(', '));
      delegate.append(');');
    });
  }
}
