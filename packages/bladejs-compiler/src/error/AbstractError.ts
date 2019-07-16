import * as colors from 'ansi-colors';
import { Location } from '../source/Location';
import { Source } from '../source/Source';

export abstract class AbstractError extends Error {
  public readonly source: Source;
  public readonly position: Location;

  public constructor(source: Source, position: Location, message?: string) {
    super(message);

    this.source = source;
    this.position = position;

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }

  public prettyPrint(withColors: boolean = true): string {
    const oldEnabled = colors.enabled;
    // @ts-ignore
    colors.enabled = withColors;

    try {
      const { position: { start, end }, message, source } = this;

      let result = '';

      result += `${source.file || 'unknown'}:${start}: ${message}\n`;

      const pad = `${end.line + 1}. `.length;
      for (let i = start.line - 1; i <= end.line + 1; ++i) {
        const line = source.getLine(i);
        if (line !== undefined) {
          const linePrefix = `${i}. `.padEnd(pad);
          const printedLine = linePrefix + (
            i === start.line
              ? line.substr(0, start.column - 1) + colors.red(line.substr(start.column - 1))
              : i === end.line
              ? colors.red(line.substr(0, end.column - 1)) + line.substr(end.column - 1)
              : i >= start.line && i <= end.line
                ? colors.red(line)
                : line
          );

          if (i === start.line) {
            if (start.line === end.line) {
              result += printedLine + '\n';
              result += ' '.repeat(pad + start.column - 1);
              result += colors.red('^' + '~'.repeat(Math.max(0, end.column - pad - start.column + 2)));
              result += '\n';
            } else {
              result += ' '.repeat(pad + start.column - 1);
              result += colors.red(colors.bold('∨') + '~'.repeat(line.length - start.column + 1));
              result += '\n' + printedLine + '\n';
            }
          } else if (start.line !== end.line && i === end.line) {
            result += printedLine + '\n';
            result += colors.red('~'.repeat(pad + end.column - 2) + '^');
            result += '\n';
          } else {
            result += printedLine + '\n';
          }
        }
      }

      return result;
    } finally {
      // @ts-ignore
      colors.enabled = oldEnabled;
    }
  }
}
