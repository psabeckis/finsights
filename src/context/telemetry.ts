import { Anything } from '../core/types.js';
import { StoreSlice } from './store.js';

export enum Status {
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Pending = 'PENDING',
}

export type Telemetry = {
  timing: {
    start: number;
    end: number;
    functionStart: number;
    functionEnd: number;
  };
  status: Status;
  location: string;
  error?: Error;
  name: string;
  parameters: Anything[];
  resultSize: number;
};

export type TelemetryOptions = {
  store: StoreSlice<Telemetry>;
};

export function createTelemetryContext({ store }: TelemetryOptions) {
  return {
    saveStartTimestamp: (timestamp: number) => {
      const data = store.get();

      store.set({
        timing: {
          ...data.timing,
          start: timestamp,
        },
      });
    },
    saveEndTimestamp: (timestamp: number) => {
      const data = store.get();

      store.set({
        timing: {
          ...data.timing,
          end: timestamp,
        },
      });
    },
    saveFunctionStartTimestamp: (timestamp: number) => {
      const data = store.get();

      store.set({
        timing: {
          ...data.timing,
          functionStart: timestamp,
        },
      });
    },
    saveFunctionEndTimestamp: (timestamp: number) => {
      const data = store.get();

      store.set({
        timing: {
          ...data.timing,
          functionEnd: timestamp,
        },
      });
    },
    saveLocation: (location: string) => {
      store.set({
        location,
      });
    },
    saveName: (name?: string) => {
      if (!name) return;

      store.set({
        name,
      });
    },
    saveStatus: (status: Status) => {
      store.set({
        status,
      });
    },
    saveError: (error: Error) => {
      store.set({
        error,
      });
    },
    saveParameters: (parameters: Anything[]) => {
      store.set({
        parameters,
      });
    },
    saveResultSize: (size?: number) => {
      if (typeof size === 'undefined') return;
      store.set({
        resultSize: size,
      });
    },
    get: store.get,
  };
}
