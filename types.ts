export interface Or<T> {
  /**
   * `.or` return a default value, throw a specific `Error`, or throws a the
   * `Error` returned from a function.
   */
  or: {
    /**
     * `.or` **throw** a function that returns an error. Your function will
     * receive the Error from the failing coerce function.
     */
    (otherwise: ((error: Error) => Error)): T;
    /**
     * `.or` **throw** a specific error.
     */
    (otherwise: Error): T;
    /**
     * **WARNING** `.or` function _must_ produce an instance of `Error`, because
     * it will be `throw`n.
     */
    (otherwise: Function): unknown;
    /**
     * `.or` **return** a default value.
     */
    <U>(otherwise: U): T | Exclude<U, Error | Function>;
  }
}

export interface To<I> {
  to: {
    (): Or<I>;
    <A>(
      s1: (input: I) => A,
    ): Or<A>;
    <A, B>(
      s1: (input: I) => A,
      s2: (input: A) => B,
    ): Or<B>;
    <A, B, C>(
      s1: (input: I) => A,
      s2: (input: A) => B,
      s3: (input: B) => C,
    ): Or<C>;
    <A, B, C, D>(
      s1: (input: I) => A,
      s2: (input: A) => B,
      s3: (input: B) => C,
      s4: (input: C) => D,
    ): Or<D>;
    <A, B, C, D, E>(
      s1: (input: I) => A,
      s2: (input: A) => B,
      s3: (input: B) => C,
      s4: (input: C) => D,
      s5: (input: D) => E,
    ): Or<E>;
    <A, B, C, D, E, F>(
      s1: (input: I) => A,
      s2: (input: A) => B,
      s3: (input: B) => C,
      s4: (input: C) => D,
      s5: (input: D) => E,
      s6: (input: E) => F,
    ): Or<F>;
    <A, B, C, D, E, F, G>(
      s1: (input: I) => A,
      s2: (input: A) => B,
      s3: (input: B) => C,
      s4: (input: C) => D,
      s5: (input: D) => E,
      s6: (input: E) => F,
      s7: (input: F) => G,
    ): Or<G>;
    <A, B, C, D, E, F, G, H>(
      s1: (input: I) => A,
      s2: (input: A) => B,
      s3: (input: B) => C,
      s4: (input: C) => D,
      s5: (input: D) => E,
      s6: (input: E) => F,
      s7: (input: F) => G,
      s8: (input: G) => H,
    ): Or<H>;
    <A>(
      ...sN: ((input: A) => A)[]
    ): Or<A>;
  }
}
