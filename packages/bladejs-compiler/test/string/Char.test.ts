/* tslint:disable:object-literal-key-quotes */
/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import { inspect } from 'util';

import { Char } from '../../src/string/Char';

describe('string/Char', () => {
  const testWithBooleans = <V>(fn: (value: V) => boolean, trueTests: V[], falseTests: V[]) => {
    for (const test of trueTests) {
      it('should return true for ' + inspect(test), () => {
        expect(fn(test)).true;
      });
    }
    for (const test of falseTests) {
      it('should return false for ' + inspect(test), () => {
        expect(fn(test)).false;
      });
    }
  };

  describe('isLetter', () => {
    testWithBooleans(Char.isLetter, [
      'A',
      'b',
      'Z',
      'ы',
      'І',
    ], [
      '1',
      '/',
      '(',
      '*',
      ' ',
    ]);
  });

  describe('isWhitespace', () => {
    testWithBooleans(Char.isWhitespace, [
      ' ',
      '\t',
      ' \t',
      '\t ',
    ], [
      '1\t',
      ' p',
      '\n',
      '\r\n',
      ' A ',
    ]);
  });
});
