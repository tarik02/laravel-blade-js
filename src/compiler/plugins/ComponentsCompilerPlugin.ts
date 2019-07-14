import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';
import { isNotEmptyContainer } from '../Node';

export class ComponentsCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSequence('component', [
      { name: ['slot', 'endslot'], required: false, multiple: true },
      { name: 'endcomponent', required: true, multiple: false },
    ], (builder, node) => {
      builder.expectedArgs(node.ending, 0);

      let isSlot = false;
      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'component':
          builder.expectedArgs(prefix, 1, 2);
          builder.append('__env.beginComponent(');
          builder.append(prefix.args!.join(', '));
          builder.append(');\n');
          break;
        case 'slot':
          if (isSlot) {
            return builder.error('expected @endslot before @slot', prefix, {
              start: prefix.start,
              end: prefix.start.relative(1 + prefix.name.length),
            });
          }
          isSlot = true;

          builder.expectedArgs(prefix, 1);
          builder.append('__env.beginSlot(');
          builder.append(prefix.args![0]);
          builder.append(');\n');
          break;
        case 'endslot':
          if (!isSlot) {
            return builder.error('expected @slot before @endslot', prefix, {
              start: prefix.start,
              end: prefix.start.relative(1 + prefix.name.length),
            });
          }
          isSlot = false;

          builder.expectedArgs(prefix, 0);
          builder.append('__env.endSlot();\n');
          break;
        }

        if (isNotEmptyContainer(suffix)) {
          builder.compileContainer(suffix);
        }
      }

      builder.append('yield* __env.endComponent();');
      return undefined;
    });

    compiler.addSequence('slot', [
      { name: 'endslot', required: true, multiple: false },
    ], (builder, node) => {
      const [prefix, suffix] = node.data[0];
      builder.expectedArgs(prefix, 0, 1);
      builder.expectedArgs(node.ending, 0);

      builder.append('__env.beginSlot(');
      builder.append(prefix.args![0]);
      builder.append(');\n');
      builder.compileContainer(suffix);
      builder.append('__env.endSlot();\n');
    });
  }
}
