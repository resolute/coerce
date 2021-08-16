import type { Coerce } from './types.js';

/**
 * 1. throw Error; or
 * 2. throw error function factory; or
 * 3. return the `otherwise` value
 */
const failure = <U>(error: Error, otherwise: U) => {
  if (typeof otherwise === 'function') {
    throw otherwise(error);
  }
  if (typeof otherwise === 'object' && otherwise instanceof Error) {
    throw otherwise;
  }
  return otherwise;
};

/**
 * Pipe the input through coerce functions
 */
const pipe = <V, C extends (value: any) => any>(value: V, coercer: C) =>
  coercer(value);

/**
 * Handles issues where passing otherwise: undefined triggers the default
 * TypeError value. This workaround determines if the default otherwise:
 * TypeError should be used based on the argument count passed to the function.
 * This is instead of simply using a default parameter value, which would not
 * work in the case where undefined is passed.
 */
const params = (args: unknown[]) => {
  if (args.length === 1) {
    return [args[0] as unknown, TypeError] as const;
  }
  return args;
};

/**
* Coerce a value
* `coerce(...coercers)(value[, default])`
*
* @example
* // trim a string and confirm it is not empty
* const trimCheckEmpty = coerce(string, trim, nonEmpty);
*
* trimCheckEmpty(' foo '); // 'foo'
* trimCheckEmpty('     '); // Error
*
* // alternatively, return undefined instead of throwing error
* trimCheckEmpty('     ', undefined); // undefined
*
*/
export const coerce: Coerce = (...coercers: any[]) =>
  (...args: unknown[]) => {
    const [value, otherwise] = params(args);
    try {
      return coercers.reduce(pipe, value);
    } catch (error) {
      return failure(error, otherwise);
    }
  };

export default coerce;
export * from './primitive.js';
export * from './validator.js';
export * from './mutator.js';
export type { Coerce, Coercer } from './types.js';
