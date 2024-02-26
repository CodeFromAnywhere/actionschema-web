import { useState } from "react";
import { SelectInput } from "./SelectInput.js";
import { Item } from "./types.js";
/**
Create a value selector in a single line of code, including its state!

# **Usage**

```ts
const [SelectView, view, setView] = useSelect(views);
```
 */
export const useSelect = <T extends unknown>(
  items?: Item<T>[],
  initialValue?: Item<T> | null,
  /**
   * Optionally you can do other things with the value as well, like setting it to a global store
   */

  withValue?: (value: Item<T> | undefined) => void,
  /**
   * If true, the value doesn't stay but just resets after setting
   */
  resetOnSelect?: boolean,
): [
  Component: () => JSX.Element,
  value: Item<T> | null,
  setValue: (value: Item<T> | null) => void,
] => {
  const realItems: Item<T>[] = !initialValue
    ? [{ label: "", value: "", data: undefined } as Item<T>].concat(items || [])
    : items || [];
  const [value, setValue] = useState<Item<T> | null>(initialValue || null);

  const Component = () => (
    <SelectInput
      className={
        "text-sm px-3 border border-gray-300 rounded-md focus:outline-none my-2 py-2 dark:!text-white dark:!bg-transparent text-gray-700 bg-white h-9"
      }
      title="Test"
      onChange={(v) => {
        setValue(v);
        console.log({ v });
        if (v) {
          withValue?.(v);
        }

        if (resetOnSelect) {
          setValue(initialValue || null);
        }
      }}
      value={value}
      options={realItems}
    />
  );
  return [Component, value, setValue];
};
