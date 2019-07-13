import { Compiler } from '../Compiler';
import { CompilerPlugin } from '../CompilerPlugin';
import { isNotEmptyContainer, NodeContainer } from '../Node';

export class ConditionalsCompilerPlugin implements CompilerPlugin {
  public init(compiler: Compiler): void {
    compiler.addSequence('if', [
      { name: 'elseif', required: false, multiple: true },
      { name: 'else', required: false, multiple: false },
      { name: 'endif', required: true, multiple: false },
    ], (builder, node) => {
      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'if':
          builder.expectedArgs(prefix, 1);
          builder.append('if (');
          builder.append(prefix.args![0]);
          builder.append(') {\n');
          break;
        case 'elseif':
          builder.expectedArgs(prefix, 1);
          builder.append('} else if (');
          builder.append(prefix.args![0]);
          builder.append(') {\n');
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

    compiler.addSequence('unless', [
      { name: 'endunless', required: true, multiple: false },
    ], (builder, node) => {
      const [prefix, suffix] = node.data[0];
      builder.expectedArgs(prefix, 1);
      builder.expectedArgs(node.ending, 0);

      builder.append('if (!(');
      builder.append(prefix.args![0]);
      builder.append(')) {\n');
      builder.compileContainer(suffix);
      builder.append('}');
    });

    compiler.addSequence('switch', [
      { name: 'case', required: false, multiple: true },
      { name: 'break', required: false, multiple: true },
      { name: 'default', required: false, multiple: false },
      { name: 'break', required: false, multiple: false },
      { name: 'endswitch', required: true, multiple: false },
    ], (builder, node) => {
      let lastSuffix: NodeContainer | undefined;

      for (const [prefix, suffix] of node.data) {
        switch (prefix.name) {
        case 'switch':
          builder.expectedArgs(prefix, 1);
          builder.append('switch (');
          builder.append(prefix.args![0]);
          builder.append(') {\n');

          if (isNotEmptyContainer(suffix)) {
            return builder.error('unexpected content between @case/@default and @break', suffix);
          }
          break;
        case 'case':
          builder.expectedArgs(prefix, 1);
          builder.append('case (');
          builder.append(prefix.args![0]);
          builder.append('):\n');

          if (isNotEmptyContainer(lastSuffix)) {
            return builder.error('unexpected content between @case/@default and @break', lastSuffix);
          }
          break;
        case 'break':
          builder.expectedArgs(prefix, 0);

          if (lastSuffix === undefined) {
            return builder.error('unexpected break', prefix);
          }
          builder.append('{\n');
          builder.compileNode(lastSuffix);
          builder.append('} break;\n');

          if (isNotEmptyContainer(suffix)) {
            return builder.error('unexpected content between @case/@default and @break', suffix);
          }
          break;
        case 'default':
          builder.expectedArgs(prefix, 0);
          builder.append('default:\n');
          break;
        }
        lastSuffix = suffix;
      }

      if (lastSuffix !== undefined) {
        builder.append('{\n');
        builder.compileNode(lastSuffix);
        builder.append('} break;\n');
      }

      builder.expectedArgs(node.ending, 0);
      builder.append('}');
      return undefined;
    });
  }
}
