import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';

export class LayoutCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addFunction('extends', (builder, node) => {
      builder.expectedArgs(node, 1);

      builder.append('yield __env.extends(');
      builder.append(node.args!.join(', '));
      builder.append(');');
    });

    compiler.addSequence('section', (args?: ReadonlyArray<string>) => (
      !args || args.length === 1
        ? [
          { name: 'parent', required: false, multiple: false },
          { name: ['show', 'endsection'], required: true, multiple: false },
        ]
        : []
    ), (builder, node) => {
      if (node.data.length === 0) {
        const ending = node.ending;
        builder.expectedArgs(ending, 2);

        builder.append('__env.section(');
        builder.append(ending.args!.join(', '));
        builder.append(');');
      } else {
        const isShow = node.ending.name === 'show';
        const starting = node.data[0][0];
        builder.expectedArgs(starting, 1);

        if (isShow) {
          builder.append('yield* ');
        }
        builder.append('__env.section(');
        builder.append(starting.args![0]);
        builder.append(', async function *(__parent) {\n');
        for (const [prefix, suffix] of node.data) {
          if (prefix.name === 'parent') {
            builder.append('yield* __parent();\n');
          }
          builder.compileContainer(suffix);
        }
        builder.append('}, ');
        builder.append(JSON.stringify(isShow));
        builder.append(');');
      }
    });

    compiler.addSequence('hasSection', [
      { name: 'else', required: false, multiple: false },
      { name: 'endif', required: true, multiple: false },
    ], (builder, node) => {
      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'hasSection':
          builder.expectedArgs(prefix, 1);
          builder.append('if (__env.hasSection(');
          builder.append(prefix.args![0]);
          builder.append(')) {\n');
          break;
        case 'else':
          builder.expectedArgs(prefix, 0);
          builder.append('} else {\n');
          break;
        }

        builder.compileNode(suffix);
      }

      builder.expectedArgs(node.ending, 0);
      builder.append('}');
    });

    compiler.addFunction('yield', (builder, node) => {
      builder.expectedArgs(node, 1, 2);

      builder.append('yield __env.yield(');
      builder.append(node.args!.join(', '));
      builder.append(');');
    });
  }
}
