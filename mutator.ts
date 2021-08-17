import { nonempty } from './validator.js';

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
export const ucFirst = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

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
    ucFirst(lowerCaseMatch)
      // McXx, MacXx, O’Xx, D’Xx
      .replace(
        /^(ma?c|[od]’)(\S{2,}$)/i,
        (_m, p1, p2) => ucFirst(p1) + ucFirst(p2),
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
  if (onlyDigits.length < 10) {
    throw new TypeError('Invalid US phone number.');
  }
  return onlyDigits;
};

/**
* Requires the input phone number to be exactly 10-digits (no extension)
*/
export const phone10 = (value: string) => {
  const valid = phone(value);
  if (valid.length !== 10) {
    throw new TypeError('Invalid US 10-digit phone number.');
  }
  return valid;
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
  if (code.length !== 5) {
    throw new TypeError('Invalid US postal code');
  }
  return code;
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
    if (typeof value === 'number') {
      return Math.min(value, max) as T;
    }
    if (typeof value === 'string') {
      return value.slice(0, max) as T;
    }
    if (Array.isArray(value)) {
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
