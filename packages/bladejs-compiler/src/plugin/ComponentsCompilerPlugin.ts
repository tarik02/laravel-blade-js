import { Compiler } from '../compiler/Compiler';
import { isNotEmptyContainer } from '../parser/Node';
import { CompilerPlugin } from './CompilerPlugin';

export class ComponentsCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSequence('component', [
      { name: ['slot', 'endslot'], required: false, multiple: true },
      { name: 'endcomponent', required: true, multiple: false },
    ], (delegate, node) => {
      delegate.expectedArgs(node.ending, 0);

      let isSlot = false;
      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'component':
          delegate.expectedArgs(prefix, 1, 2);
          delegate.append('__env.beginComponent(');
          delegate.append(prefix.args!.join(', '));
          delegate.append(');\n');
          break;
        case 'slot':
          if (isSlot) {
            return delegate.error('expected @endslot before @slot', prefix, {
              start: prefix.start,
              end: prefix.start.relative(1 + prefix.name.length),
            });
          }
          isSlot = true;

          delegate.expectedArgs(prefix, 1);
          delegate.append('__env.beginSlot(');
          delegate.append(prefix.args![0]);
          delegate.append(');\n');
          break;
        case 'endslot':
          if (!isSlot) {
            return delegate.error('expected @slot before @endslot', prefix, {
              start: prefix.start,
              end: prefix.start.relative(1 + prefix.name.length),
            });
          }
          isSlot = false;

          delegate.expectedArgs(prefix, 0);
          delegate.append('__env.endSlot();\n');
          break;
        }

        if (isNotEmptyContainer(suffix)) {
          delegate.compileContainer(suffix);
        }
      }

      delegate.append('yield* __env.endComponent();');
      return undefined;
    });

    compiler.addSequence('slot', [
      { name: 'endslot', required: true, multiple: false },
    ], (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      delegate.expectedArgs(prefix, 0, 1);
      delegate.expectedArgs(node.ending, 0);

      delegate.append('__env.beginSlot(');
      delegate.append(prefix.args![0]);
      delegate.append(');\n');
      delegate.compileContainer(suffix);
      delegate.append('__env.endSlot();\n');
    });
  }
}
