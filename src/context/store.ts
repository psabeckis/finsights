import { AsyncLocalStorage } from 'async_hooks';
import { AnyFunction, Anything } from '../core/types.js';

type ExecutionMap = {
  [key: number]: number[];
};

type StoreMap = {
  globalExecutionId: number;
  executionMap: ExecutionMap;
  [key: number]: ReturnType<typeof createStore>;
};

export type StoreSlice<S> = {
  get: () => S;
  set: (newData: Partial<S>) => void;
};

const INITIAL_EXECUTION_ID = 1;
const executionIdStore = new AsyncLocalStorage<number>();
const continuousStorage = new AsyncLocalStorage<StoreMap>();

function createStoreSlice<S>(slice: S): StoreSlice<S> {
  return {
    get: () => slice,
    set: (newData: Partial<S>) => {
      Object.assign(slice, newData);
    },
  };
}

function createStore() {
  const data: Record<string, Anything> = {};

  return {
    useSlice: <S>(sliceName: string, defaultValue: S) => {
      if (!data[sliceName]) data[sliceName] = defaultValue;

      return createStoreSlice<S>(data[sliceName]);
    },
    getSlice: <S>(sliceName: string) => createStoreSlice<S>(data[sliceName]),
    ...createStoreSlice(data),
  };
}

export function getStore() {
  const store = continuousStorage.getStore();
  const executionId = executionIdStore.getStore();

  if (!executionId) {
    throw new Error('ExecutionId was not defined');
  }

  if (!store) {
    throw new Error('Store was not initialized thus not available');
  }

  return store[executionId];
}

function createStoreMap(): StoreMap {
  return {
    globalExecutionId: INITIAL_EXECUTION_ID,
    executionMap: {
      [INITIAL_EXECUTION_ID]: [],
    },
    [INITIAL_EXECUTION_ID]: createStore(),
  };
}

// TODO: Move out execution tracking and executionId creation somewhere else
function trackFurtherExecution(store: StoreMap, executionId: number, previousExecutionId: number) {
  store.executionMap[previousExecutionId].push(executionId);
  store.executionMap[executionId] = [];
  store.globalExecutionId = executionId;
  store[executionId] = createStore();
}

export function logStoreMap() {
  const store = continuousStorage.getStore();

  // console.log('Store map', store);

  if (!store) return;

  const { executionMap } = store;

  const generateFlow = (execId: number): Anything => {
    const children = executionMap[execId];

    if (!children.length) return [execId, []];

    return [execId, children.map(generateFlow)];
  };

  const findFunctionName = (execId: number) => {
    const execStore = store[execId];

    const insights = execStore.getSlice('insights') as Anything;

    return insights.get().name;
  };

  const flow = generateFlow(INITIAL_EXECUTION_ID);

  const printFlow = (flow: Anything, indent = 0) => {
    const [execId, rest] = flow;
    const name = findFunctionName(execId);

    console.log(`${Array(indent).fill('    ').join('')}F(${name})`);

    if (!rest.length) return;

    rest.forEach((i: Anything) => {
      printFlow(i, indent + 1);
    });
  };

  printFlow(flow);
  // console.log(
  //   Object.keys(executionMap).map((k) => {
  //     const execStore = store[Number(k)];

  //     const insights = execStore.getSlice('insights') as any;

  //     return insights.get().name;
  //   }),
  // );
}

export function runInStoreContext<F extends AnyFunction>(fn: F) {
  const store = continuousStorage.getStore();
  const executionId = executionIdStore.getStore();

  if (store && executionId) {
    const newExecutionId = store.globalExecutionId + 1;
    return executionIdStore.run(newExecutionId, () => {
      trackFurtherExecution(store, newExecutionId, executionId);
      return fn();
    });
  }

  return continuousStorage.run(createStoreMap(), () => {
    return executionIdStore.run(INITIAL_EXECUTION_ID, () => {
      return fn();
    });
  }) as ReturnType<F>;
}
