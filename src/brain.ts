import { Config, Mode } from './config.js';
import { getContext, Status } from './context/index.js';
import { toFunction } from './core/converters.js';
import { AnyFunction, Anything } from './core/types.js';
import { EndCallback, Inspector, StartCallback, SuccessCallback, ErrorCallback } from './inspectors/index.js';
import { Shipper } from './shippers/index.js';
import { getTags } from './tags.js';
import { determineSize } from './utils.js';

export type Unit = Inspector | Shipper;
export type Metadata = {
  callerLocation: string;
};
export type BrainOptions = { units: Unit[]; options: Config; metadata: Metadata };

type CallbackMap = {
  start: StartCallback[];
  success: SuccessCallback[];
  error: ErrorCallback[];
  end: EndCallback[];
};

type UnitMap = {
  inspectors: CallbackMap;
  shippers: CallbackMap;
};

export enum FunctionStage {
  Start = 'START',
  End = 'END',
  Error = 'ERROR',
  Success = 'SUCCESS',
}

function getSortedMap(units: Unit[]) {
  // TODO: Shouldn't be that much but candidate for optimization;
  return units.reduce<UnitMap>(
    (agg, unit) => {
      if (unit.type === 'inspector') {
        if (unit.onStart) agg.inspectors.start.push(unit.onStart);
        if (unit.onSuccess) agg.inspectors.success.push(unit.onSuccess);
        if (unit.onError) agg.inspectors.error.push(unit.onError);
        if (unit.onEnd) agg.inspectors.end.push(unit.onEnd);
      }

      if (unit.type === 'shipper') {
        if (unit.onStart) agg.shippers.start.push(unit.onStart);
        if (unit.onSuccess) agg.shippers.success.push(unit.onSuccess);
        if (unit.onError) agg.shippers.error.push(unit.onError);
        if (unit.onEnd) agg.shippers.end.push(unit.onEnd);
      }

      return agg;
    },
    {
      inspectors: {
        start: [],
        success: [],
        error: [],
        end: [],
      },
      shippers: {
        start: [],
        success: [],
        error: [],
        end: [],
      },
    },
  );
}

function doParallel(functionList: AnyFunction[]) {
  return Promise.all(functionList.map((f) => f()));
}

async function doSequence(functionList: AnyFunction[]) {
  for (const fn of functionList) {
    await fn();
  }
}

export function createBrain({ units, options, metadata }: BrainOptions) {
  const context = getContext();
  const { shippers, inspectors } = getSortedMap(units);

  const { telemetry, tags } = context;

  telemetry.saveLocation(metadata.callerLocation);

  const processStage = async (stage: FunctionStage, data?: Anything) => {
    const handler = options.mode === Mode.Continuous ? doSequence : doParallel;

    try {
      if (stage === FunctionStage.Start) {
        telemetry.saveStartTimestamp(Date.now());
        const [fn, ...args] = data;

        telemetry.saveName(fn.name);
        telemetry.saveParameters(args);
        tags.save(getTags(fn));
        await handler(inspectors.start.map((s) => toFunction(s(context, fn, ...args))));
        await handler(shippers.start.map((s) => toFunction(s(context, fn, ...args))));

        telemetry.saveFunctionStartTimestamp(Date.now());

        return;
      }

      if (stage === FunctionStage.Success) {
        telemetry.saveFunctionEndTimestamp(Date.now());
        telemetry.saveStatus(Status.Success);

        // Performance hungry
        options.calculateResultSize && telemetry.saveResultSize(determineSize(data));

        await handler(inspectors.success.map((s) => toFunction(s(context, data))));
        await handler(shippers.success.map((s) => toFunction(s(context, data))));

        return;
      }

      if (stage === FunctionStage.Error) {
        telemetry.saveFunctionEndTimestamp(Date.now());
        telemetry.saveStatus(Status.Failed);
        telemetry.saveError(data);
        await handler(inspectors.error.map((s) => toFunction(s(context, data))));
        await handler(shippers.error.map((s) => toFunction(s(context, data))));
        return;
      }

      telemetry.saveEndTimestamp(Date.now());

      await handler(inspectors.end.map((s) => toFunction(s(context))));
      await handler(shippers.end.map((s) => toFunction(s(context))));
    } catch (error) {
      console.error('Stage processing failed', error);
    }
  };

  return {
    processStage,
  };
}
