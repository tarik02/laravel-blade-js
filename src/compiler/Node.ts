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


// Node types without position (start, end)

export type NodeContainerWP = Omit<NodeContainer, 'start' | 'end' | 'children'> & {
  readonly children: ReadonlyArray<NodeWithoutPosition>;
};

export type NodeCommentWP = Omit<NodeComment, 'start' | 'end'>;

export type NodeTextWP = Omit<NodeText, 'start' | 'end'>;

export type NodeDataWP = Omit<NodeData, 'start' | 'end'>;

export type NodeFunctionWP = Omit<NodeFunction, 'start' | 'end'>;

export type NodeRawFunctionWP = Omit<NodeRawFunction, 'start' | 'end'>;

export type NodeSequenceWP = Omit<NodeSequence, 'start' | 'end' | 'data' | 'ending'> & {
  readonly data: ReadonlyArray<[NodeFunctionWP, NodeContainerWP]>;
  readonly ending: NodeFunctionWP;
};

export type NodeWithoutPosition =
  | NodeContainerWP
  | NodeCommentWP
  | NodeTextWP
  | NodeDataWP
  | NodeFunctionWP
  | NodeRawFunctionWP
  | NodeSequenceWP
  ;


export const isNotEmptyContainer = (node?: NodeContainer): node is NodeContainer => {
  return node !== undefined && node.children.some(it => {
    return it.type !== 'text' || it.value.trim() !== '';
  });
};
