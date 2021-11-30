import { Anything } from './core/types.js';

export function determineCallerLocation(targetFunctionName: string) {
  const stack = new Error().stack?.split('\n') || [];

  if (!stack.length) return 'Location not found';

  const inspectFunctionIndex = stack.findIndex((v) => v.includes(`at ${targetFunctionName}`));

  if (inspectFunctionIndex === -1 || inspectFunctionIndex === stack.length - 1) return 'Location not found';

  // inspectedFunction wraps the source function, thus is second in the stack after the actual call
  // look into how to instrument this for more robust mechanism to locate the actual function called

  return stack[inspectFunctionIndex + 1].trim().replace('at ', '');
}

export function bytes(text: string) {
  return ~-encodeURI(text).split(/%..|./).length;
}

export function determineSize(stringOrObject: Anything) {
  return bytes(JSON.stringify(stringOrObject));
}
