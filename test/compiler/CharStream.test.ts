/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';

import { CharStream } from '../../src/compiler/CharStream';
import { Source } from '../../src/types/Source';

describe('compiler/CharStream', () => {
  describe('peek', () => {
    it('should return undefined if EOF', () => {
      const stream = new CharStream(new Source('ABC'));

      expect(stream.peek(3)).eq(undefined);
      expect(stream.peek(1000)).eq(undefined);
    });

    it('should return symbol by offset', () => {
      const stream = new CharStream(new Source('ABC'));

      expect(stream.peek(1)).eq('B');
      expect(stream.peek(0)).eq('A');
      expect(stream.peek(2)).eq('C');
    });

    it('should work with next', () => {
      const stream = new CharStream(new Source('ABC'));

      stream.next();
      expect(stream.peek()).eq('B');
    });

    it('should work with skip', () => {
      const stream = new CharStream(new Source('ABC'));

      stream.skip(2);
      expect(stream.peek()).eq('C');
    });
  });

  describe('next', () => {
    it('should return next symbol and move pointer', () => {
      const stream = new CharStream(new Source('ABC'));

      expect(stream.next()).eq('A');
      expect(stream.next()).eq('B');
      expect(stream.next()).eq('C');
    });

    it('should work correctly with skip', () => {
      const stream = new CharStream(new Source('ABC'));

      stream.skip(1);

      expect(stream.next()).eq('B');
      expect(stream.next()).eq('C');
    });

    it('should throw exception if eof', () => {
      const stream = new CharStream(new Source('ABC'));

      stream.skip(3);
      expect(() => stream.next()).throw();
    });

    it('should return empty string if eof and throwEof is set to false', () => {
      const stream = new CharStream(new Source('ABC'));

      stream.skip(3);
      expect(stream.next(false)).eq('');
    });
  });

  describe('skip', () => {
    it('should skip given number of chars', () => {
      const stream = new CharStream(new Source('ABC'));

      expect(stream.position.offset).eq(0);

      stream.skip(2);

      expect(stream.position.offset).eq(2);
    });
  });

  describe('eof', () => {
    it('should return true if source is empty', () => {
      const stream = new CharStream(new Source(''));

      expect(stream.eof()).to.be.true;
    });

    it('should return false if source is not empty', () => {
      const stream = new CharStream(new Source('Hello'));

      expect(stream.eof()).to.be.false;
    });

    it('should return true when reached end', () => {
      const stream = new CharStream(new Source('Hello World'));

      stream.skip('Hello World'.length);

      expect(stream.eof()).to.be.true;
    });

    it('should return false when not reached end', () => {
      const stream = new CharStream(new Source('Hello World'));

      stream.skip('Hello World'.length - 1);

      expect(stream.eof()).to.be.false;
    });
  });

  describe('eol', () => {
    it('should return true if input.peek() === \'\\n\'', () => {
      const source = `
Test

Source
laravel

`.trim();

      const stream = new CharStream(new Source(source));

      while (!stream.eof()) {
        expect(stream.eol()).eq(stream.peek() === '\n');

        stream.skip();
      }
    });
  });
});
