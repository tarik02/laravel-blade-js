import { inspect } from 'util';
import { Char } from '../string/Char';
import { Position } from '../types/Position';
import { CharStream } from './CharStream';
import { LexerError } from './LexerError';
import { FullToken, TokenPosition } from './Token';

export class Lexer {
  private readonly input: CharStream;
  private readonly tokens: IterableIterator<FullToken>;
  private current: FullToken | undefined;

  public constructor(input: CharStream) {
    this.input = input;
    this.tokens = this.generator();
  }

  public peek(): FullToken {
    if (this.current === undefined) {
      this.current = this.tokens.next().value;
    }
    return this.current;
  }

  public next(): FullToken {
    this.current = undefined;
    return this.peek();
  }

  private *generator(): IterableIterator<FullToken> {
    const input = this.input;
    let text = '';

    let prevPosition = input.position;

    const error = (message: string, position: Position = input.position) => {
      throw new LexerError(input.source, {
        start: position,
        end: position,
      }, message);
    };

    const tokenPosition = (end: Position = input.position): TokenPosition => {
      const start = prevPosition;
      prevPosition = end;

      return { start, end };
    };

    const flush = function *(token?: () => FullToken, begin?: Position): IterableIterator<FullToken> {
      if (text !== '') {
        yield {
          ...tokenPosition(begin),
          type: 'text',
          value: text,
        };
        text = '';
      }
      if (token !== undefined) {
        yield token();
      }
    };

    let isRaw = false;

    while (!input.eof()) {
      const c = input.peek();

      if (isRaw && c !== '@') {
        text += c;
        input.skip();
        continue;
      }

      switch (c) {
      case '{': {
        if (
          input.peek(1) === '{' &&
          input.peek(2) === '-' &&
          input.peek(3) === '-'
        ) {
          const position = input.position;
          input.skip(4);

          let comment = '';
          while (!input.eof()) {
            if (
              input.peek(0) === '-' &&
              input.peek(1) === '-' &&
              input.peek(2) === '}' &&
              input.peek(3) === '}'
            ) {
              input.skip(4);
              break;
            } else {
              comment += input.next();
            }
          }

          yield* flush(() => ({
            ...tokenPosition(),
            type: 'comment',
            value: comment,
          }), position);
          continue;
        }
        break;
      }
      case '@': {
        const position = input.position;
        input.skip();

        if (!Char.isLetter(input.peek())) {
          if (isRaw) {
            text += '@';
            continue;
          }

          text += '@';
          while (!input.eof() && !Char.isWhitespace(input.peek())) {
            text += input.next();
          }
          continue;
        }

        let name = '';
        while (Char.isLetter(input.peek())) {
          name += input.next();
        }

        if (isRaw) {
          if (name === 'endverbatim') {
            yield* flush();
            continue;
          }

          text += '@';
          text += name;
          continue;
        }

        if (name === 'verbatim') {
          yield* flush();
          isRaw = true;
          continue;
        }

        let i = 0;
        while (Char.isWhitespace(input.peek(i))) {
          ++i;
        }

        if (input.peek(i) === '(') {
          input.skip(i + 1);

          const args: string[] = [];
          const braces: string[] = [')'];
          let ch: string;
          let arg = '';
          while ((ch = input.next()) !== ')' || braces.length !== 1) {
            switch (ch) {
            case '\'':
            case '"':
            case '`': {
              let escape = false;
              let ch2: string;

              arg += ch;
              while ((ch2 = input.next()) !== ch || escape) {
                if (ch2 === '\\') {
                  escape = !escape;
                } else {
                  escape = false;
                }

                arg += ch2;
              }
              arg += ch2;
              break;
            }
            case ',':
              if (braces.length === 1) {
                args.push(arg.trim());
                arg = '';
              } else {
                arg += ch;
              }
              break;
            case '(':
              arg += ch;
              braces.push(')');
              break;
            case '{':
              arg += ch;
              braces.push('}');
              break;
            case '[':
              arg += ch;
              braces.push(']');
              break;
            case ')':
            case '}':
            case ']':
              arg += ch;

              const expected = braces.pop();
              if (expected !== ch) {
                error(`expected ${inspect(expected)}, got ${inspect(ch)}`);
              }
              break;
            default:
              arg += ch;
              break;
            }
          }
          arg = arg.trim();
          if (arg !== '') {
            args.push(arg);
          }

          yield* flush(() => ({
            ...tokenPosition(),
            type: 'function',
            name,
            args,
          }), position);
        } else {
          yield* flush(() => ({
            ...tokenPosition(),
            type: 'function',
            name,
          }), position);
        }

        continue;
      }
      }

      input.next();
      text += c;
    }

    yield* flush();

    const eof: FullToken = { ...tokenPosition(), type: 'eof' };
    while (true) {
      yield eof;
    }
  }
}
