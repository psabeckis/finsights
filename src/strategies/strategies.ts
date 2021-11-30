import { Status } from '../context/index.js';
import { memoryInspector, resultInspector } from '../inspectors/index.js';
import { createTerminalShipper, TerminalShipperOptions } from '../shippers/index.js';
import { createStrategy, mergeStrategies } from './factories.js';

export const createShowOffStrategy = (options: TerminalShipperOptions = {}) => {
  return createStrategy(
    [
      memoryInspector,
      resultInspector,
      createTerminalShipper({
        statuses: [Status.Success, Status.Failed],
        verbose: true,
        showTimeFrame: true,
        ...options,
      }),
    ],
    {
      calculateResultSize: true,
    },
  );
};

export const createPracticalStrategy = (options: TerminalShipperOptions = {}) => {
  return mergeStrategies(createStrategy([createTerminalShipper({ statuses: [Status.Failed], ...options })]));
};
