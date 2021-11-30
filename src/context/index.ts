import { createInsightsContext, Insights } from './insights.js';
import { runInStoreContext, getStore } from './store.js';
import { createTelemetryContext, Telemetry, Status } from './telemetry.js';
import { Tag, Tags, TagMap, createTagContext } from './tags.js';

export { Tag, TagMap, Tags, Status, Telemetry, Insights };

export type Context = ReturnType<typeof getContext>;

export function getContext() {
  const store = getStore();

  return {
    insights: createInsightsContext({
      store: store.useSlice<Insights>('insights', {}),
    }),
    telemetry: createTelemetryContext({
      store: store.useSlice<Telemetry>('telemetry', {
        timing: {
          start: 0,
          end: 0,
          functionStart: 0,
          functionEnd: 0,
        },
        name: 'Arrow Function (Anonymous)',
        location: 'Unknown',
        status: Status.Pending,
        parameters: [],
        resultSize: 0,
      }),
    }),
    tags: createTagContext({
      store: store.useSlice<Tags>('tags', {
        tags: {},
      }),
    }),
  };
}

export function createContext() {
  return {
    run: runInStoreContext,
  };
}
