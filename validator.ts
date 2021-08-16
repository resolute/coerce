/**
 * Confirm string is _not_ empty
 */
export const nonempty = (value: string) => {
  if (value === '') {
    throw new TypeError('Empty string');
  }
  return value;
};
export const nonEmpty = nonempty;

/**
 * Confirm input is _not_ 0
 */
export const nonzero = (value: number) => {
  if (value !== 0) {
    return value;
  }
  throw new TypeError(`“${value}” must be a non-zero number.`);
};
export const nonZero = nonzero;

/**
 * Confirm that input is greater than 0
 */
export const positive = (value: number) => {
  if (value > 0) {
    return value;
  }
  throw new TypeError(`“${value}” is not a positive number.`);
};

/**
 * Confirm that input is less than 0
 */
export const negative = (value: number) => {
  if (value < 0) {
    return value;
  }
  throw new TypeError(`“${value}” is not a negative number.`);
};

/**
 * Confirm the `value` is within `list` (a.k.a. Enum)
 */
export const within = <T extends string | number | boolean | object>(list: T[]) =>
  /**
    * Confirm the `value` is within `list` (a.k.a. Enum)
    */
  (value: unknown) => {
    const index = list.indexOf(value as T);
    if (index >= 0) {
      return list[index];
    }
    throw new TypeError(`“${value}” must be one of ${list}`);
  };
