import { Compiler, SequenceCompiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';

export class LoopsCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addFunction('break', (builder, node) => {
      builder.expectedArgs(node, 0, 1);

      if (node.args && node.args.length === 1) {
        builder.append('if (');
        builder.append(node.args[0]);
        builder.append(') break;');
      } else {
        builder.append('break;');
      }
    });

    compiler.addFunction('continue', (builder, node) => {
      builder.expectedArgs(node, 0, 1);

      if (node.args && node.args.length === 1) {
        builder.append('if (');
        builder.append(node.args[0]);
        builder.append(') continue;');
      } else {
        builder.append('continue;');
      }
    });

    compiler.addSequence('for', [
      { name: 'endfor', required: true, multiple: false },
    ], (builder, node) => {
      const [prefix, suffix] = node.data[0];
      builder.expectedArgs(prefix, 1, Infinity);
      builder.expectedArgs(node.ending, 0);

      builder.append('for (');
      builder.append(prefix.args!.join(', '));
      builder.append(') {\n');
      builder.compileContainer(suffix);
      builder.append('}');
    });

    const foreachCompiler: SequenceCompiler = (builder, node) => {
      const [prefix, suffix] = node.data[0];
      const hasEmpty = node.data.length === 2;
      builder.expectedArgs(prefix, 1, Infinity);
      builder.expectedArgs(node.ending, 0);
      if (hasEmpty) {
        builder.expectedArgs(node.data[1][0], 0);
      }

      const args = prefix.args!.join(', ');
      const matches = args.match(/^\s*(.+)\s+as\s+(?:([$\w]+)\s*=>\s*)?([$\w]+)\s*$/);
      if (matches === null) {
        return builder.error(
          `foreach body should have format 'iteratee as value' or 'iteratee as key => value'`,
          node,
          {
            start: prefix.start.relative(1 + prefix.name.length),
            end: prefix.end,
          },
        );
      }

      const [, v_iteratee, v_key, v_value] = matches;

      if (hasEmpty) {
        // TODO: Fix redeclare
        builder.append('let __empty = true;\n');
      }
      builder.append('for (const loop = __env.pushLoop(');
      builder.append(v_iteratee);
      builder.append('); loop.__hasRemaining; loop.__next()) {\n');
      if (hasEmpty) {
        builder.append('__empty = false;\n');
      }
      if (v_key !== null) {
        builder.append('const ');
        builder.append(v_key);
        builder.append(' = loop.__key;\n');
      }
      builder.append('const ');
      builder.append(v_value);
      builder.append(' = loop.__value;\n');
      builder.compileContainer(suffix);
      builder.append('}\n');
      builder.append('__env.popLoop();');
      if (hasEmpty) {
        builder.append('\nif (__empty) {\n');
        builder.compileContainer(node.data[1][1]);
        builder.append('}');
      }
      return undefined;
    };

    compiler.addSequence('foreach', [
      { name: 'endforeach', required: true, multiple: false },
    ], foreachCompiler);

    compiler.addSequence('forelse', [
      { name: 'empty', required: true, multiple: false },
      { name: 'endforelse', required: true, multiple: false },
    ], foreachCompiler);

    compiler.addSequence('while', [
      { name: 'endwhile', required: true, multiple: false },
    ], (builder, node) => {
      const [prefix, suffix] = node.data[0];
      builder.expectedArgs(prefix, 1, Infinity);
      builder.expectedArgs(node.ending, 0);

      builder.append('while (');
      builder.append(prefix.args!.join(', '));
      builder.append(') {\n');
      builder.compileContainer(suffix);
      builder.append('}');
    });
  }
}
