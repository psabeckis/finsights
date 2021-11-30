import { Config } from './config.js';
import { AnyFunction } from './core/types.js';

export type Input = {
  fn: AnyFunction;
};

export function validate(input: Input, config: Config) {
  if (config.noArrowFunctions && !input.fn.name) {
    throw new Error('(noArrowFunctions) Arrow functions are not allowed');
  }
}
