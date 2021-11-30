import { createBrain, BrainOptions, FunctionStage } from './brain.js';
import { Mode, config, Config } from './config.js';
import { createContext } from './context/index.js';
import { FunctionHooks, hookFunction } from './core/enhancers.js';
import { AnyFunction } from './core/types.js';
import { createPracticalStrategy } from './strategies/index.js';
import { taggableFunction } from './tags.js';
import { determineCallerLocation } from './utils.js';
import { validate } from './validators.js';

export type InspectorOptions = Omit<ProcessorOptions, 'metadata'>;

type ProcessorOptions = Pick<BrainOptions, 'units' | 'metadata'> & {
  options?: Partial<Config>;
};

function createFunctionProcessor({ units, options, metadata }: ProcessorOptions) {
  return <F extends AnyFunction>(fn: F, ...args: Parameters<F>) => {
    const mergedOptions = config.getDerived(options || {});

    validate({ fn }, mergedOptions);

    const brain = createBrain({ units, options: mergedOptions, metadata });

    const hooks: FunctionHooks = {
      onEnd: () => brain.processStage(FunctionStage.End),
      onSuccess: (result: unknown) => brain.processStage(FunctionStage.Success, result),
      onError: (error: Error) => brain.processStage(FunctionStage.Error, error),
      onStart: (fn, ...args) => brain.processStage(FunctionStage.Start, [fn, ...args]),
    };

    return hookFunction(
      fn,
      {
        hooks,
        shouldWait: mergedOptions.mode === Mode.Continuous,
      },
      ...args,
    );
  };
}

export function withInspection<F extends AnyFunction>(fn: F, options: InspectorOptions = createPracticalStrategy()) {
  const callerLocation = determineCallerLocation(withInspection.name);

  const inspectedFunction = (...args: Parameters<F>) => {
    const inspector = createFunctionProcessor({
      ...options,
      metadata: {
        callerLocation,
      },
    });

    return createContext().run(() => inspector(fn, ...args));
  };

  return taggableFunction(inspectedFunction, fn);
}
