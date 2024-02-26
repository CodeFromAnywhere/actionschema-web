import type { MouseEvent } from "react";

export type ProcessedColorValue = number | OpaqueColorValue;
type OpaqueColorValue = symbol & { __TYPE__: "Color" };
export type ColorValue = string | OpaqueColorValue;

/**
 * @see: https://reactnative.dev/docs/actionsheetios#content
 */
export interface ActionSheetIOSOptions {
  title?: string | undefined;
  options: string[];
  cancelButtonIndex?: number | undefined;
  destructiveButtonIndex?: number | number[] | undefined | null;
  message?: string | undefined;
  anchor?: number | undefined;
  tintColor?: ColorValue | ProcessedColorValue | undefined;
  cancelButtonTintColor?: ColorValue | ProcessedColorValue | undefined;
  userInterfaceStyle?: "light" | "dark" | undefined;
  disabledButtonIndices?: number[] | undefined;
}

export type Item<T = undefined> = {
  /**
   * Must be string because the HTML select element can only contain a string
   */
  value: string;
  label: string;
  /** will apply optgroup if this is present */
  group?: string;
  /**
   * If you want you can provide a data belonging to this item
   */
  data?: T;
};

export type ID = string | number | undefined;

export type ChildrenType<T> = ({
  onClick,
  className,
  value,
}: {
  onClick: (e?: MouseEvent<Element>, id?: ID) => void;
  className?: string;
  value: Item<T>;
}) => any;

export type SelectProps<T> = {
  containerClassName?: string;
  /**
   * only for web (uses datalist html element)
   */
  autoSuggest?: boolean;
  title: string;
  options: Item<T>[];
  onChange?: (value: Item<T> | null) => void;
  value?: Item<T> | null;
  className?: string;
  children?: ChildrenType<T>;
  ios?: ActionSheetIOSOptions;
  selectFirstOption?: boolean;
  /**
   * don't use a placeholder that you give or the default one
   */
  noPlaceholder?: boolean;
  /**
   * works for autosuggest
   */
  placeholder?: string;
};
