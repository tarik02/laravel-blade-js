export {};

if (!('asyncIterator' in Symbol)) {
  (Symbol as any).asyncIterator = (Symbol as any).for('asyncIterator');
}
