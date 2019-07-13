import { expect } from 'chai';
import 'mocha';

import { lexError } from '../util.test';

describe('compiler/AbstractError', () => {
  describe('prettyPrint', () => {
    it('error-1', () => {
      expect(lexError(`
<html>
    <body>
        @section('sidebar', {))
            This is the master sidebar.
        @show
    </body>
</html>
`.trim()).prettyPrint(false)).eq(`
unknown:3:30: expected "}", got ")"
2.     <body>
3.         @section('sidebar', {))
                                ^
4.             This is the master sidebar.
`.trim() + '\n');
    });
  });
});
