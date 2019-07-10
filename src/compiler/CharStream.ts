import { Position } from '../types/Position';
import { Source } from '../types/Source';
import { LexerError } from './LexerError';

export class CharStream {
  public readonly source: Source;
  private readonly input: string;

  private offset: number = 0;
  private line: number = 1;
  private column: number = 1;
  private cachedPosition: Position | undefined;

  public get position(): Position {
    if (this.cachedPosition === undefined) {
      this.cachedPosition = new Position(this.source, this.offset, this.line, this.column);
    }
    return this.cachedPosition;
  }

  public constructor(source: Source) {
    this.source = source;
    this.input = source.text;
  }

  public peek(offset: number = 0): string | undefined {
    return this.input[this.offset + offset];
  }

  public sub(length: number, offset: number = 0): string {
    return this.input.substring(this.offset + offset, this.offset + offset + length);
  }

  public next(throwEof: boolean = true): string {
    if (this.offset >= this.input.length) {
      if (throwEof) {
        throw new LexerError(this.source, {
          start: this.position,
          end: this.position,
        }, 'unexpected end of file');
      }

      return '';
    }

    this.cachedPosition = undefined;
    const ch = this.input[this.offset++];
    if (ch === '\n') {
      ++this.line;
      this.column = 1;
    } else {
      ++this.column;
    }
    return ch;
  }

  public skip(count: number = 1): void {
    this.cachedPosition = undefined;

    while (--count >= 0) {
      if (this.input[this.offset++] === '\n') {
        ++this.line;
        this.column = 1;
      } else {
        ++this.column;
      }
    }
  }

  public eof(): boolean {
    return this.offset >= this.input.length;
  }

  public eol(): boolean {
    return this.peek() === '\n';
  }
}
