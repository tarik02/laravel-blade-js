import { Compiler } from '../compiler/Compiler';
import { CompilerPlugin } from './CompilerPlugin';

export class LayoutCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addFunction('extends', (delegate, node) => {
      delegate.expectedArgs(node, 1);

      delegate.footer.append('yield* __env.extends(');
      delegate.footer.append(node.args!.join(', '));
      delegate.footer.append(');\n');
    });

    compiler.addSequence('section', (args?: ReadonlyArray<string>) => (
      !args || args.length === 1
        ? [
          { name: 'parent', required: false, multiple: false },
          { name: ['show', 'endsection'], required: true, multiple: false },
        ]
        : []
    ), (delegate, node) => {
      if (node.data.length === 0) {
        const ending = node.ending;
        delegate.expectedArgs(ending, 2);

        delegate.append('yield* ');
        delegate.append('__env.section(');
        delegate.append(ending.args!.join(', '));
        delegate.append(');');
      } else {
        const isShow = node.ending.name === 'show';
        const starting = node.data[0][0];
        delegate.expectedArgs(starting, 1);

        // if (isShow) {
        delegate.append('yield* ');
        // }
        delegate.append('__env.section(');
        delegate.append(starting.args![0]);
        delegate.append(', async function *(__parent) {\n');
        for (const [prefix, suffix] of node.data) {
          if (prefix.name === 'parent') {
            delegate.append('yield* __parent;\n');
          }
          delegate.compileContainer(suffix);
        }
        delegate.append('}, ');
        delegate.append(JSON.stringify(isShow));
        delegate.append(');');
      }
    });

    compiler.addSequence('hasSection', [
      { name: 'else', required: false, multiple: false },
      { name: 'endif', required: true, multiple: false },
    ], (delegate, node) => {
      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'hasSection':
          delegate.expectedArgs(prefix, 1);
          delegate.append('if (__env.hasSection(');
          delegate.append(prefix.args![0]);
          delegate.append(')) {\n');
          break;
        case 'else':
          delegate.expectedArgs(prefix, 0);
          delegate.append('} else {\n');
          break;
        }

        delegate.compileNode(suffix);
      }

      delegate.expectedArgs(node.ending, 0);
      delegate.append('}');
    });

    compiler.addFunction('yield', (delegate, node) => {
      delegate.expectedArgs(node, 1, 2);

      delegate.append('yield* __env.yield(');
      delegate.append(node.args!.join(', '));
      delegate.append(');');
    });
  }
}
