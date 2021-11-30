import { Status } from '../context/index.js';
import { createShipper, ShipperName } from './factories.js';
import { createPrettyTemplate, PrettyTemplateOptions } from './pretty-template.js';

export type TerminalShipperOptions = Pick<PrettyTemplateOptions, 'showTimeFrame' | 'verbose'> & {
  pretty?: boolean;
  logger?: typeof console;
  statuses?: Status[];
};

export const createTerminalShipper = ({
  pretty = true,
  logger = console,
  statuses = [Status.Failed],
  showTimeFrame,
  verbose,
}: TerminalShipperOptions = {}) =>
  createShipper({
    id: ShipperName.Console,
    onEnd: (context) => {
      const { name, location, status, error, parameters, timing, resultSize } = context.telemetry.get();
      const duration = timing.end - timing.start;
      const tags = context.tags.get();
      const insights = context.insights.getAll();

      const data = {
        status,
        parameters,
        error,
        name,
        location,
        tags,
        duration,
        resultSize,
        timing,
        insights,
      };

      const logMethodByStatus = {
        [Status.Success]: logger.info,
        [Status.Failed]: logger.error,
        [Status.Pending]: logger.log,
      };

      if (!statuses.includes(status)) return;

      if (pretty) {
        logMethodByStatus[status](createPrettyTemplate({ ...data, showTimeFrame, verbose }));
        return;
      }

      logMethodByStatus[status](JSON.stringify(data, null, 2));
    },
  });
