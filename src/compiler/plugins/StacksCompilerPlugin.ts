import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';

export class StacksCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSequence('push', [
      { name: 'endpush', required: true, multiple: false },
    ], (builder, node) => {
      const [prefix, suffix] = node.data[0];
      builder.expectedArgs(prefix, 1);
      builder.expectedArgs(node.ending, 0);

      builder.append('__env.push(');
      builder.append(prefix.args![0]);
      builder.append(', async function *() {');
      builder.compileContainer(suffix);
      builder.append('}, false);');
    });

    compiler.addSequence('prepend', [
      { name: 'endprepend', required: true, multiple: false },
    ], (builder, node) => {
      const [prefix, suffix] = node.data[0];
      builder.expectedArgs(prefix, 1);
      builder.expectedArgs(node.ending, 0);

      builder.append('__env.push(');
      builder.append(prefix.args![0]);
      builder.append(', async function *() {');
      builder.compileContainer(suffix);
      builder.append('}, true);');
    });

    compiler.addFunction('stack', (builder, node) => {
      builder.expectedArgs(node, 1);

      builder.append('yield* __env.stack(');
      builder.append(node.args![0]);
      builder.append(');');
    });
  }
}
