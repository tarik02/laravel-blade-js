import { LexerError } from './LexerError';

export const ErrorPrinter = {
  prettyLexerError: (error: LexerError): string => {
    const { position: { start, end }, message, source } = error;

    let result = '';

    result += `${source.file || 'unknown'}:${start}: ${message}\n`;

    const pad = `${end.line + 1}. `.length;
    for (let i = start.line - 1; i <= end.line + 1; ++i) {
      const line = source.getLine(i);
      if (line !== undefined) {
        result += (`${i}. `.padEnd(pad)) + line + '\n';

        if (i === start.line) {
          result += ' '.repeat(pad + start.column - 2);
          result += '^';
          result += '\n';
        }
      }
    }

    return result;
  },
};
