import { Char } from '../string/Char';
import { CharStream } from './CharStream';
import { Token } from './Token';
import { inspect } from 'util';

export class Lexer {
  private readonly input: CharStream;
  private readonly tokens: IterableIterator<Token>;
  private current: Token | undefined;

  public constructor(input: CharStream) {
    this.input = input;
    this.tokens = this.generator();
  }

  public peek(): Token {
    if (this.current === undefined) {
      this.current = this.tokens.next().value;
    }
    return this.current;
  }

  public next(): Token {
    this.current = undefined;
    return this.peek();
  }

  private *generator(): IterableIterator<Token> {
    const input = this.input;
    let text = '';

    const flush = function *(token?: Token): IterableIterator<Token> {
      if (text !== '') {
        yield {
          type: 'text',
          value: text,
        };
        text = '';
      }
      if (token !== undefined) {
        yield token;
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
      case '{':
        if (
          input.peek(1) === '{' &&
          input.peek(2) === '-' &&
          input.peek(3) === '-'
        ) {
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

          yield* flush({
            type: 'comment',
            value: comment,
          });
          continue;
        }
        break;
      case '@':
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
            case '"': {
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
                // TODO: Specific error class
                throw new Error(`expected ${inspect(expected)}, got ${inspect(ch)}`);
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

          yield* flush({
            type: 'function',
            name,
            args,
          });
        } else {
          yield* flush({
            type: 'function',
            name,
          });
        }

        continue;
      }

      input.next();
      text += c;
    }

    yield* flush();

    const eof: Token = { type: 'eof' };
    while (true) {
      yield eof;
    }
  }
}
