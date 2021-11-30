import { Anything } from '../core/types.js';
import { StoreSlice } from './store.js';

export type Tag = { id: string } & Record<string, Anything>;

export type TagMap = Record<string, Tag>;

export type Tags = {
  tags: TagMap;
};

export type TagOptions = {
  store: StoreSlice<Tags>;
};

export function createTagContext({ store }: TagOptions) {
  return {
    save: (tags: Tag[]) => {
      store.set(tags.reduce<TagMap>((agg, t) => ({ ...agg, [t.id]: t }), {}));
    },
    get: () => store.get().tags,
    find: <T extends Tag>(tag: T) => store.get().tags[tag.id] as T | undefined,
  };
}
