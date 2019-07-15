import { Compiler, SequenceCompiler } from '../compiler/Compiler';
import { CompilerPlugin } from './CompilerPlugin';

export class LoopsCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addFunction('break', (delegate, node) => {
      delegate.expectedArgs(node, 0, 1);

      if (node.args && node.args.length === 1) {
        delegate.append('if (');
        delegate.append(node.args[0]);
        delegate.append(') break;');
      } else {
        delegate.append('break;');
      }
    });

    compiler.addFunction('continue', (delegate, node) => {
      delegate.expectedArgs(node, 0, 1);

      if (node.args && node.args.length === 1) {
        delegate.append('if (');
        delegate.append(node.args[0]);
        delegate.append(') continue;');
      } else {
        delegate.append('continue;');
      }
    });

    compiler.addSequence('for', [
      { name: 'endfor', required: true, multiple: false },
    ], (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      delegate.expectedArgs(prefix, 1, Infinity);
      delegate.expectedArgs(node.ending, 0);

      delegate.append('for (');
      delegate.append(prefix.args!.join(', '));
      delegate.append(') {\n');
      delegate.compileContainer(suffix);
      delegate.append('}');
    });

    const foreachCompiler: SequenceCompiler = (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      const hasEmpty = node.data.length === 2;
      delegate.expectedArgs(prefix, 1, Infinity);
      delegate.expectedArgs(node.ending, 0);
      if (hasEmpty) {
        delegate.expectedArgs(node.data[1][0], 0);
      }

      const args = prefix.args!.join(', ');
      const matches = args.match(/^\s*(.+)\s+as\s+(?:([$\w]+)\s*=>\s*)?([$\w]+)\s*$/);
      if (matches === null) {
        return delegate.error(
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
        delegate.append('let __empty = true;\n');
      }
      delegate.append('for (const loop = __env.pushLoop(');
      delegate.append(v_iteratee);
      delegate.append('); loop.__hasRemaining; loop.__next()) {\n');
      if (hasEmpty) {
        delegate.append('__empty = false;\n');
      }
      if (v_key !== null) {
        delegate.append('const ');
        delegate.append(v_key);
        delegate.append(' = loop.__key;\n');
      }
      delegate.append('const ');
      delegate.append(v_value);
      delegate.append(' = loop.__value;\n');
      delegate.compileContainer(suffix);
      delegate.append('}\n');
      delegate.append('__env.popLoop();');
      if (hasEmpty) {
        delegate.append('\nif (__empty) {\n');
        delegate.compileContainer(node.data[1][1]);
        delegate.append('}');
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
    ], (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      delegate.expectedArgs(prefix, 1, Infinity);
      delegate.expectedArgs(node.ending, 0);

      delegate.append('while (');
      delegate.append(prefix.args!.join(', '));
      delegate.append(') {\n');
      delegate.compileContainer(suffix);
      delegate.append('}');
    });
  }
}
