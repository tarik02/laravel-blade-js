import { Output } from './Output';

export class StdOutput implements Output {
  public write(str: string): Promise<void> {
    return new Promise((resolve, reject) => {
      process.stdout.write(str, (error: any) => error ? reject(error) : resolve());
    });
  }
}
