// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction<R = any> = (...args: any[]) => R;
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Anything = any;
