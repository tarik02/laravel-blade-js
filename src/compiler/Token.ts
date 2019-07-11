import { Position } from '../types/Position';

export type BaseToken = {
  readonly type: string;
};

export type TokenComment = BaseToken & {
  readonly type: 'comment';
  readonly value: string;
};

export type TokenText = BaseToken & {
  readonly type: 'text';
  readonly value: string;
};

export type TokenData = BaseToken & {
  readonly type: 'data';
  readonly escaped: boolean;
  readonly value: string;
};

export type TokenFunction = BaseToken & {
  readonly type: 'function';
  readonly name: string;
  readonly args?: ReadonlyArray<string>;
};

export type TokenRawFunction = BaseToken & {
  readonly type: 'raw-function';
  readonly name: string;
  readonly args?: ReadonlyArray<string>;
  readonly content: string;
};

export type TokenEof = BaseToken & {
  readonly type: 'eof';
};

export type Token =
  | TokenComment
  | TokenText
  | TokenData
  | TokenFunction
  | TokenRawFunction
  | TokenEof
  ;

export type TokenPosition = {
  readonly start: Position;
  readonly end: Position;
};

export type FullToken = Token & TokenPosition;
