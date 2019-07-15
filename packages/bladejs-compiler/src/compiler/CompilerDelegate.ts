import {
  BaseFunction,
  Node,
  NodeComment,
  NodeContainer,
  NodeData,
  NodeFunction,
  NodeRawFunction, NodeSequence,
  NodeText,
} from '../parser/Node';
import { Location } from '../source/Location';

export interface CompilerDelegate {
  append(arg: string): void;
  footer: {
    append(arg: string): void;
  };

  compileContainer(node: NodeContainer): void;
  compileComment(node: NodeComment): void;
  compileText(node: NodeText): void;
  compileData(node: NodeData): void;
  compileFunction(node: NodeFunction): void;
  compileRawFunction(node: NodeRawFunction): void;
  compileSequence(node: NodeSequence): void;
  compileNode(node: Node): void;

  error(message: string, node: Node, position?: Partial<Location>): never;

  expectedArgs(node: Node & BaseFunction, expected: number): never | void;
  // tslint:disable-next-line:unified-signatures
  expectedArgs(node: Node & BaseFunction, min: number, max: number): never | void;
}
