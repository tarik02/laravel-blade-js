import * as fs from 'fs-extra';
import { inspect } from 'util';
import { AbstractError, Compiler, Source } from '..';
import { Output } from './Output';

export default async function(exe: string, args: string[], out: Output): Promise<number> {
  if (args.length !== 2) {
    await out.write(`Usage:\n`);
    await out.write(`  ${exe} <input> <output>\n`);
    return -1;
  }

  const [input, output] = args;

  await out.write(`Reading ${inspect(input)}...\n`);

  let source: Source;
  try {
    source = new Source(await fs.readFile(input, 'utf-8'), input);
  } catch (e) {
    if ('code' in e && e.code === 'ENOENT') {
      await out.write(`File ${inspect(input)} does not exist\n`);
      return -1;
    }

    throw e;
  }

  const compiler = new Compiler();
  compiler.addDefaults();

  await out.write(`Compiling...\n`);

  let compiled: string;
  try {
    compiled = compiler.compile(source);
  } catch (e) {
    if (e instanceof AbstractError) {
      await out.write(e.prettyPrint(true));
      return -1;
    }

    throw e;
  }

  await out.write(`Saving ${inspect(output)}...\n`);

  try {
    await fs.writeFile(output, compiled);
  } catch (e) {
    throw e;
  }

  return 0;
}
