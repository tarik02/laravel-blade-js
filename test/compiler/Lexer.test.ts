/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import 'mocha';
import { createLexer, lexAssert } from '../util.test';

import { Token } from '../../src/compiler/Token';

describe('compiler/Lexer', () => {
  describe('peek', () => {
    it('should return eof token when source is empty', () => {
      const lexer = createLexer('');

      expect(lexer.peek().type).eq('eof');
    });

    it('should return next token without moving', () => {
      const lexer = createLexer('Hello World');

      expect(lexer.peek() === lexer.peek()).true;
    });
  });

  describe('next', () => {
    it('should return eof token when source is empty', () => {
      const lexer = createLexer('');

      for (let i = 0; i < 100; ++i) {
        expect(lexer.peek().type).eq('eof');
      }
    });

    it('should move thru tokens', () => {
      const lexer = createLexer(`
Hello World
@section('a', 'b')
`.trim());

      let tok: Token;

      tok = lexer.next();
      expect(tok.type).eq('text');
      if (tok.type === 'text') {
        expect(tok.value).eq('Hello World\n');
      }

      tok = lexer.next();
      expect(tok.type).eq('function');
      if (tok.type === 'function') {
        expect(tok.name).eq('section');
        expect(tok.args).deep.eq([`'a'`, `'b'`]);
      }
    });
  });

  describe('samples', () => {
    it('sample-1', () => {
      lexAssert(`
{{-- this example is taken from https://laravel.com/docs/5.8/blade#template-inheritance --}}

<!-- Stored in resources/views/layouts/app.blade.php -->

<html>
    <head>
        <title>App Name - @yield('title')</title>
    </head>
    <body>
        @section('sidebar')
            This is the master sidebar.
        @show

        <div class="container">
            @yield('content')
        </div>
    </body>
</html>
`.trim(), [
        {
          type: 'comment',
          value: ' this example is taken from https://laravel.com/docs/5.8/blade#template-inheritance ',
        },
        {
          type: 'text',
          value:
            '\n\n<!-- Stored in resources/views/layouts/app.blade.php -->' +
            '\n\n<html>\n    <head>\n        <title>App Name - '
          ,
        },
        {
          type: 'function',
          name: 'yield',
          args: [
            `'title'`,
          ],
        },
        {
          type: 'text',
          value: '</title>\n    </head>\n    <body>\n        ',
        },
        {
          type: 'function',
          name: 'section',
          args: [
            `'sidebar'`,
          ],
        },
        {
          type: 'text',
          value: '\n            This is the master sidebar.\n        ',
        },
        {
          type: 'function',
          name: 'show',
        },
        {
          type: 'text',
          value: '\n\n        <div class="container">\n            ',
        },
        {
          type: 'function',
          name: 'yield',
          args: [
            `'content'`,
          ],
        },
        {
          type: 'text',
          value: '\n        </div>\n    </body>\n</html>',
        },
      ]);
    });

    it('sample-2', () => {
      lexAssert(`
@include('view.name', {
  'foo': ['hello )))', '(( world'],
  'bar': 5 * (3 + 4 * (5 - 2)),
})
`.trim(), [
        {
          type: 'function',
          name: 'include',
          args: [
            `'view.name'`,
            `{
  'foo': ['hello )))', '(( world'],
  'bar': 5 * (3 + 4 * (5 - 2)),
}`,
          ],
        },
      ]);
    });
  });
});
