import { nonEmpty, nonZero } from './validator.js';

/**
 * Coerce value to primitive `string`
 */
export const string = (value: string | number | bigint) => {
  if (typeof value === 'string') {
    return value;
  }
  if ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'bigint') {
    return value.toString();
  }
  throw new Error(`Unable to parse “${value}” as a string.`);
};

/**
 * Coerce value to `number`
 */
export const number = (value: string | number | bigint): number => {
  if (Number.isFinite(value)) {
    return value as number;
  }
  // remove everything except characters allowed in a number
  return number(Number(nonEmpty(string(value).replace(/[^0-9oex.-]/g, ''))));
};

/**
 * Coerce value to a valid `Date`
 */
export const date = (value: number | string | Date) => {
  const object = new Date(value);
  nonZero(object.valueOf());
  return object;
};

/**
 * Boolean
 */
interface Boolean {
  (): (value: unknown) => true | false;
  <T>(truthy: T): (value: unknown) => T | false;
  <T, F>(truthy: T, falsey: F): (value: unknown) => T | F;
  <T, F, N>(truthy: T, falsey: F, nully: N): (value: unknown) => T | F | N;
  <T, F, N, U>(truthy: T, falsey: F, nully: N, undefy: U): (value: unknown) => T | F | N | U;
}
export const boolean: Boolean =
  (truthy: any = true, falsy: any = false, nully: any = falsy, undefy: any = falsy) =>
    (value: unknown) => {
      switch (typeof value) {
        case 'undefined':
          return undefy;
        case 'string':
          // eslint-disable-next-line no-case-declarations
          const trimmed = value.trim();
          if (trimmed === '' || trimmed === 'null') {
            return nully;
          }
          if (trimmed === '0' || trimmed === 'false') {
            return falsy;
          }
          break;
        case 'number':
          if (value === 0 || !Number.isFinite(value)) {
            return falsy; // includes NaN
          }
          break;
        default:
          if (value === null) {
            return nully;
          }
          break;
      }
      return value ? truthy : falsy;
    };

const isIterable = <T>(value: Iterable<T> | any): value is Iterable<T> => {
  if (typeof value === 'object' && value && typeof value[Symbol.iterator] === 'function') {
    return true;
  }
  return false;
};

/**
* `value` as an array if not an array
*/
export const array = <T>(value: T | T[] | Iterable<T>) => {
  if (Array.isArray(value)) {
    return value;
  }
  // a `string` _is_ Iterable, but we do not want to return an array of
  // characters
  if (typeof value !== 'string' && isIterable(value)) {
    return [...value];
  }
  return [value];
};
