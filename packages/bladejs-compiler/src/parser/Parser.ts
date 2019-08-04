// tslint:disable:object-literal-key-quotes

import { ParserError } from '../error/ParserError';
import { Lexer } from '../lexer/Lexer';
import { FullToken } from '../lexer/Token';
import { Location } from '../source/Location';
import { Node, NodeContainer, NodeFunction, NodeWithoutLocation } from './Node';

export type ParserSequenceItemConfig = {
  name: string | ReadonlyArray<string>,
  required: boolean,
  multiple: boolean,
};

export type ParserSequenceConfig =
  | ReadonlyArray<ParserSequenceItemConfig>
  | ((args: ReadonlyArray<string>) => ReadonlyArray<ParserSequenceItemConfig>)
  ;

export interface ParserConfig {
  sequences: { [fn_open: string]: ParserSequenceConfig };
}

export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  sequences: {},
};

export const parse = (lexer: Lexer, parserConfig?: Partial<ParserConfig>): Node => {
  // @ts-ignore
  const config: ParserConfig = {
    ...DEFAULT_PARSER_CONFIG,
    ...parserConfig,
  };

  const { sequences } = config;

  const breakingFunctions: string[][] = [];

  const error = (message: string, position?: Location): never => {
    if (position === undefined) {
      position = {
        start: lexer.position,
        end: lexer.position,
      };
    }

    throw new ParserError(lexer.source, {
      ...position,
    }, message);
  };

  const unexpectedToken = (token: FullToken = lexer.peek(), suffix?: string): never => {
    return error(`unexpected token '${token.type}'` + (suffix ? `, ${suffix}` : ''), {
      start: token.start,
      end: token.end,
    });
  };

  const parser = <N extends NodeWithoutLocation | undefined, T = []>(
    fn: (...args: T[]) => N,
  ): ((...args: T[]) => (N & Location) | undefined) => {
    return (...args: T[]): (N & Location) | undefined => {
      const start = lexer.peek().start;
      const tok = fn(...args);
      if (tok === undefined) {
        return undefined;
      }

      const end = lexer.peek().start;

      return {
        start,
        end,
        ...tok,
      };
    };
  };

  const parseRoot = parser(() => {
    const nodes: Node[] = [];

    let node: Node | undefined;
    while (undefined !== (node = parseAny())) {
      nodes.push(node);
    }

    return {
      type: 'container',
      children: nodes,
    };
  });

  const parseAny = parser((): NodeWithoutLocation | undefined => {
    const tok = lexer.peek();
    if (
      tok.type === 'function' &&
      breakingFunctions.length !== 0 &&
      breakingFunctions[breakingFunctions.length - 1].indexOf(tok.name) !== -1
    ) {
      breakingFunctions.pop();
      return undefined;
    }

    lexer.next();

    switch (tok.type) {
    case 'eof':
      return undefined;
    case 'comment':
      return {
        type: 'comment',
        value: tok.value,
      };
    case 'text':
      return {
        type: 'text',
        value: tok.value,
      };
    case 'data':
      return {
        type: 'data',
        escaped: tok.escaped,
        value: tok.value,
        filters: tok.filters,
      };
    case 'function':
      const fn: Node = {
        start: tok.start,
        end: tok.end,
        type: 'function',
        name: tok.name,
        args: tok.args,
      };

      if (tok.name in sequences) {
        const sequence =
          typeof sequences[tok.name] === 'function'
            // @ts-ignore
            ? sequences[tok.name](tok.args)
            : sequences[tok.name]
        ;
        let i = 0;

        let prefixFunction: NodeFunction = fn;
        const data: Array<[NodeFunction, NodeContainer]> = [];

        while (i < sequence.length) {
          const bf = [];
          for (let j = i; j < sequence.length; ++j) {
            const element = sequence[j];
            bf.push(...(
              typeof element.name === 'string'
                ? [element.name]
                : element.name
            ));

            if (element.required) {
              break;
            }
          }
          breakingFunctions.push(bf);

          const content = parseRoot()!;
          data.push([prefixFunction, content]);

          const tok2 = lexer.next();

          // TODO: handler required === true && multiple === true
          let found = false;
          if (tok2.type === 'function') {
            for (let j = i; j < sequence.length; ++j) {
              const element = sequence[j];
              if (
                typeof element.name === 'string'
                  ? element.name === tok2.name
                  : element.name.indexOf(tok2.name) !== -1
              ) {
                if (!element.multiple) {
                  i = ++j;
                }
                found = true;
                break;
              }
            }
          }
          if (!found || tok2.type !== 'function') {
            const expected = breakingFunctions[breakingFunctions.length - 1]
              .map(it => '@' + it)
              .join(', ')
            ;
            return unexpectedToken(tok2, `expected one of: ${expected}`);
          }

          prefixFunction = {
            start: tok2.start,
            end: tok2.end,
            type: 'function',
            name: tok2.name,
            args: tok2.args,
          };
        }

        return {
          type: 'sequence',
          data,
          ending: prefixFunction,
        };
      }

      return fn;
    case 'raw-function':
      return {
        type: 'raw-function',
        name: tok.name,
        args: tok.args,
        content: tok.content,
      };
    }

    return unexpectedToken(tok);
  });

  const root = parseRoot()!;

  if (!lexer.eof()) {
    return unexpectedToken();
  }

  return root;
};
