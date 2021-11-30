import { toFunction } from '../converters.js';

describe('toFunction', () => {
  it('should convert a variable into a function', () => {
    const fn = toFunction('test-string');

    expect(fn()).toEqual('test-string');
  });
});
