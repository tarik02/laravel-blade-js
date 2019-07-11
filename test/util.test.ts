import { expect, use } from 'chai';
import chaiExclude from 'chai-exclude';

use(chaiExclude);

import { CharStream } from '../src/compiler/CharStream';
import { createLexer, LexerConfig } from '../src/compiler/Lexer';
import { LexerError } from '../src/compiler/LexerError';
import { Token } from '../src/compiler/Token';
import { Source } from '../src/types/Source';

export const createLexerFromText =
  (text: string, config?: Partial<LexerConfig>) => createLexer(new CharStream(new Source(text)), config)
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
