import { inspect } from 'util';
import { Char } from '../string/Char';
import { Position } from '../types/Position';
import { Source } from '../types/Source';
import { CharStream } from './CharStream';
import { LexerError } from './LexerError';
import { FullToken, TokenPosition } from './Token';

export interface Lexer {
  readonly source: Source;
  readonly position: Position;

  peek(): FullToken;

  next(): FullToken;

  eof(): boolean;
}

export interface LexerConfig {
  readonly rawFunctions: ReadonlyArray<string>;
}

export const DEFAULT_LEXER_CONFIG: LexerConfig = {
  rawFunctions: ['js', 'verbatim'],
};

export const createLexer = (input: CharStream, lexerConfig?: Partial<LexerConfig>): Lexer => {
  const config: LexerConfig = {
    ...DEFAULT_LEXER_CONFIG,
    ...lexerConfig,
  };

  let text = '';
  let isRaw = false;
  let rawFunction: string | undefined;
  let rawArgs: string[] | undefined;

  let prevPosition = input.position;

  const error = (message: string, position: Position = input.position): never => {
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

  const generator = function *(): IterableIterator<FullToken> {
    while (!input.eof()) {
      const c = input.peek();

      if (isRaw && c !== '@') {
        text += c;
        input.skip();
        continue;
      }

      switch (c) {
      case '{': {
        if (input.sub(2, 1) === '!!') {
          // unescaped data

          const position = input.position;
          input.skip(3);

          let data = '';
          while (!input.eof()) {
            if (input.sub(3) === '!!}') {
              input.skip(3);
              break;
            } else {
              data += input.next();
            }
          }

          yield* flush(() => ({
            ...tokenPosition(),
            type: 'data',
            escaped: false,
            value: data,
          }), position);

          continue;
        } else if (input.peek(1) === '{') {
          if (input.sub(2, 2) === '--') {
            // comment

            const position = input.position;
            input.skip(4);

            let comment = '';
            while (!input.eof()) {
              if (input.sub(4) === '--}}') {
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
          } else {
            // escaped data

            const position = input.position;
            input.skip(2);

            let data = '';
            while (!input.eof()) {
              if (input.sub(2) === '}}') {
                input.skip(2);
                break;
              } else {
                data += input.next();
              }
            }

            yield* flush(() => ({
              ...tokenPosition(),
              type: 'data',
              escaped: true,
              value: data,
            }), position);
          }

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
          if (rawFunction && name === 'end' + rawFunction) {
            isRaw = false;

            // verbatim is always treated as text
            if (rawFunction === 'verbatim') {
              yield* flush();
            } else {
              if (rawArgs !== undefined) {
                yield {
                  ...tokenPosition(input.position),
                  type: 'raw-function',
                  name: rawFunction,
                  args: rawArgs,
                  content: text,
                };
              } else {
                yield {
                  ...tokenPosition(input.position),
                  type: 'raw-function',
                  name: rawFunction,
                  content: text,
                };
              }
              text = '';
            }

            rawFunction = undefined;
            rawArgs = undefined;
            continue;
          }

          text += '@';
          text += name;
          continue;
        }

        // @verbatim may not have arguments
        if (name === 'verbatim' && config.rawFunctions.indexOf(name) !== -1) {
          yield* flush();
          isRaw = true;
          rawFunction = name;
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
                error(
                  `expected ${inspect(expected)}, got ${inspect(ch)}`,
                  input.position.relative(-1),
                );
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

          if (config.rawFunctions.indexOf(name) !== -1) {
            yield* flush();
            isRaw = true;
            rawFunction = name;
            rawArgs = args;
            continue;
          }

          yield* flush(() => ({
            ...tokenPosition(),
            type: 'function',
            name,
            args,
          }), position);
        } else {
          if (config.rawFunctions.indexOf(name) !== -1) {
            yield* flush();
            isRaw = true;
            rawFunction = name;
            rawArgs = undefined;
            continue;
          }

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
  };

  const tokens = generator();

  let current: FullToken | undefined;

  const peek = (): FullToken => {
    if (current === undefined) {
      current = tokens.next().value;
    }
    return current;
  };

  const next = (): FullToken => {
    const tok = peek();
    current = undefined;
    return tok;
  };

  return {
    source: input.source,
    get position(): Position {
      if (current !== undefined) {
        return current.start;
      } else {
        return input.position;
      }
    },

    peek,
    next,
    eof: () => input.eof(),
  };
};
