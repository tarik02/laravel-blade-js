import {
  BaseFunction,
  Node,
  NodeComment,
  NodeContainer,
  NodeData,
  NodeFunction,
  NodePosition,
  NodeRawFunction, NodeSequence,
  NodeText
} from './Node';

export interface FunctionBuilder {
  append(arg: string): void;

  compileContainer(node: NodeContainer): void;
  compileComment(node: NodeComment): void;
  compileText(node: NodeText): void;
  compileData(node: NodeData): void;
  compileFunction(node: NodeFunction): void;
  compileRawFunction(node: NodeRawFunction): void;
  compileSequence(node: NodeSequence): void;
  compileNode(node: Node): void;

  error(message: string, node: Node, position?: Partial<NodePosition>): never;

  expectedArgs(node: Node & BaseFunction, expected: number): never | void;
  // tslint:disable-next-line:unified-signatures
  expectedArgs(node: Node & BaseFunction, min: number, max: number): never | void;
}
