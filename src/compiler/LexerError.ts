import { Source } from '../types/Source';
import { TokenPosition } from './Token';

export class LexerError extends Error {
  public readonly source: Source;
  public readonly position: TokenPosition;

  public constructor(source: Source, position: TokenPosition, message?: string) {
    super(message);

    this.source = source;
    this.position = position;

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = LexerError.name;
  }
}
