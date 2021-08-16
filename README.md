# Coerce

Coerce input to types and formats with sanitizers and validators.

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
import coerce, { string, safe, spaces, trim, nonEmpty } from '@resolute/coerce';
// sanitize input: removing dangerous characters, normalize double/half/utf
// spaces, trim whitespace, and confirm result is non-empty
const sanitize = coerce(string, safe, spaces, trim, nonEmpty);
```

* failures **throw** a coerce TypeError
  ```js
  sanitize(' foo '); // 'foo'
  sanitize('     '); // Uncaught TypeError
  ```
* failures **return** default value (never throws)
  ```js
  sanitize('     ', undefined); // undefined
  ```
* failures **throw** error instance
  ```js
  sanitize('     ', new Error('Oh no!')); // Uncaught Error: Oh no!
  ```
* failures **throw** error factory
  ```js
  class CustomError extends Error { }
  const errorFactory = (error: Error) => new CustomError(error.message);
  sanitize('     ', errorFactory); // Uncaught CustomError
  ```

## Examples

Confirm a string value is within a list (enum)
```js
import coerce, { within } from '@resolute/coerce';
const inList = coerce(within(['foo', 'bar'])); // any iterable type ok to use
try {
  inList(input);
  // input is either 'foo' or 'bar'
} catch (error) {
  // input was not 'foo' or 'bar'
}
```

Convert anything to an array
```js
import coerce, { array } from '@resolute/coerce';
const arrayify = coerce(array);
```
* Iterables (except strings) → `Array`
  ```js
  arrayify(new Map([[1, 1], [2, 2]]); // [[1, 1], [2, 2]]
  arrayify(new Set([1, 2, 3])); // [1, 2, 3]
  arrayify(Buffer.from('123')); // [49, 50, 51] (char codes)
  // even though Strings are iterable, they are NOT broken apart
  arrayify('123'); // ['123']
  ```
* Non-iterables (including strings) → `[item]` (wrapped in array)
  ```js
  arrayify(1); // [1]
  arrayify(null); // [null]
  ```
* Arrays → `Array` (no change)
  ```js
  arrayify([1, 2, 3]); // [1, 2, 3]
  ```
