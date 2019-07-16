export const Char = {
  isLetter: (c: any) => typeof c === 'string' && c.toLowerCase() !== c.toUpperCase(),
  isWhitespace: (c: any) => typeof c === 'string' && /^[ \t]+$/.test(c),
};
