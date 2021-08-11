/* eslint-disable no-eval */
import test from 'ava';
import {
  coerce,
  string, safe, nonEmpty, spaces, trim, quotes, proper, postalCodeUs5,
  boolean,
  array,
  number, positive, negative,
  limit, split, within, email, phone, phone10, prettyPhone, integer, nonZero, date,
} from '../index.js';

const pass = <S, T extends (arg: any) => any>(input: string, expected: S, ...sanitizers: T[]) => {
  test(`${input} ✅ ${sanitizers.map(({ name }) => name).join(', ')}`,
    (t) => t.deepEqual(
      coerce(eval(input)).to(...sanitizers).or(Error),
      expected,
    ));
};

const fail = <T extends (arg: any) => any>(input: string, ...sanitizers: T[]) => {
  const expected = new Error('The expected error that coerce threw.');
  expected.name = 'ExpectedError';
  test(`${input} ❌ ${sanitizers.map(({ name }) => name).join(', ')}`,
    (t) => {
      t.throws(() => {
        coerce(eval(input)).to(...sanitizers).or(expected);
      }, { is: expected });
    });
};

// string
pass("'1'", '1', string);
pass('1', '1', string);
fail('true', string);
fail('Symbol(1)', string);
fail('new Error("foo")', string);
fail('Buffer.from("foo")', string);
fail('["1"]', string);
fail('NaN', string);
fail('Infinity', string);
fail('null', string);
fail('undefined', string);
fail('{}', string);
fail('{ function toString() { return "1"; } }', string);
fail('{ function noToStringMethod() { return "1"; } }', string);

// trim
pass("' \t foo \\n \t'", 'foo', trim);

// spaces
// eslint-disable-next-line no-template-curly-in-string
pass('`${String.fromCharCode(0x200A)}foo `', ' foo ', spaces);

// nonEmpty
pass('" "', ' ', nonEmpty);

// safe
pass('\'INSERT INTO `foo` VALUES ("bar")\'', 'INSERT INTO foo VALUES bar', safe);

// proper
pass("'abc company'", 'Abc Company', quotes, proper);
pass("'ABC company'", 'ABC Company', quotes, proper);
pass('"john q. o\'donnel, III"', 'John Q O’Donnel, III', quotes, proper);
pass("'VON Trap'", 'von Trap', quotes, proper);

// Postal Code US
pass("'10001-1234'", '10001', postalCodeUs5);
pass("'07417'", '07417', postalCodeUs5);
pass("'07417-1111'", '07417', postalCodeUs5);
fail("'0741'", postalCodeUs5);
fail('10001', postalCodeUs5); // numbers not allowed because leading 0’s mess things up

// boolean
const trueOrFalse = boolean();
Object.defineProperty(trueOrFalse, 'name', { value: 'boolean' });
pass('undefined', false, trueOrFalse);
pass('null', false, trueOrFalse);
pass("''", false, trueOrFalse);
pass('false', false, trueOrFalse);
pass("'false'", false, trueOrFalse);
pass("'0'", false, trueOrFalse);
pass('0', false, trueOrFalse);
pass('({})', true, trueOrFalse);
pass('new Error()', true, trueOrFalse);
pass('1', true, trueOrFalse);
pass("'foo'", true, trueOrFalse);

// array
pass("new Map([[1, '1']])", [[1, '1']], array);
pass("new Set(['1', '2'])", ['1', '2'], array);
pass("['1']", ['1'], array);
pass("'123'", ['123'], array); // not ['1', '2', '3'] even though Strings are iterable
pass("Buffer.from('123')", [49, 50, 51], array); // Buffer will be char codes
pass('null', [null], array);
pass('true', [true], array);
pass('undefined', [undefined], array);
pass('new WeakSet()', [new WeakSet()], array); // WeakSet non-iterable, so it gets wrapped in array

// number
fail('NaN', number);
fail('Infinity', number);
fail("'foo'", number);
fail("''", number);
fail("'-1.234.5'", number);
fail('0', positive);
fail('0', negative);
pass('0o10', 8, number);
pass('0xff', 255, number);
pass('2e3', 2000, number);
pass('1n', 1, number);
pass('1', 1, number);
pass('1', 1, number, positive);
pass("'-1.234'", -1.234, number);
pass("'0'", 0, number);
pass('-0.5', -0.5, number, negative);
pass('-1', -1, number, negative);
pass("'-1.234'", -1.234, number, negative);
pass('1.2', 1, nonZero, integer);
fail('0', nonZero, integer);
fail('', number, nonZero);

// limit
const limit3 = limit(3);
Object.defineProperty(limit3, 'name', { value: 'limit' });
pass('5', 3, limit3);
pass("'foobar'", 'foo', limit3);
pass('[1, 2, 3, 4, 5]', [1, 2, 3], limit3);
fail('({})', limit3);
fail('null', limit3);

// split
const splitBasic = split();
Object.defineProperty(splitBasic, 'name', { value: 'split' });
pass("'a,b,,,c d e foo'", ['a', 'b', 'c', 'd', 'e', 'foo'], splitBasic);
pass("',,,,,,   , , '", [], splitBasic);

// within
const withinList = within(['foo', 'bar']);
Object.defineProperty(withinList, 'name', { value: 'within' });
pass("'foo'", 'foo', withinList);
fail("'baz'", withinList);

// email
pass("' Foo@Bar.com'", 'foo@bar.com', email);
pass("'foo '", 'foo', email); // this will also pass as the @ format is not validated

// phone
pass("'+1 (222) 333-4444x555'", '2223334444555', phone);
pass("'+1 (222) 333-4444'", '2223334444', phone10);
pass("'+1 (222) 333-4444'", '(222) 333-4444', prettyPhone);
pass("'+1 (222) 333-4444x555'", '(222) 333-4444 ext 555', prettyPhone);
fail("'+1 (222) 333-444'", phone10);
fail("'+1 (222) 333-44444'", phone10);

// date
pass('1628623372929', new Date(1628623372929), date);

// test coerce .or() with a default value
test('coerce(…).to(…).or(0)', (t) => {
  const defaultValue = 1;
  t.is(coerce('foo').to(number).or(defaultValue), defaultValue);
});

// test coerce .or() with an Error returning function
test('coerce(…).to(…).or(()=>Error))', (t) => {
  const errorHandler = (error: string) => new Error(error);
  t.throws(() => coerce('foo').to(number).or(errorHandler));
});
