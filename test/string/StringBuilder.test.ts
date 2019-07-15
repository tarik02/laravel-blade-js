import { expect } from 'chai';
import 'mocha';
import { createStringBuilder } from '../../src/string/StringBuilder';

describe('string/StringBuilder', () => {
  describe('createStringBuilder', () => {
    it('should return a valid StringBuilder instance', () => {
      const builder = createStringBuilder();

      expect(builder).property('append');
      expect(builder).property('build');

      expect(typeof builder.append).eq('function');
      expect(typeof builder.build).eq('function');
    });

    it('should return empty string if append was not called', () => {
      const builder = createStringBuilder();
      expect(builder.build()).eq('');
    });

    it('should build string', () => {
      const builder = createStringBuilder();

      builder.append('Hel');
      builder.append('lo');
      builder.append(' W');
      builder.append('orl');
      builder.append('d');

      expect(builder.build()).eq('Hello World');
    });
  });
});
