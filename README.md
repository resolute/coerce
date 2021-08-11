# Coerce

Coerce inputs to chainable types, formatters, sanitizers, and validators.

## Features

* **TypeScript** friendly
* Supports **tree-shaking** from Rollup, esbuild, etc.
* **ES Module** only (no CommonJS support 😀/🙁)

## Installation

```shell
npm i @resolute/coerce
```

## Usage

```js
import coerce, { string, trim, nonEmpty } from '@resolute/coerce';
```
trim a string and confirm it is not empty, `.or()` return undefined
```js
coerce(' foo ').to(string, trim, nonEmpty).or(undefined); // 'foo'
coerce('     ').to(string, trim, nonEmpty).or(undefined); // undefined
```

`.or()` throw an error
```js
coerce('     ').to(string, trim, nonEmpty).or(Error);
// Uncaught Error: Unable to parse “undefined” as a string.
```

`.or()` throw a specific error
```js
coerce('     ').to(string, trim, nonEmpty).or(new Error('Unable to parse input.'));
// Uncaught Error: Unable to parse input.
```

## Examples

Confirm a string value is within a list (enum).
```js
import coerce, { within } from '@resolute/coerce';
const list = ['foo', 'bar']; // any iterable type ok to use
try {
  const item = coerce(input).to(within(list)).or(Error);
  // input is either 'foo' or 'bar'
} catch (error) {
  // input was not 'foo' or 'bar'
}
```

Convert any iterable (except strings) to an array. Non-iterables return an array
of length=1 containing the non-iterable.
```js
import coerce, { array } from '@resolute/coerce';
const arrayify = (input) => coerce(input).to(array).or(Error);
arrayify(new Map([[1, 1], [2, 2]]); // [[1, 1], [2, 2]]
arrayify(new Set([1, 2, 3])); // [1, 2, 3]
arrayify([1, 2, 3]); // [1, 2, 3] (no change)
arrayify(1); // [1]
arrayify('123'); // ['123'] (NOT ['1', '2', '3'] even though Strings are iterable)
arrayify(Buffer.from('123')); // [49, 50, 51] // Buffer char codes
arrayify(null); // [null]
```
