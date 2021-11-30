import { AnyFunction, Anything, Awaited, noop } from './types.js';

export type FunctionHooks = {
  onStart?: (fn: AnyFunction, ...args: Anything[]) => void | Promise<void>;
  onSuccess?: (result: Anything) => void | Promise<void>;
  onError?: (error: Anything) => void | Promise<void>;
  onEnd?: () => void | Promise<void>;
};

export type HookFunctionOptions = {
  hooks: FunctionHooks;
  shouldWait?: boolean;
};

export async function hookFunction<F extends AnyFunction>(
  fn: F,
  options: HookFunctionOptions,
  ...args: Parameters<F>
): Promise<Awaited<ReturnType<F>>> {
  const { shouldWait, hooks } = options;
  const { onStart, onEnd, onError, onSuccess } = hooks;

  const handle = <T extends AnyFunction>(fn?: T) => {
    if (!fn) return noop;

    return async (...args: Parameters<T>) => {
      shouldWait ? await fn(...args) : fn(...args);
    };
  };

  try {
    await handle(onStart)(fn, ...args);

    const result = await fn(...args);

    await handle(onSuccess)(result);

    return result;
  } catch (error) {
    await handle(onError)(error);

    throw error;
  } finally {
    await handle(onEnd)();
  }
}
