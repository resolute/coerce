//#region Coerce
// -----------------------------------------------------------------------------

/**
 * 1. throw Error; or
 * 2. throw error function factory; or
 * 3. return the `otherwise` value
 */
const failure = <U>(error: Error, otherwise: U) => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (isFunction(otherwise)) {
    throw otherwise(error);
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (isInstance(Error)(otherwise)) {
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
      return failure(error as Error, otherwise);
    }
  };
//#endregion

//#region Type Guards
// -----------------------------------------------------------------------------

/**
 * Type guard string
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Type guard number
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Type guard bigint
 */
export const isBigInt = (value: unknown): value is bigint =>
  typeof value === 'bigint';

/**
 * Type guard function
 */
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

/**
 * Type guard object
 */
export const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

/**
 * Type guard array
 */
export const isArray = <T>(value: unknown): value is Array<T> =>
  Array.isArray(value);

/**
 * Type guard against `undefined` and `null`
 */
export const isDefined = <T>(value: T): value is NonNullable<T> =>
  typeof value !== 'undefined' && value !== null;

/**
 * Type guard instance
 */
export const isInstance = <T extends Constructor>(constructor: T) =>
  (value: unknown): value is InstanceType<T> =>
    isFunction(constructor) && value instanceof constructor;

//#endregion

//#region Validators
// -----------------------------------------------------------------------------

/**
 * Confirm string is _not_ empty
 */
