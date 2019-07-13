import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';

export class JsBlockCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addRawFunction('js', (builder, node) => {
      builder.expectedArgs(node, 0);
      builder.append(node.content);
    });
  }
}
