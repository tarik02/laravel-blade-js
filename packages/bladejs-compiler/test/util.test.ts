import { expect, use } from 'chai';
import chaiExclude from 'chai-exclude';

use(chaiExclude);

import { LexerError } from '../src/error/LexerError';
import { createLexer, LexerConfig } from '../src/lexer/Lexer';
import { Token } from '../src/lexer/Token';
import { NodeRecursiveWithoutLocation } from '../src/parser/Node';
import { parse, ParserConfig } from '../src/parser/Parser';
import { Scanner } from '../src/scanner/Scanner';
import { Source } from '../src/source/Source';

export const createLexerFromText =
  (text: string, config?: Partial<LexerConfig>) => createLexer(new Scanner(new Source(text)), config)
;

export const lex = (text: string, config?: Partial<LexerConfig>): Token[] => {
  const lexer = createLexerFromText(text, config);
  let tok: Token;

  const result = [];
  while ((tok = lexer.next()).type !== 'eof') {
    result.push(tok);
  }
  return result;
};

export const lexAssert = (text: string, expectedTokens: Token[], config?: Partial<LexerConfig>) => {
  const actualTokens = lex(text, config);

  expect(actualTokens).excludingEvery(['start', 'end']).deep.eq(expectedTokens);
};

export const lexError = (text: string, config?: Partial<LexerConfig>): LexerError => {
  try {
    lex(text, config);
  } catch (e) {
    if (e instanceof LexerError) {
      return e;
    }
  }

  expect.fail(undefined, undefined, 'lex expected to throw an error');
  throw new Error('unreachable');
};

export const parseAssert = (
  text: string,
  expected: NodeRecursiveWithoutLocation,
  parserConfig?: Partial<ParserConfig>,
  lexerConfig?: Partial<LexerConfig>,
) => {
  const actual = parse(createLexerFromText(text, lexerConfig), parserConfig);

  expect(actual).excludingEvery(['start', 'end']).deep.eq(expected);
};
