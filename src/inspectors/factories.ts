import { Context } from '../context/index.js';
import { AnyFunction, Anything } from '../core/types.js';

export type StartCallback = (context: Context, fn: AnyFunction, ...args: Anything[]) => void;
export type SuccessCallback = (context: Context, result?: Anything) => void;
export type ErrorCallback = (context: Context, error: Anything) => void;
export type EndCallback = (context: Context) => void;

export type Inspector = {
  id?: string;
  onStart?: StartCallback;
  onSuccess?: SuccessCallback;
  onError?: ErrorCallback;
  onEnd?: EndCallback;
  type: 'inspector';
};

export type InspectorDefinition = Omit<Inspector, 'type'>;

function addProperties(definition: InspectorDefinition): Inspector {
  return {
    ...definition,
    type: 'inspector',
  };
}

export function createInspector(fnOrInspector: InspectorDefinition | (() => InspectorDefinition)) {
  if (typeof fnOrInspector === 'function') {
    return addProperties(fnOrInspector());
  }
  return addProperties(fnOrInspector);
}
