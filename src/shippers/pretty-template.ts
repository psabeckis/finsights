import { TagMap, Telemetry } from '../context/index.js';
import { toDuration, toSize } from '../core/converters.js';
import { separator, Style, style, Symbols, DISPLAY_LENGTH } from '../core/terminal.js';
import { Anything } from '../core/types.js';

export type PrettyTemplateOptions = {
  status: string;
  parameters: Anything[];
  error?: Error;
  name: string;
  location: string;
  tags: TagMap;
  resultSize: number;
  timing: Telemetry['timing'];
  insights: Record<string, Anything>;
  showTimeFrame?: boolean;
  verbose?: boolean;
};

function printStatus(status: string) {
  const colorMap: { [key: string]: Style } = {
    SUCCESS: Style.FgGreen,
    FAILED: Style.FgRed,
    PENDING: Style.BgYellow,
  };
  return style(colorMap[status], status);
}

function printFunction(name: string, parameters: Anything[]) {
  const processedParameters = parameters.map((p) => {
    if (typeof p === 'string') {
      return `'${p}'`;
    }

    if (['number', 'boolean'].includes(typeof p)) {
      return p;
    }

    if (typeof p === 'function') {
      return p.name || '() => {...}';
    }

    return JSON.stringify(p);
  });

  const parameterString = processedParameters.join(', ');
  const additionalSymbolCount = 3;
  const parameterSuffix = '...(digest too long)';

  const remainingLength = DISPLAY_LENGTH - name.length - additionalSymbolCount;
  const digest =
    parameterString.length <= remainingLength
      ? parameterString
      : `${parameterString.substr(0, remainingLength - parameterSuffix.length)}${parameterSuffix}`;

  return `${name}(${digest});`;
}

function printError(error?: Error) {
  if (!error) return;

  return [error && style(Style.Bright, `Error:`), error && error.stack].join(Symbols.NewLine);
}

function printLocation(location: string) {
  return `${style(Style.Bright, 'Location: ')}${location}`;
}

function printTags(tags: TagMap) {
  const tagList = Object.values(tags)
    .map((t, index) => `#${index + 1} - ${JSON.stringify(t)}`)
    .join('\n');

  if (!tagList.length) return;

  return [`${style(Style.Bright, `Tags:`)}`, tagList].join(Symbols.NewLine);
}

function printParameters(parameters: Anything[]) {
  return [`${style(Style.Bright, 'Parameters:')}`, JSON.stringify(parameters)].join(Symbols.NewLine);
}

function printTimeframe(timing: Telemetry['timing']) {
  return [
    `${style(Style.Bright, 'Time frame:')}`,
    `(Start) ${new Date(timing.start).toISOString()} -> (End) ${new Date(timing.end).toISOString()}`,
  ].join(' ');
}

function printDuration(timing: Telemetry['timing'], options: PrettyTemplateOptions) {
  const duration = toDuration(timing.end - timing.start);

  const header = `${style(Style.Bright, 'Duration:')}`;
  const fullDuration = `Full - ${style(Style.Bright, duration.toFriendly('ms'))} (${style(
    Style.Bright,
    duration.toFriendly('s'),
  )})`;

  if (!options.verbose) {
    return [header, fullDuration].join(' ');
  }

  const functionDuration = toDuration(timing.functionEnd - timing.functionStart);
  const overheadDuration = toDuration(duration.as('ms') - functionDuration.as('ms'));

  return [
    header,
    fullDuration,
    `Function actual - ${style(Style.Bright, functionDuration.toFriendly('ms'))} (${style(
      Style.Bright,
      functionDuration.toFriendly('s'),
    )})`,
    `Library overhead - ${style(Style.Bright, overheadDuration.toFriendly('ms'))} (${style(
      Style.Bright,
      overheadDuration.toFriendly('s'),
    )})`,
  ].join(' ');
}

function printSize(resultSize: number) {
  const size = toSize(resultSize);

  const sizeLine = [
    `${style(Style.Bright, 'Size:')}`,
    `Result size - ${style(Style.Bright, size.toFriendly('b'))} (${style(Style.Bright, size.toFriendly('kb'))})`,
  ].join(' ');

  return [sizeLine].join(Symbols.NewLine);
}

function printInsights(insights: Record<string, Anything>) {
  const hasInsights = !!Object.keys(insights).length;

  if (!hasInsights) return;

  return [`${style(Style.Bright, `Insights:`)}`, JSON.stringify(insights, null, 2)].join(Symbols.NewLine);
}

export function createPrettyTemplate(options: PrettyTemplateOptions) {
  const { name, location, status, error, parameters, tags, resultSize, timing, insights, showTimeFrame, verbose } =
    options;

  const lines = [
    separator,
    `(${printStatus(status)}) - ${printFunction(name, parameters)}`,
    printLocation(location),
    showTimeFrame && printTimeframe(timing),
    printDuration(timing, options),
    !error && resultSize !== 0 && printSize(resultSize),
    printError(error),
    printParameters(parameters),
    verbose && printTags(tags),
    verbose && printInsights(insights),
    separator,
  ];

  return lines.filter(Boolean).join(Symbols.NewLine);
}
