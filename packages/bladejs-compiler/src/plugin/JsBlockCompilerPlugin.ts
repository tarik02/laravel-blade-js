import { Compiler } from '../compiler/Compiler';
import { CompilerPlugin } from './CompilerPlugin';

export class JsBlockCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addRawFunction('js', (delegate, node) => {
      delegate.expectedArgs(node, 0);
      delegate.append(node.content);
    });
  }
}
