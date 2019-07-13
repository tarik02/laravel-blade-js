import { ScopedPosition } from './ScopedPosition';

export type BaseNode = ScopedPosition & {
  readonly type: string;
};

export type NodeContainer = BaseNode & {
  readonly type: 'container';
  readonly children: ReadonlyArray<Node>;
};

export type NodeComment = BaseNode & {
  readonly type: 'comment';
  readonly value: string;
};

export type NodeText = BaseNode & {
  readonly type: 'text';
  readonly value: string;
};

export type NodeData = BaseNode & {
  readonly type: 'data';
  readonly escaped: boolean;
  readonly value: string;
};

export type BaseFunction = BaseNode & {
  readonly name: string;
  readonly args?: ReadonlyArray<string>;
};

export type NodeFunction = BaseFunction & {
  readonly type: 'function';
};

export type NodeRawFunction = BaseFunction & {
  readonly type: 'raw-function';
  readonly content: string;
};

export type NodeSequence = BaseNode & {
  readonly type: 'sequence';

  readonly data: ReadonlyArray<[NodeFunction, NodeContainer]>;
  readonly ending: NodeFunction;
};

export type Node =
  | NodeContainer
  | NodeComment
  | NodeText
  | NodeData
  | NodeFunction
  | NodeRawFunction
  | NodeSequence
;

// HACK: Omit<Node, 'start' | 'end'> does not work as expected
export declare const { start: __start, end: __end, ...__rest }: Node;
export type NodeWithoutPosition = typeof __rest;

export const isNotEmptyContainer = (node?: NodeContainer): node is NodeContainer => {
  return node !== undefined && node.children.some(it => {
    return it.type !== 'text' || it.value.trim() !== '';
  });
};
