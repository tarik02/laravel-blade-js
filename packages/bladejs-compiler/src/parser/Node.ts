import { Location } from '../source/Location';

export type BaseNode = Location & {
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

// node types without location
export type NodeWithoutLocation =
  | Omit<NodeContainer, 'start' | 'end'>
  | Omit<NodeComment, 'start' | 'end'>
  | Omit<NodeText, 'start' | 'end'>
  | Omit<NodeData, 'start' | 'end'>
  | Omit<NodeFunction, 'start' | 'end'>
  | Omit<NodeRawFunction, 'start' | 'end'>
  | Omit<NodeSequence, 'start' | 'end'>
  ;

// recursive node types without position (start, end)

export type NodeContainerRWL = Omit<NodeContainer, 'start' | 'end' | 'children'> & {
  readonly children: ReadonlyArray<NodeRecursiveWithoutLocation>;
};

export type NodeCommentRWL = Omit<NodeComment, 'start' | 'end'>;

export type NodeTextRWL = Omit<NodeText, 'start' | 'end'>;

export type NodeDataRWL = Omit<NodeData, 'start' | 'end'>;

export type NodeFunctionRWL = Omit<NodeFunction, 'start' | 'end'>;

export type NodeRawFunctionRWL = Omit<NodeRawFunction, 'start' | 'end'>;

export type NodeSequenceRWL = Omit<NodeSequence, 'start' | 'end' | 'data' | 'ending'> & {
  readonly data: ReadonlyArray<[NodeFunctionRWL, NodeContainerRWL]>;
  readonly ending: NodeFunctionRWL;
};

export type NodeRecursiveWithoutLocation =
  | NodeContainerRWL
  | NodeCommentRWL
  | NodeTextRWL
  | NodeDataRWL
  | NodeFunctionRWL
  | NodeRawFunctionRWL
  | NodeSequenceRWL
  ;

// utilities

export const isNotEmptyContainer = (node?: NodeContainer): node is NodeContainer => {
  return node !== undefined && node.children.some(it => {
    return it.type !== 'text' || it.value.trim() !== '';
  });
};
