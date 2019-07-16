import { Compiler } from '../compiler/Compiler';
import { CompilerPlugin } from './CompilerPlugin';

export class StacksCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSequence('push', [
      { name: 'endpush', required: true, multiple: false },
    ], (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      delegate.expectedArgs(prefix, 1);
      delegate.expectedArgs(node.ending, 0);

      delegate.append('__env.push(');
      delegate.append(prefix.args![0]);
      delegate.append(', async function *() {');
      delegate.compileContainer(suffix);
      delegate.append('}, false);');
    });

    compiler.addSequence('prepend', [
      { name: 'endprepend', required: true, multiple: false },
    ], (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      delegate.expectedArgs(prefix, 1);
      delegate.expectedArgs(node.ending, 0);

      delegate.append('__env.push(');
      delegate.append(prefix.args![0]);
      delegate.append(', async function *() {');
      delegate.compileContainer(suffix);
      delegate.append('}, true);');
    });

    compiler.addFunction('stack', (delegate, node) => {
      delegate.expectedArgs(node, 1);

      delegate.append('yield* __env.stack(');
      delegate.append(node.args![0]);
      delegate.append(');');
    });
  }
}
