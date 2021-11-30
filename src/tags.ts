import { Tag } from './context/index.js';
import { AnyFunction, Anything } from './core/types.js';

export type TaggableFunction<F extends AnyFunction> = {
  (...args: Parameters<F>): ReturnType<F>;
  addTag: (tag: Tag) => TaggableFunction<F>;
};

const TAG_SYMBOL = Symbol('f:tag');

export function createTag<T extends Tag>(tag: T) {
  return tag;
}

export function isTag<T extends Tag>(tagToCheck: Tag, tag: T): tagToCheck is T {
  return tagToCheck.id === tag.id;
}

export function getTags<F extends AnyFunction>(fn: F) {
  return ((fn as Anything)[TAG_SYMBOL] || []) as Tag[];
}

export function applyTag<F extends AnyFunction>(fn: F, tag: Tag) {
  const intermediate = fn as Anything;

  intermediate[TAG_SYMBOL] = (intermediate[TAG_SYMBOL] || []).concat(tag);

  return fn;
}

export function taggableFunction<F extends AnyFunction, FB extends AnyFunction>(fn: F, bridgeFn?: FB) {
  const intermediate = fn as Anything;

  intermediate.addTag = (tag: Tag) => {
    if (bridgeFn) {
      applyTag(bridgeFn, tag);

      return intermediate;
    }
    return applyTag(intermediate, tag);
  };

  return intermediate as TaggableFunction<F>;
}
