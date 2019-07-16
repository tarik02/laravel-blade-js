/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';

import { Source } from '../../src/source/Source';

describe('types/Source', () => {
  describe('getLine', () => {
    it('should return line by index starting with 1', () => {
      const source = new Source(`
Line 1
Line 2
Line 3
Line 4
Line 5
`.trim());

      expect(source.getLine(0)).eq(undefined);
      expect(source.getLine(1)).eq('Line 1');
      expect(source.getLine(2)).eq('Line 2');
      expect(source.getLine(3)).eq('Line 3');
      expect(source.getLine(4)).eq('Line 4');
      expect(source.getLine(5)).eq('Line 5');
      expect(source.getLine(6)).eq(undefined);
    });
  });
});