export const nonempty = (value: string) => {
  if (value !== '') {
    return value;
  }
  throw new TypeError('Empty string');
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
 * Confirm value is defined
 */
export const defined = <T>(value: T) => {
  if (isDefined(value)) {
    return value;
  }
  throw new TypeError(`Unexpected ${value}`);
};

/**
 * Confirm value is an object
 */
export const object = <T>(value: T) => {
  if (isObject(value)) {
    return value;
  }
  throw new TypeError(`${value} is not an object.`);
};

/**
 * Confirm value is a function
 */
export const func = <T>(value: T) => {
  if (isFunction(value)) {
    return value;
  }
  throw new TypeError(`${value} is not a function.`);
};

/**
 * Confirm value is `instanceof` …
 */
export const instance = <T extends Constructor>(constructor: T) =>
  (value: unknown) => {
    if (isInstance(constructor)(value)) {
      return value;
    }
    throw new TypeError(`${value} is not an instance of ${constructor.name || constructor}.`);
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

//#endregion

//#region Primitives
// -----------------------------------------------------------------------------

/**
 * Coerce value to primitive `string`
 */
export const string = (value: string | number | bigint) => {
  if (isString(value)) {
    return value;
  }
  if ((isNumber(value) && Number.isFinite(value)) || isBigInt(value)) {
    return value.toString();
  }
  throw new TypeError(`Unable to parse “${value}” as a string.`);
};

export const nonstring = <T>(value: T) => {
  if (!isString(value)) {
    return value as Exclude<T, string>;
  }
  throw new TypeError(`${value} is a string.`);
};
export const nonString = nonstring;

/**
 * Coerce value to `number`
 */
export const number = (value: string | number | bigint): number => {
  if (isNumber(value)) {
    return value;
  }
  // remove everything except characters allowed in a number
  return number(Number(nonempty(string(value).replace(/[^0-9oex.-]/g, ''))));
};

/**
 * Coerce value to a valid `Date`
 */
export const date = (value: number | string | Date) => {
  const dateObject = new Date(value);
  nonZero(dateObject.valueOf());
  return dateObject;
};

/**
 * Boolean
 */
interface CoerceBoolean {
  (): (value: unknown) => true | false;
  <T>(truthy: T): (value: unknown) => T | false;
  <T, F>(truthy: T, falsey: F): (value: unknown) => T | F;
  <T, F, N>(truthy: T, falsey: F, nully: N): (value: unknown) => T | F | N;
  <T, F, N, U>(truthy: T, falsey: F, nully: N, undefy: U): (value: unknown) => T | F | N | U;
}
export const boolean: CoerceBoolean =
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

/**
 * Confirm `value` is Iterable
 */
export const iterable = <T>(value: Iterable<T> | T) => {
  try {
    object(value);
    func(value[Symbol.iterator]);
    return value as Iterable<T>;
  } catch {
    throw new Error(`${value} is not iterable.`);
  }
};

/**
 * `value` as an array if not an array
 */
interface CoerceArray {
  <T>(input: Iterable<T>): T[];
  <T>(input: T): T[];
}
export const array: CoerceArray = <T, U>(value: Iterable<T> | U) => {
  try {
    // a `string` _is_ Iterable, but we do not want to return an array of
    // characters
    const iterableValue = coerce(nonstring, iterable)(value);
    return [...iterableValue];
  } catch {
    return [value] as U[];
  }
};

//#endregion

//#region Mutators
// -----------------------------------------------------------------------------

/**
 * Remove dangerous characters from string
 */
export const safe = (value: string) =>
  value.replace(/[\\|";/?<>()*[\]{}=`\t\r\n]/g, '');

/**
 * Replace leading and trailing whitespace from a string
 * @warning Does _not_ remove half-space and other UTF SPACE-like characters. Chain
 * `spaces` before `trim` in order to remove these special SPACE characters from
 * the string.
 */
export const trim = (value: string) =>
  value.trim();

/**
 * Replace all SPACE-like characters with a regular SPACE. Replace continuous
 * multiple SPACE characters with a single SPACE.
 *
 * @see https://jkorpela.fi/chars/spaces.html
 */
export const spaces = (value: string) =>
  value
    .replace(
      // eslint-disable-next-line no-irregular-whitespace
      /[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g,
      ' ',
    )
    .replace(/\s+/g, ' ');

/**
 * Replace ' and " with ‘’ and “” respectively.
 */
export const quotes = (value: string) =>
  ([
    // triple prime
    [/'''/g, '‴'],
    // beginning "
    [/(\W|^)"(\w)/g, '$1“$2'],
    // ending "
    [/(“[^"]*)"([^"]*$|[^“"]*“)/g, '$1”$2'],
    // remaining " at end of word
    [/([^0-9])"/g, '$1”'],
    // double prime as two single quotes
    [/''/g, '″'],
    // beginning '
    [/(\W|^)'(\S)/g, '$1‘$2'],
    // conjunction possession
    [/([a-z])'([a-z])/gi, '$1’$2'],
    // abbrev. years like '93
    [
      /(‘)([0-9]{2}[^’]*)(‘([^0-9]|$)|$|’[a-z])/gi,
      '’$2$3',
    ],
    // ending '
    [/((‘[^']*)|[a-z])'([^0-9]|$)/gi, '$1’$3'],
    // backwards apostrophe
    [
      /(\B|^)‘(?=([^‘’]*’\b)*([^‘’]*\B\W[‘’]\b|[^‘’]*$))/gi,
      '$1’',
    ],
    // double prime
    [/"/g, '″'],
    // prime
    [/'/g, '\u2032'],
    // -- → —
    [/--/g, '—'],
    // .. → ellipsis
    [/\.\.+/g, '…'],
  ] as const).reduce(
    (subject, [search, replacement]) => subject.replace(search, replacement),
    value,
  );

/**
 * Capitalize the first letter of a string
 */
export const ucfirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
export const ucFirst = ucfirst;

const hasBothUpperAndLower = (value: string) =>
  /[A-Z]/.test(value) && /[a-z]/.test(value);

const properNameCapitalizer = (mixedCase: boolean) => (match: string) => {
  const lowerCaseMatch = match.toLowerCase();
  // single letters should be uppercase (middle initials, etc.)
  if (match.length === 1) {
    return match.toUpperCase();
  }
  if (match.length <= 3) {
    // suffixes that should be all uppercase
    if (['ii', 'iii', 'iv', 'v'].indexOf(lowerCaseMatch) > -1) {
      return match.toUpperCase();
    }
    // compound names that should be lowercase
    if (['dit', 'de', 'von'].indexOf(lowerCaseMatch) > -1) {
      return lowerCaseMatch;
    }
    if (mixedCase) {
      return match;
    }
  }
  return (
    ucfirst(lowerCaseMatch)
      // McXx, MacXx, O’Xx, D’Xx
      .replace(
        /^(ma?c|[od]’)(\S{2,}$)/i,
        (_m, p1, p2) => ucfirst(p1) + ucfirst(p2),
      )
  );
};

/**
 * Fix capitalization of proper nouns: names, addresses
 */
export const proper = (value: string) =>
  value
    // restrict character set for proper names and addresses
    .replace(/[^A-Za-z0-9\u00C0-\u00FF’ ,-]/g, ' ')
    // remove double spacing possibly introduced from previous replace
    .replace(/  +/g, ' ')
    // remove leading/trailing spaces possibly introduced from previous replace
    .trim()
    .replace(/([^ ,-]+)/g, properNameCapitalizer(hasBothUpperAndLower(value)));

/**
 * Format email addresses
 */
export const email = (value: string) =>
  nonempty(value.toLowerCase().replace(/\s+/g, ''));

/**
 * Strip all non-digit characters from string
 */
export const digits = (value: string) => value.replace(/[^\d]/g, '');

/**
 * Returns only the digits of a phone number without any formatting
 */
export const phone = (value: string) => {
  const onlyDigits = digits(value).replace(/^[01]+/, '');
  if (onlyDigits.length >= 10) {
    return onlyDigits;
  }
  throw new TypeError('Invalid US phone number.');
};

/**
 * Requires the input phone number to be exactly 10-digits (no extension)
 */
export const phone10 = (value: string) => {
  const valid = phone(value);
  if (valid.length === 10) {
    return valid;
  }
  throw new TypeError('Invalid US 10-digit phone number.');
};

/**
 * Format phone number as “(NNN) NNN-NNNN ext N…”
 */
export const prettyPhone = (value: string) => {
  const valid = phone(value);
  if (valid.length === 10) {
    return valid.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  return valid.replace(/(\d{3})(\d{3})(\d{4})(\d+)/, '($1) $2-$3 ext $4');
};

/**
 * 5-digit US postal code
 */
export const postalCodeUs5 = (value: string) => {
  const code = digits(value).slice(0, 5);
  if (code.length === 5) {
    return code;
  }
  throw new TypeError('Invalid US postal code');
};

/**
 * Coerce/round value to integer
 */
export const integer = (value: number) => Math.round(value);

/**
 * Limit the value of a `number`, characters in a `string`, or items in an
 * `array`
 */
export const limit = (max: number) =>
  /**
   * Limit the value of a `number`, characters in a `string`, or items in an
   * `array`
   */
  <T extends number | string | unknown[]>(value: T) => {
    if (isNumber(value)) {
      return Math.min(value, max) as T;
    }
    if (isString(value)) {
      return value.slice(0, max) as T;
    }
    if (isArray(value)) {
      return value.slice(0, max) as T;
    }
    throw new TypeError(`Unable to apply a max of ${max} to ${value}`);
  };

/**
 * Split a string into an array. Optionally define a separator RegExp. Default
 * separator is comma, newline, space, tab.
 * @param separator default: /[,\r\n\s]+/g commas, newlines, spaces, tabs
 */
export const split = (separator = /[,\r\n\s]+/g) =>
  /**
   * Split a string by given `separator` (default: comma, newline, space, tab).
   * Remove empty strings from returned array.
   * @example
   *    split()('a,b,,,c d e foo') // ['a', 'b', 'c', 'd', 'e', 'foo']
   */
  (value: string) =>
    spaces(value) // remove irregular spaces
      .split(separator)
      .map(trim)
      .filter((item) => item !== '');

//#endregion

//#region Types
// -----------------------------------------------------------------------------

export type Constructor = (new (...args: any[]) => any);
export interface Coercer<O = never> {
  <E>(value: unknown, otherwise: E): O | Exclude<E, Error | Function>;
  <I>(value: I): [O] extends [never] ? I : O;
}

export interface Coerce {
  (): Coercer<never>;
  <A extends ReadonlyArray<unknown>, B>(
    ab: (...a: A) => B
  ): Coercer<B>;
  <A extends ReadonlyArray<unknown>, B, C>(
    ab: (...a: A) => B,
    bc: (b: B) => C
  ): Coercer<C>;
  <A extends ReadonlyArray<unknown>, B, C, D>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D
  ): Coercer<D>;
  <A extends ReadonlyArray<unknown>, B, C, D, E>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
  ): Coercer<E>;
  <A extends ReadonlyArray<unknown>, B, C, D, E, F>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F
  ): Coercer<F>;
  <A extends ReadonlyArray<unknown>, B, C, D, E, F, G>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G
  ): Coercer<G>;
  <A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H
  ): Coercer<H>;
  <A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I
  ): Coercer<I>;
  <A extends ReadonlyArray<unknown>, B, C, D, E, F, G, H, I, J>(
    ab: (...a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I,
    ij: (i: I) => J
  ): Coercer<J>;
  <A extends unknown, Z>(
    ...az: ((a: A) => Z)[]
  ): Coercer<Z>;
}
//#endregion

export default coerce;
