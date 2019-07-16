import { Compiler } from '../compiler/Compiler';
import { isNotEmptyContainer, NodeContainer } from '../parser/Node';
import { CompilerPlugin } from './CompilerPlugin';

export class ConditionalsCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSequence('if', [
      { name: 'elseif', required: false, multiple: true },
      { name: 'else', required: false, multiple: false },
      { name: 'endif', required: true, multiple: false },
    ], (delegate, node) => {
      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'if':
          delegate.expectedArgs(prefix, 1);
          delegate.append('if (');
          delegate.append(prefix.args![0]);
          delegate.append(') {\n');
          break;
        case 'elseif':
          delegate.expectedArgs(prefix, 1);
          delegate.append('} else if (');
          delegate.append(prefix.args![0]);
          delegate.append(') {\n');
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

    compiler.addSequence('unless', [
      { name: 'endunless', required: true, multiple: false },
    ], (delegate, node) => {
      const [prefix, suffix] = node.data[0];
      delegate.expectedArgs(prefix, 1);
      delegate.expectedArgs(node.ending, 0);

      delegate.append('if (!(');
      delegate.append(prefix.args![0]);
      delegate.append(')) {\n');
      delegate.compileContainer(suffix);
      delegate.append('}');
    });

    compiler.addSequence('switch', [
      { name: 'case', required: false, multiple: true },
      { name: 'break', required: false, multiple: true },
      { name: 'default', required: false, multiple: false },
      { name: 'break', required: false, multiple: false },
      { name: 'endswitch', required: true, multiple: false },
    ], (delegate, node) => {
      let lastSuffix: NodeContainer | undefined;

      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'switch':
          delegate.expectedArgs(prefix, 1);
          delegate.append('switch (');
          delegate.append(prefix.args![0]);
          delegate.append(') {\n');

          if (isNotEmptyContainer(suffix)) {
            return delegate.error('unexpected content between @case/@default and @break', suffix);
          }
          break;
        case 'case':
          delegate.expectedArgs(prefix, 1);
          delegate.append('case (');
          delegate.append(prefix.args![0]);
          delegate.append('):\n');

          if (isNotEmptyContainer(lastSuffix)) {
            return delegate.error('unexpected content between @case/@default and @break', lastSuffix);
          }
          break;
        case 'break':
          delegate.expectedArgs(prefix, 0);

          if (lastSuffix === undefined) {
            return delegate.error('unexpected break', prefix);
          }
          delegate.append('{\n');
          delegate.compileNode(lastSuffix);
          delegate.append('} break;\n');

          if (isNotEmptyContainer(suffix)) {
            return delegate.error('unexpected content between @case/@default and @break', suffix);
          }
          break;
        case 'default':
          delegate.expectedArgs(prefix, 0);
          delegate.append('default:\n');
          break;
        }
        lastSuffix = suffix;
      }

      if (lastSuffix !== undefined) {
        delegate.append('{\n');
        delegate.compileNode(lastSuffix);
        delegate.append('} break;\n');
      }

      delegate.expectedArgs(node.ending, 0);
      delegate.append('}');
      return undefined;
    });
  }
}
