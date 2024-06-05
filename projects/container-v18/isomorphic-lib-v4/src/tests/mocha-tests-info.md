THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.

# Purpose of this folder
Put your backend **mocha** tests (with .spec extension) in this folder.

# How to test your isomorphic backend ?
```
firedev mocha
firedev mocha:watch
firedev mocha:debug # and start "attach" VSCode debugger
firedev mocha:watch:debug # and start "attach" VSCode debugger
```

# Example
example.test.ts
```ts
import { describe, before, it } from 'mocha'
import { expect } from 'chai';

describe('Set name for function or class', () => {

  it('should keep normal function name ', () => {
    expect(1).to.be.eq(Number(1));
  })
});
```

THIS FILE IS GENERATED.THIS FILE IS GENERATED. THIS FILE IS GENERATED.

          