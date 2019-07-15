/* tslint:disable:object-literal-key-quotes */

import 'mocha';
import { parseAssert } from '../util.test';

describe('compiler/Parser', () => {
  describe('parse', () => {
    it('should parse empty text as empty container node', () => {
      parseAssert('', {
        type: 'container',
        children: [],
      });
    });

    it('should parse simple text as container node with text node inside', () => {
      parseAssert('Hello World', {
        type: 'container',
        children: [
          {
            type: 'text',
            value: 'Hello World',
          },
        ],
      });
    });

    it('should parse simple functions', () => {
      parseAssert(`
Hello World
@testing('ABC', 15)
Hello World 2
`.trim(), {
        type: 'container',
        children: [
          {
            type: 'text',
            value: 'Hello World\n',
          },
          {
            type: 'function',
            name: 'testing',
            args: [
              `'ABC'`,
              `15`,
            ],
          },
          {
            type: 'text',
            value: '\nHello World 2',
          },
        ],
      });
    });

    it('should parse verbatim as text', () => {
      parseAssert(`
Text before verbatim
@verbatim
This is text inside verbatim
There can be even functions:
@yield('test')
But it is still parsed as simple text
@endverbatim
Text after verbatim
`.trim(), {
        type: 'container',
        children: [
          {
            type: 'text',
            value: 'Text before verbatim\n',
          },
          {
            type: 'text',
            value: '\nThis is text inside verbatim' +
              '\nThere can be even functions:' +
              '\n@yield(\'test\')' +
              '\nBut it is still parsed as simple text' +
              '\n',
          },
          {
            type: 'text',
            value: '\nText after verbatim',
          },
        ],
      });
    });

    it('should parse custom raw functions', () => {
      parseAssert(`
Hello!
@js
yield 'Some text';
yield 'Some other text';
@endjs
`.trim(), {
        type: 'container',
        children: [
          {
            type: 'text',
            value: 'Hello!\n',
          },
          {
            type: 'raw-function',
            name: 'js',
            args: undefined,
            content: '\nyield \'Some text\';\nyield \'Some other text\';\n',
          },
        ],
      }, {}, {
        rawFunctions: ['js'],
      });
    });

    it('should parse sequences', () => {
      parseAssert(`
@push('js')
<script type="text/javascript" src="/index.js"></script>
@endpush
`.trim(), {
        type: 'container',
        children: [
          {
            type: 'sequence',
            data: [
              [
                {
                  type: 'function',
                  name: 'push',
                  args: [`'js'`],
                },
                {
                  type: 'container',
                  children: [
                    {
                      type: 'text',
                      value: '\n<script type="text/javascript" src="/index.js"></script>\n',
                    },
                  ],
                },
              ],
            ],
            ending: {
              type: 'function',
              name: 'endpush',
              args: undefined,
            },
          },
        ],
      }, {
        sequences: {
          'push': [
            { name: 'endpush', required: true, multiple: false },
          ],
        },
      });
    });
  });
});
