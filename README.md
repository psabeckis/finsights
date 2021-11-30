<h1 align="center">Finsights</h1>
<p align="center">A zero dependency declarative library for nodejs to inspect and make decisions when executing functions </p>

<p align="center">
  <a href="https://www.npmjs.com/package/finsights" target="_blank"><img src="https://img.shields.io/npm/v/finsights.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/finsights" target="_blank"><img src="https://img.shields.io/npm/l/finsights.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/finsights" target="_blank"><img src="https://img.shields.io/npm/dm/finsights.svg" alt="NPM Downloads" /></a>
  <a href="https://circleci.com/gh/psabeckis/finsights" target="_blank"><img src="https://img.shields.io/circleci/project/github/psabeckis/finsights/main.svg" alt="CircleCI" /></a>
  <a href="https://github.com/psabeckis/finsights/blob/main/README.md?plain=1"><img src="https://img.shields.io/github/stars/psabeckis/finsights.svg?style=social&label=Stars" alt="Github stars"/></a>
</p>

## Motivation

Separating business from application logic, monitoring, logging and other different kind of side effects (not to mention other business logic) has always been the most challenging part in maintaining some sort of software separation. This involves detailed code reviews, instrumenting code with all kinds of different libraries with different api's to make things less intrusive while still trying to maintain a project structure and some logic separation. This library won't solve all of those problems, but hopefully will help to draw some lines between those layers.

## Getting started

Install the library

1. Using npm or yarn:

   ```sh
   $ npm install finsights

   #or

   $ yarn add finsights
   ```

2. Import the library and wrap a function of your choice

   ```typescript
   import { withInspection, createShowOffStrategy } from 'finsights';

   const _exampleFunction = () => {
     console.log('exampleFunction');
     // throw Error('Some error');
     return 'Processed string';
   };

   const exampleFunction = withInspection(_exampleFunction, createShowOffStrategy());

   (async () => {
     await exampleFunction();
   })();
   ```

3. Start the program and you should see one of these (with some color) when the function was called (depending on the implementation of course)

   ```sh
    (SUCCESS) - _exampleFunction();
    Location: file:///Experiments/finsights-test-esm/index.js:8:25
    Time frame: (Start) 2021-11-30T18:44:54.212Z -> (End) 2021-11-30T18:44:54.214Z
    Duration: Full - 2 ms (0.002 s) Function actual - 2 ms (0.002 s) Library overhead - 0 ms (0 s)
    Size: Result size - 18 bytes (0.018 Kb)
    Parameters:
    []
    Insights:
    {
      "memory": {
        "before": 36237312,
        "after": 36384768
      },
      "result": "Processed string"
    }

    #or

    Location: file:////Experiments/finsights-test-esm/index.js:9:25
    Time frame: (Start) 2021-11-30T18:51:50.195Z -> (End) 2021-11-30T18:51:50.198Z
    Duration: Full - 3 ms (0.003 s) Function actual - 2 ms (0.002 s) Library overhead - 1 ms (0.001 s)
    Error:
    Error: Some error
        at _exampleFunction (file:///Experiments/finsights-test-esm/index.js:5:9)
        at /Experiments/node_modules/finsights/lib/cjs/core/enhancers.js:27:34
        at Generator.next (<anonymous>)
        at fulfilled (/Experiments/node_modules/finsights/lib/cjs/core/enhancers.js:5:58)
    Parameters:
    []
    Insights:
    {
      "memory": {
        "before": 36786176,
        "after": 36933632
      }
    }
   ```

4. That's it, if you want to profile your functions and see how they perform, if not please read on.

## Philosophy

The main focus of this library is to provide a declarative, extensible and most importantly easy to use tool to track instrument and react to different function properties and/or execution workflows.

## Core concepts

As shown in the example you can use the library only by wrapping your function with a higher order function called `withInspection`, there are more building blocks to this however.

### Strategies

Are the largest building blocks in the library and provide a convenient way to apply `Inspectors`/`Shippers` (more on these below) and configuration overrides to the higher order function. Strategies can be merged with each other and can be provided other values, or factory functions to be conditionally aware

Creating a strategy:

```typescript
import { createStrategy } from 'finsights';

const myNewAwesomeStrategy = createNewAwesomeStrategy();
const createNewAwesomeStrategy = ({ noShipments }: { noShipments?: boolean }) => {
  return createStrategy(noShipments ? [awesomeNewInspector] : [awesomeNewInspector, awesomeNewShipper]);
};
```

Merging strategies:

```typescript
import { mergeStrategies } from 'finsights';

mergeStrategies(myNewAwesomeStrategy, createNewAwesomeStrategy({ noShipments: true }));
```

