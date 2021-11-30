import { Config } from '../config.js';
import { BrainOptions } from '../brain.js';

export type StrategyOptions = Partial<BrainOptions>;

export type Strategy = Pick<BrainOptions, 'units'> & {
  options: Partial<Config>;
};

export function createStrategy(units: BrainOptions['units'] = [], options: Partial<Config> = {}): Strategy {
  return {
    units,
    options,
  };
}

// Last config always takes precedence
export function mergeStrategies(...args: Strategy[]): Strategy {
  const mergedUnits = args.flatMap((s) => s.units);
  const mergedOptions = args.reduce<Partial<Config>>((agg, strategy) => {
    return { ...agg, ...strategy.options };
  }, {});

  return {
    units: mergedUnits,
    options: mergedOptions,
  };
}
