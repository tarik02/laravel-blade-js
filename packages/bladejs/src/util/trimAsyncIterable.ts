import './asyncIterator';

export const trimAsyncIterable = async function *(iteratee: AsyncIterable<string>): AsyncIterable<string> {
  const iterator = iteratee[Symbol.asyncIterator]();

  let tmp: string;

  // Trim left
  do {
    const item = await iterator.next();
    if (item.done) {
      return;
    }

    tmp = item.value.trimLeft();
  } while (tmp.length === 0);

  // Trim right
  let whitespace = '';
  while (true) {
    const trimmed = tmp.trimRight();
    if (trimmed.length === 0) {
      whitespace += tmp;
    } else {
      yield whitespace;
      yield trimmed;
      whitespace = tmp.substring(trimmed.length);
    }

    const item = await iterator.next();
    if (item.done) {
      return;
    }
    tmp = item.value;
  }
};
