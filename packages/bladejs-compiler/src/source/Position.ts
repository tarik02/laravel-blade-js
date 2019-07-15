import {Source} from './Source';

export class Position {
  public readonly source: Source;
  public readonly offset: number;

  private cachedLine: number | undefined;
  private cachedColumn: number | undefined;

  /**
   * Return line number of position (starting from 1)
   */
  public get line(): number {
    if (this.cachedLine === undefined) {
      this.cacheLineAndColumn();
    }
    return this.cachedLine!;
  }

  /**
   * Return column number of position(starts from 0)
   */
  get column(): number {
    if (this.cachedColumn === undefined) {
      this.cacheLineAndColumn();
    }
    return this.cachedColumn!;
  }

  public constructor(
    source: Source,
    offset: number,
    line?: number,
    column?: number) {
    this.source = source;
    this.offset = offset;
    this.cachedLine = line;
    this.cachedColumn = column;
  }

  public relative(offset: number): Position {
    if (offset === 0) {
      return this;
    }

    // TODO: Put line and column?
    return new Position(this.source, this.offset + offset);
  }

  public until(other: Position): string {
    if (other.source !== this.source) {
      throw new Error('Positions are with different code');
    }

    const [a, b]: number[] = [this.offset, other.offset].sort();
    return this.source.text.substring(a, b);
  }

  public equals(other: Position): boolean {
    return this.source === other.source && this.offset === other.offset;
  }

  public toString(): string {
    return `${this.line}:${this.column}`;
  }

  private cacheLineAndColumn() {
    this.cachedLine = 1;
    this.cachedColumn = 1;

    const text = this.source.text;
    for (let i: number = 0; i < this.offset; ++i) {
      if (text[i] === '\n') {
        ++this.cachedLine;
        this.cachedColumn = 1;
      } else {
        ++this.cachedColumn;
      }
    }
  }
}