The only thing important here is the order more about that in the [Lifecycle](#Lifecycle) section.

Built in strategies:

`ShowOffStrategy` - This is included to print out everything either on successful or failed function calls. Can be included as in the general example by importing and supplying `createShowOffStrategy` to the inspection function.

`PracticalStrategy` - Implementation wise it's pretty much the same as the "show off", but with things dialed down for practical use, logs only on failed calls, doesn't include verbose output unless configured via options. Is included as the default for `withInspection` higher order function, thus, just supply your own function you want to track.

### Inspectors

`Inspectors` are meant (judging by the name) to inspect the function itself, parameters provided, results returned or even to further process results of other `Inspectors`. These units can "hook" into the different parts of function lifecycle and do processing. `Inspectors` also accept a function as a parameter, to maintain state between lifecycle events.

Creating an inspector:

```typescript
const createGeneralInspector = () =>
  createInspector({
    id: 'general-inspector',
    onStart: (context, fn, ...args) => {
      console.log(context, fn, ...args);
    },
    onSuccess: (context, result) => {
      console.log(context, result);
    },
    onError: (context, error) => {
      console.log(context, error);
    },
    onEnd: (context) => {
      console.log(context);
    },
  });
```

Maintaining state inside an inspector:

```typescript
const timingInspector = createInspector(() => {
  const timing: { start: number; end: number } = {
    start: 0,
    end: 0,
  };

  return {
    onStart: () => {
      timing.start = performance.now();
    },
    onEnd: () => {
      timing.end = performance.now();

      console.log('Function performance (ms)', timing.end - timing.start);
    },
  };
});
```

Built in inspectors

`Memory inspector` - Tracks application memory usage before and after function execution, kind of gimmicky but also included as an example and might be of use at some point.

`Result inspector` - Adds results to function insights to process or ship later, purely for example purpose as this might be performance heavy.

### Shippers

Shippers are meant to execute side effects, whether those are shipping logs, emitting events and such. At the moment Shippers are pretty much like `Inspectors` in terms of api, the only and major difference is the lifecycle. **Shippers always run after Inspectors**.

Both of the types have a **type** and an optional **id** (which you can provide) property attached to them after creation, meaning you as an engineer can sort them inside strategies by those types as well.

Build in shippers

`Terminal shipper` - This shipper prints the output in a (depends on the taste) pretty fashion, or a json with all of the data if configured differently. Just import `createTerminalShipper` into your strategy and you're good to go.

### Tags

Tags have a different purpose and meaning entirely. Once you have a proper strategy for function tracking in place, it might be cumbersome to adjust that implementation for every single function you track. By marking a function with a created tag it will be visible for `Shippers`/`Inspectors` to react accordingly, take in the example below.

Analytics reporting example with tags:

```typescript
import { withInspection, createStrategy, createShipper, createTag } from 'finsights';

// Imaginary analytics reporting function
const reportToAnalytics = (event: string, result: string) => {
  console.log(`Analytics event ${event} fired =`, result);
};

// We create a tag to reference either in inspectors/shippers as well as in our business code
const ReportToAnalytics = createTag({ id: 'report-analytics', event: 'result-tracking' });

const analyticsShipper = createShipper({
  onSuccess: (context, result) => {
    const analyticsTag = context.tags.find(ReportToAnalytics);

    if (!analyticsTag) return;

    reportToAnalytics(analyticsTag.event, result);
  },
});

const _capturedFunction = () => {
  return 'Capture result';
};
const _notCapturedFunction = () => {
  return 'Do not capture this result';
};

const analyticsStrategy = createStrategy([analyticsShipper]);

// We tag this function so that we know that once it's executed it will be reported
const capturedFunction = withInspection(_capturedFunction, analyticsStrategy).addTag(ReportToAnalytics);

const notCapturedFunction = withInspection(_notCapturedFunction, analyticsStrategy);

(async () => {
  await capturedFunction(); // this send the results to the analytics system
  await notCapturedFunction(); // this one will not be tracked
})();
```

This might look like a lot of code at first glace, but this takes all the steps above to have a working demo. Once strategies, shippers and `Inspectors` are in place, all you need to do is mix and match them and create a workflow of your own.

### The Context

Context is the entity that bridges everything together it provides a fresh new storage for the information for every function execution context, even if the functions are nested and tracked independently, the information is isolated and available to for shippers/`Inspectors` and the actual function itself.

Context provides:

`tags` - As we seen in the example below, context provides an implementation for you to find, get and even update tags throughout the workflow

`telemetry` - As shown in the [Getting started](#Getting-started) example, telemetry is being gathered through out the whole workflow (except some heavy operations), it can be overwritten and changed based on the need. Either way it provides a lot of useful information regarding function execution, such as timings, parameters, function location and etc.

`insights` - Insights is just a write through storage a bucket to pass down information from one `Inspector` to other inspectors and of course shippers to actually conduct side effects, such as logging, metrics, analytics and even more.

## Lifecycle

There are two modes available `Continuous` (Default) and `Loose`.

`Continuous` - This mode tries to keep things in order, meaning `Inspectors` run in order, `Shippers` run in order and only after all of the `Inspectors` have finished their tasks. The only non awaited part is the actual `onEnd` hook, because there is nothing left to inspect, just ship it.

`Loose` - This mode on the other hand let's thing flow a bit chaotically meaning the execution order is the same, but nothing is waited for and executed in parallel. If a performance concern is valid, you're welcome to try it out. (By the way, `telemetry` contains metrics for the actual function execution and the library itself)

## Configuration

Configuration is pretty basic at the moment. It can be configured globally or applied to a strategy, which takes precedence over default configuration. Bellow is an example on how to configure `finsights` on both levels.

```typescript
import { createStrategy, config, Mode } from 'finsights';

config.set({
  // Does not ensure the execution of functions - (Default: 'Continuous')
  mode: Mode.Continuous,
  // Prevents arrow functions of being used for inspection to enforce automatic name resolution - (Default: false)
  noArrowFunctions: false,
  // Tries to determine and track result size, incurs performance costs at large datasets - (Default: false)
  calculateResultSize: false,
});

createStrategy([]), { mode: Mode.Continuous, noArrowFunction: true, calculateResultSize: true };
```

## Creative ideas and examples

TBD. I have a number of useful scenarios outlined in notes, will add those one by one once examples are implemented. If you have any specific workflow in mind, raise an issue and I will try to help out or come up with an example.

## Limitations

Like many of libraries, some known limitations are present

### Always asynchronous

Due to the nature of the engine and language, `finsights` will always provide an asynchronous function after wrapping with `withInspection`. Due to the number of build/transpilation tools, it's impossible to determine if a function is sync or async without actually calling it.

### Serializable data

Data that is passed through `telemetry` `tags` and `insights` should be serializable, otherwise in some unfortunate scenario it will be lost and things might break :). Use tags and strategy/shipper/inspector compositions to achieve any dynamic flow you desire.

### Named functions

While not required, it would be a good practice to name your functions. Adding an anonymous function to `withInspection` will yield results, but it will be named `"Arrow Function (Anonymous)"`, might not be that informative in logging, monitoring scenarios. There's also an option in the [Configuration](#Configuration) to enforce this, but it's turned of by default.

## Tips

### Function naming

Based on the limitations above and for developer convenience I've came across a nice pattern to retain the original function name. I name the unwrapped functions as follows `_unwrappedFunction` or `unwrappedFunction_`, that way it can be provided into `withInspection` and the resulting name can be named `unwrappedFunction` meaning everywhere in the code you won't need to see underscores. Observability wise the name will be visible in logging platforms or in the terminal.

Example:

```typescript
// ------------------------- magic.ts ------------------------------
import { withInspection } from 'finsights';

function _doSomeMagic() {
  console.log('Here you go');
}

export const doSomeMagic = withInspection(_doSomeMagic);

// ------------------------- program.ts ------------------------------
import { doSomeMagic } from './magic';

doSomeMagic();
```

### Parameter/Result redaction

Due to wanting to leave this library without dependencies, I haven't included any redaction library to filter out unnecessary data from parameters and function results. There are plenty of loggers and redaction tools which accomplish that. Also what's secret for my use-case might not be secret for yours and vice versa. Nevertheless, I doo think it would be trivial to implement a redaction inspector or shipper. If you need help, reach out via issues.

## Roadmap

- Unit tests (Before any features or refactorings)
- Examples
- More built in inspectors/shippers or strategies depending on new ideas, proposals or issues if they fit the scope of the library of course :)
- Visualize and have a structure of an execution map, the ability to gather all information from all function calls in a single report
- Instrumentation shippers/inspector to continue the flow across distributed systems (e.g microservices)
- Worker thread, span, fork shippers for heavy duty workloads

## Final words

- Raise issues if you need any help, find bugs or know ways how to improve the functionality.
- Provide feedback

## Api reference

[Api Reference](REFERENCE.md)

## Contribution guidelines

TBD - If you want to contribute drop a PR and we'll talk.

- Commit message format used - https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint

## License

[MIT](LICENSE.md)
