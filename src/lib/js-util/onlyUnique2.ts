/**
 * function that returns a filter function that can be used as a filter for any array. removes duplicates.
 *
 * optionally takes a compare function that should return a "true" if two instances are equal. if you use this function, make sure to pass a generic of the type the items will have, in order to make this equality function type safe as well
 *
 *
 */
export const onlyUnique2 =
  <U extends unknown>(isEqualFn?: (a: U, b: U) => boolean) =>
  <T extends U>(value: T, index: number, self: T[]) => {
    return (
      self.findIndex((v) => (isEqualFn ? isEqualFn(v, value) : v === value)) ===
      index
    );
  };
