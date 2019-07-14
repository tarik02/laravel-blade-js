/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import { trimAsyncIterable } from '../../src/runtime/trimAsyncIterable';

const generate = async function *(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
};

const collect = async (iteratee: AsyncIterable<string>): Promise<string> => {
  let result = '';
  for await (const chunk of iteratee) {
    result += chunk;
  }
  return result;
};

const testTrim = async (chunks: string[]): Promise<string> => {
  return await collect(trimAsyncIterable(generate(chunks)));
};

describe('runtime/trimAsyncIterable', () => {
  it('should trim single string', async () => {
    expect(await testTrim([
      ' Hello World ',
    ])).eq('Hello World');
  });

  it('should trim two strings', async () => {
    expect(await testTrim([
      ' Hello ',
      ' World ',
    ])).eq('Hello  World');
  });

  it('should trim many strings', async () => {
    expect(await testTrim([
      ' Hel',
      'lo ',
      'Wor',
      'ld ',
    ])).eq('Hello World');
  });

  it('should trim empty sequence', async () => {
    expect(await testTrim([])).eq('');
  });

  it('should trim empty string', async () => {
    expect(await testTrim([''])).eq('');
  });

  it('should not trim single trimmed string', async () => {
    expect(await testTrim([
      'Hello World',
    ])).eq('Hello World');
  });

  it('should not trim two trimmed strings', async () => {
    expect(await testTrim([
      'Hello ',
      ' World',
    ])).eq('Hello  World');
  });

  it('should not trim many trimmed strings', async () => {
    expect(await testTrim([
      'Hel',
      'lo',
      ' ',
      'Wo',
      'rld',
      '',
    ])).eq('Hello World');
  });
});
