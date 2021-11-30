import { StoreSlice } from './store.js';

export type Insights = Record<string, unknown>;

export type InsightsOptions = {
  store: StoreSlice<Insights>;
};

export function createInsightsContext({ store }: InsightsOptions) {
  return {
    save: (newInsights: Insights) => {
      store.set(newInsights);
    },
    getAll: () => store.get(),
    getValue: (key: string) => store.get()[key],
  };
}
