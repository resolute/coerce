import type { To } from './types.js';

/**
 * Pipe/flow/chain the input and output of each function
 */
const pipe = <S extends (value: any) => any>(
  value: unknown,
  functions: S[],
  index: number,
): ReturnType<S> => {
  if (index === functions.length) {
    return value as ReturnType<S>;
  }
  const newValue = functions[index](value);
  return pipe(newValue, functions, index + 1);
};

/**
 * Throw Error or throw user-passed function or return a default value
 */
const handleFailure = <U>(otherwise: U, error: Error) => {
  if (typeof otherwise === 'function') {
    throw otherwise(error);
  }
  if (typeof otherwise === 'object' && otherwise instanceof Error) {
    throw otherwise;
  }
  return otherwise as Exclude<U, Function | Error>;
};

/**
 * Coerce a value `.to()` specified type `.or()` on failure return a default
 * value or throw an `Error`.
 */
export const coerce = <I>(value: I): To<I> => ({
  /**
   * `.to()` one or many sanitizer functions
   */
  to: (...sanitizers: Array<(value: any) => any>) => ({
    /**
     * `.or()` return a default value, throw a specific `Error`, or throws a the
     * `Error` returned from a function.
     */
    or: <U>(otherwise: U) => {
      try {
        return pipe(value, sanitizers, 0);
      } catch (error) {
        return handleFailure(otherwise, error);
      }
    },
  }),
});

export default coerce;
export * from './primitive.js';
export * from './validator.js';
export * from './mutator.js';
