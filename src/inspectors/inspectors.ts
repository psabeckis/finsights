import { createInspector } from './factories.js';

export const memoryInspector = createInspector(() => {
  const memory: {
    before: number;
    after: number;
  } = {
    before: 0,
    after: 0,
  };

  return {
    onStart: async () => {
      memory.before = process.memoryUsage.rss();
    },
    onEnd: async ({ insights }) => {
      memory.after = process.memoryUsage.rss();

      insights.save({ memory });
    },
  };
});

export const resultInspector = createInspector(() => ({
  onSuccess: ({ insights }, result) => {
    insights.save({
      result,
    });
  },
}));
