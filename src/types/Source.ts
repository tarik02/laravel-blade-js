export class Source {
  public readonly text: string;
  public readonly file: string | undefined;

  public constructor(text: string, file?: string) {
    this.text = text;
    this.file = file;
  }
}
