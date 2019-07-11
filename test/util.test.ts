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

export const lex = (text: string): Token[] => {
  const lexer = createLexerFromText(text);
  let tok: Token;

  const result = [];
  while ((tok = lexer.next()).type !== 'eof') {
    result.push(tok);
  }
  return result;
};

export const lexAssert = (text: string, expectedTokens: Token[]) => {
  const actualTokens = lex(text);

  expect(actualTokens).excludingEvery(['start', 'end']).deep.eq(expectedTokens);
};

export const lexError = (text: string): LexerError => {
  try {
    lex(text);
  } catch (e) {
    if (e instanceof LexerError) {
      return e;
    }
  }

  expect.fail(undefined, undefined, 'lex expected to throw an error');
  throw new Error('unreachable');
};
