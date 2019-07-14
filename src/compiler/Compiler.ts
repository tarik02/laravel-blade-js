import { createStringBuilder, StringBuilder } from '../string/StringBuilder';
import { Source } from '../types/Source';
import { CharStream } from './CharStream';
import { CompilerError } from './CompilerError';
import { CompilerPlugin } from './CompilerPlugin';
import { FunctionBuilder } from './FunctionBuilder';
import { createLexer } from './Lexer';
import {
  BaseFunction,
  Node,
  NodeComment,
  NodeContainer,
  NodeData,
  NodeFunction,
  NodeRawFunction,
  NodeSequence,
  NodeText,
} from './Node';
import { parse, ParserSequenceConfig } from './Parser';
import { ConditionalsCompilerPlugin } from './plugins/ConditionalsCompilerPlugin';
import { IncludesCompilerPlugin } from './plugins/IncludesCompilerPlugin';
import { JsBlockCompilerPlugin } from './plugins/JsBlockCompilerPlugin';
import { JsonCompilerPlugin } from './plugins/JsonCompilerPlugin';
import { LayoutCompilerPlugin } from './plugins/LayoutCompilerPlugin';
import { LoopsCompilerPlugin } from './plugins/LoopsCompilerPlugin';
import { StacksCompilerPlugin } from './plugins/StacksCompilerPlugin';
import { ScopedPosition } from './ScopedPosition';

export type NodeCompiler<T extends Node> = (builder: FunctionBuilder, node: T) => void;
export type FunctionCompiler = NodeCompiler<NodeFunction>;
export type SequenceCompiler = NodeCompiler<NodeSequence>;
export type RawFunctionCompiler = NodeCompiler<NodeRawFunction>;

export class Compiler {
  private builder!: StringBuilder;
  private footerBuilder!: StringBuilder;

  private functions: { [name: string]: FunctionCompiler } = {};
  private sequences: { [name: string]: SequenceCompiler } = {};
  private rawFunctions: { [name: string]: RawFunctionCompiler } = {};

  private parserSequences: { [name: string]: ParserSequenceConfig } = {};

  private functionBuilder: FunctionBuilder = {
    append: arg => this.builder.append(arg),
    footer: {
      append: arg => this.footerBuilder.append(arg),
    },

    compileContainer: this.compileContainer.bind(this),
    compileComment: this.compileComment.bind(this),
    compileText: this.compileText.bind(this),
    compileData: this.compileData.bind(this),
    compileFunction: this.compileFunction.bind(this),
    compileRawFunction: this.compileRawFunction.bind(this),
    compileSequence: this.compileSequence.bind(this),
    compileNode: this.compileNode.bind(this),

    error: this.error.bind(this),

    expectedArgs: (node: Node & BaseFunction, min: number, max: number = min): never | void => {
      const argsCount = node.args !== undefined ? node.args.length : 0;
      if (argsCount < min || argsCount > max) {
        const expected = min === max
          ? (min === 1 ? `1 argument` : `${min} arguments`)
          : `${min}-${max} arguments`
        ;
        throw this.error(`expected ${expected}, got ${argsCount}`, node, {
          start: node.start.relative(1 + node.name.length),
          end: node.end,
        });
      }
    },
  };

  public addPlugin(cons: new () => CompilerPlugin): void {
    const plugin = new cons();
    plugin.init(this);
  }

  public addFunction(name: string, compiler: FunctionCompiler): void {
    this.functions[name] = compiler;
  }

  public addSimpleFunction(name: string, min: number, max: number = min): void {
    this.addFunction(name, (builder, node) => {
      builder.expectedArgs(node, min, max);

      const args = node.args || [];
      builder.append('yield* __env.call(');
      builder.append(JSON.stringify(node.name));
      builder.append(', ');
      builder.append(args.join(', '));
      builder.append(');\n');
    });
  }

  public addSequence(name: string, config: ParserSequenceConfig, compiler: SequenceCompiler): void {
    this.sequences[name] = compiler;
    this.parserSequences[name] = config;
  }

