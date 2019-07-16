export interface Output {
  write(str: string): Promise<void>;
}
