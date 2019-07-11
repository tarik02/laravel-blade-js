import { expect } from 'chai';
import 'mocha';
import { ErrorPrinter } from '../../src/compiler/ErrorPrinter';

import { lexError } from '../util.test';

describe('compiler/ErrorPrinter', () => {
  describe('prettyLexerError', () => {
    it('error-1', () => {
      expect(ErrorPrinter.prettyLexerError(lexError(`
<html>
    <body>
        @section('sidebar', {))
            This is the master sidebar.
        @show
    </body>
</html>
`.trim()))).eq(`
unknown:3:30: expected '}', got ')'
2.     <body>
3.         @section('sidebar', {))
                                ^
4.             This is the master sidebar.
`.trim() + '\n');
    });
  });
});
