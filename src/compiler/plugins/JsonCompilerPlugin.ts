import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';

export class JsonCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addFunction('json', (builder, node) => {
      builder.expectedArgs(node, 1, 3);

      builder.append('yield JSON.stringify(');
      builder.append(node.args!.join(', '));
      builder.append(');');
    });
  }
}
