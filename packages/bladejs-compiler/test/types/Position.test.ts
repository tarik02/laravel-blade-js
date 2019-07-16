/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';

import { Position } from '../../src/source/Position';
import { Source } from '../../src/source/Source';

describe('types/Position', () => {
  describe('line', () => {
    it('should be starting from 1', () => {
      const pos = new Position(new Source(''), 0);

      expect(pos.line).eq(1);
    });

    it('should treat \\n as symbol on previous line', () => {
      const pos1 = new Position(new Source('Hello\nWorld\n'), 5);
      const pos2 = new Position(new Source('Hello\nWorld\n'), 11);

      expect(pos1.line).eq(1);
      expect(pos2.line).eq(2);
    });

    it('should return line of the position', () => {
      const pos = new Position(new Source('Hello\nWorld\n'), 9);

      expect(pos.line).eq(2);
    });
  });

  describe('column', () => {
    it('should be starting from 1', () => {
      const pos = new Position(new Source(''), 0);

      expect(pos.column).eq(1);
    });

    it('should treat \\n as symbol on previous line', () => {
      const pos1 = new Position(new Source('Hello\nWorld\n'), 5);
      const pos2 = new Position(new Source('Hello\nWorld\n'), 11);

      expect(pos1.column).eq(6);
      expect(pos2.column).eq(6);
    });

    it('should return column of the position', () => {
      const pos = new Position(new Source('Hello\nWorld\n'), 9);

      expect(pos.column).eq(4);
    });
  });

  describe('relative', () => {
    it('should accept negative values', () => {
      const pos1 = new Position(new Source('Hello\nWorld'), 8);
      const pos2 = pos1.relative(-4);

      expect(pos2.offset).eq(4);
      expect(pos2.line).eq(1);
      expect(pos2.column).eq(5);
    });

    it('should accept positive values', () => {
      const pos1 = new Position(new Source('Hello\nWorld'), 3);
      const pos2 = pos1.relative(5);

      expect(pos2.offset).eq(8);
      expect(pos2.line).eq(2);
      expect(pos2.column).eq(3);
    });

    it('should return to the same position if using values with sum 0', () => {
      const pos1 = new Position(new Source('Hello\nWorld'), 8);
      const pos2 = pos1.relative(-4);
      const pos3 = pos2.relative(4);

      expect(pos1.equals(pos3)).true;
    });
  });

  describe('until', () => {
    it('should return text between two positions', () => {
      const source = new Source('Hello\nWorld\n');
      const pos1 = new Position(source, 4);
      const pos2 = new Position(source, 8);

      expect(pos1.until(pos2)).eq('o\nWo');
    });

    it('should work with inverted order of arguments', () => {
      const source = new Source('Hello\nWorld\n');
      const pos1 = new Position(source, 4);
      const pos2 = new Position(source, 8);

      expect(pos2.until(pos1)).eq('o\nWo');
    });
  });

  describe('equals', () => {
    it('should return false when different sources', () => {
      const pos1 = new Position(new Source('Hello World'), 4);
      const pos2 = new Position(new Source('Hello World'), 4);

      expect(pos1.equals(pos2)).false;
      expect(pos2.equals(pos1)).false;
    });

    it('should return false when different offsets', () => {
      const source = new Source('Hello World');
      const pos1 = new Position(source, 4);
      const pos2 = new Position(source, 8);

      expect(pos1.equals(pos2)).false;
      expect(pos2.equals(pos1)).false;
    });

    it('should return true when same sources and offsets', () => {
      const source = new Source('Hello World');
      const pos1 = new Position(source, 7);
      const pos2 = new Position(source, 7);

      expect(pos1.equals(pos2)).true;
      expect(pos2.equals(pos1)).true;
    });
  });

  describe('toString', () => {
    it('should return string representation (line:column) of position', () => {
      const source = new Source('Hello World');
      const pos = new Position(source, 3);

      expect(pos.toString()).eq('1:4');
    });
  });
});
