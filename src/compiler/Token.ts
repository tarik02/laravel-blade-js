import { Position } from '../types/Position';

export type BaseToken = {
  readonly type: string;
};

export type TokenText = BaseToken & {
  readonly type: 'text';
  readonly value: string;
};

export type TokenComment = BaseToken & {
  readonly type: 'comment';
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

export type TokenEof = BaseToken & {
  readonly type: 'eof';
};

export type Token =
  | TokenText
  | TokenComment
  | TokenData
  | TokenFunction
  | TokenEof
  ;

export type TokenPosition = {
  readonly start: Position;
  readonly end: Position;
};

export type FullToken = Token & TokenPosition;