  public addRawFunction(name: string, compiler: RawFunctionCompiler): void {
    this.rawFunctions[name] = compiler;
  }

  public addDefaults(): void {
    this.addPlugin(ConditionalsCompilerPlugin);
    this.addPlugin(IncludesCompilerPlugin);
    this.addPlugin(JsBlockCompilerPlugin);
    this.addPlugin(JsonCompilerPlugin);
    this.addPlugin(LayoutCompilerPlugin);
    this.addPlugin(LoopsCompilerPlugin);
    this.addPlugin(StacksCompilerPlugin);
  }

  public compile(source: Source): string {
    this.builder = createStringBuilder();
    this.footerBuilder = createStringBuilder();

    const stream = new CharStream(source);
    const lexer = createLexer(stream, {
      rawFunctions: Object.keys(this.rawFunctions),
    });
    const node = parse(lexer, {
      sequences: this.parserSequences,
    });

    this.builder.append('(async function *(__env) {\n');
    this.builder.append('  with (__env.params) {\n');
    this.compileNode(node);
    this.footerBuilder.append('  }\n');
    this.footerBuilder.append('})');

    return this.builder.build() + this.footerBuilder.build();
  }

  protected compileContainer(node: NodeContainer): void {
    for (const sub of node.children) {
      this.compileNode(sub);
    }
  }

  protected compileComment(node: NodeComment): void {
    // TODO: emitComments config
    this.builder.append('/*');
    this.builder.append(node.value.replace('*/', '* /'));
    this.builder.append('*/\n');
  }

  protected compileText(node: NodeText): void {
    this.builder.append('yield ');
    this.builder.append(JSON.stringify(node.value));
    this.builder.append(';\n');
  }

  protected compileData(node: NodeData): void {
    this.builder.append('yield __env.print(');
    this.builder.append(node.value);
    this.builder.append(', ');
    this.builder.append(JSON.stringify(node.escaped));
    this.builder.append(');\n');
  }

  protected compileFunction(node: NodeFunction): void {
    const fn = this.functions[node.name];

    if (fn === undefined) {
      const args = node.args || [];
      this.builder.append('yield* __env.call(');
      this.builder.append(JSON.stringify(node.name));
      this.builder.append(', ');
      this.builder.append(args.join(', '));
      this.builder.append(');\n');
    } else {
      fn(this.functionBuilder, node);
      this.builder.append('\n');
    }
  }

  protected compileRawFunction(node: NodeRawFunction): void {
    const fn = this.rawFunctions[node.name];

    if (fn === undefined) {
      throw this.error(`Unknown function ${node.name}`, node, {
        start: node.start.relative(1),
        end: node.start.relative(1 + node.name.length),
      });
    }

    fn(this.functionBuilder, node);
    this.builder.append('\n');
  }

  protected compileSequence(node: NodeSequence): void {
    const name =
      node.data[0]
        ? node.data[0][0].name
        : node.ending.name
    ;
    const fn = this.sequences[name];

    if (fn === undefined) {
      throw this.error(`Unknown function ${name}`, node, {
        start: node.start.relative(1),
        end: node.start.relative(1 + name.length),
      });
    }

    fn(this.functionBuilder, node);
    this.builder.append('\n');
  }

  protected compileNode(node: Node): void {
    switch (node.type) {
    case 'container':
      this.compileContainer(node);
      break;
    case 'comment':
      this.compileComment(node);
      break;
    case 'text':
      this.compileText(node);
      break;
    case 'data':
      this.compileData(node);
      break;
    case 'function':
      this.compileFunction(node);
      break;
    case 'raw-function':
      this.compileRawFunction(node);
      break;
    case 'sequence':
      this.compileSequence(node);
      break;
    }
  }

  protected error(
    message: string,
    node: Node,
    position?: Partial<ScopedPosition>,
  ): never {
    throw new CompilerError(node.start.source, {
      start: position && position.start || node.start,
      end: position && position.end || node.end,
    }, message);
  }
}
