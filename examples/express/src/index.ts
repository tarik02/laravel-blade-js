import * as express from 'express';
import { Response } from 'express-serve-static-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { CompiledTemplate, Runtime, TemplateParams, TemplateProvider } from '../../../packages/bladejs';
import { AbstractError, Compiler, Source } from '../../../packages/bladejs-compiler';

const app = express();

const viewsDir = path.join(__dirname, '../views');
const viewsExt = 'bjs';
const getTemplateFileName = (name: string) => path.join(viewsDir, `${name.replace('.', '/')}.${viewsExt}`);

const viewsCompiler = new Compiler();
viewsCompiler.addDefaults();

const templateProvider: TemplateProvider = {
  async getTemplateCompiledFile(name: string): Promise<CompiledTemplate | undefined> {
    try {
      const source = new Source(
        await fs.readFile(getTemplateFileName(name), 'utf-8'),
        `${name}.${viewsExt}`,
      );
      const compiled = viewsCompiler.compile(source);

      return (new Function('__env', 'return ' + compiled + '(__env)')) as CompiledTemplate;
    } catch (e) {
      if (e instanceof AbstractError) {
        process.stdout.write(e.prettyPrint());
      } else if ('code' in e && e.code === 'ENOENT') {
        console.error(`Template ${name} does not exist`);
      } else {
        console.error(e);
      }
    }

    return undefined;
  },

  async isOutdated(name: string, _template: CompiledTemplate, creationTime: number): Promise<boolean> {
    const stat = await fs.stat(getTemplateFileName(name));
    return stat.mtimeMs > creationTime;
  },
};

const views = new Runtime([templateProvider]);

const writeView = async (res: Response, name: string, params?: TemplateParams): Promise<void> => {
  const start = performance.now();
  for await (const chunk of views.render(name, params)) {
    res.write(chunk);
  }
  const end = performance.now();

  res.write(`\n\n\n<!-- This template was rendered in ${end - start} milliseconds -->`);
};

app.get('/', async (_req, res) => {
  await writeView(res, 'index', {
    myVar: 'My variable value',
  });
  res.send();
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
