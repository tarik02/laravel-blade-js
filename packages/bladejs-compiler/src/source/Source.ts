export class Source {
  public readonly text: string;
  public readonly file: string | undefined;

  private readonly lineStartCache: number[] = [0];

  public constructor(text: string, file?: string) {
    this.text = text;
    this.file = file;
  }

  public getLine(line: number): string | undefined {
    this.buildLineCache(line + 1);

    if (line < 1 || line >= this.lineStartCache.length) {
      return undefined;
    }

    return this.text.substring(this.lineStartCache[line - 1], this.lineStartCache[line] - 1);
  }

  private buildLineCache(line: number): void {
    const { text, lineStartCache } = this;

    while (line > lineStartCache.length) {
      let i = lineStartCache[lineStartCache.length - 1];

      if (i === text.length + 1) {
        break;
      }

      for (; i < text.length; ++i) {
        if (text[i] === '\n') {
          lineStartCache.push(i + 1);
        }
      }

      if (i === text.length) {
        lineStartCache.push(i + 1);
        break;
      }
    }
  }
}
