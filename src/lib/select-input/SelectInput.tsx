import { ChangeEvent } from "react";
import { ChangeEventHandler } from "react";
import { useState } from "react";
import { Item } from "./types.js";
import { onlyUnique2 } from "@/lib/js-util/onlyUnique2.js";
import { notEmpty } from "@/lib/js-util/notEmpty.js";
import { SelectProps } from "./types.js";
import { getRealValue } from "./getRealValue.js";
/**
 * renders either a SelectDropdown or SelectDrawer, based on screensize
 */
export const SelectInput = <T extends unknown>({
  options,
  onChange,
  value,
  title,
  containerClassName,
  selectFirstOption,
  autoSuggest,
  //unused atm
  children,
  className,
  noPlaceholder,
  placeholder,
  ios,
}: SelectProps<T>) => {
  const [temporaryValue, setTemporaryValue] = useState("");
  const [id] = useState(`list${String(Math.round(Math.random() * 100000))}`);

  const realValue = getRealValue({ value, selectFirstOption, options, title });

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist

  const onChangeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const newValue = options.find((x) => String(x.value) === value) || null;

    onChange?.(newValue);
  };

  const renderOptions = () => {
    const useOptgroup = options.some((x) => !!x.group);
    if (useOptgroup) {
      const groups = options
        .map((x) => x.group)
        .filter(notEmpty)
        .filter(onlyUnique2());

      return [undefined, ...groups].map((group, i) => {
        const items = options.filter((x) => x.group === group);

        return (
          <optgroup key={`optgroup${i}`} label={group || ""}>
            {items.map((option, index) => {
              return (
                <option
                  value={String(option.value)}
                  key={`group${i}key${index}`}
                >
                  {option.label}
                </option>
              );
            })}
          </optgroup>
        );
      });
    }
    return (
      <>
        {options.map((option, index) => {
          return (
            <option value={String(option.value)} key={index}>
              {option.label}
            </option>
          );
        })}
      </>
    );
  };

  return (
    <div className={containerClassName}>
      {autoSuggest ? (
        <span className="w-full">
          <div className="relative flex flex-row w-full justify-center items-center">
            <span
              onClick={() => {
                setTemporaryValue("");
                onChange?.(null);
                // NB:doesn't open list selector in saf.. bit annoying
                document.getElementById(id + "input")?.focus();
              }}
              className="cursor-pointer text-md text-black dark:!text-white w-8"
            >
              {temporaryValue !== "" || value ? "X" : ""}
            </span>
            <input
              id={id + "input"}
              list={id}
              type="text"
              autoCorrect="false"
              autoComplete="false"
              placeholder={
                !noPlaceholder ? placeholder || "Type or select one" : undefined
              }
              onChange={(event) => {
                const value = event.target.value;

                const foundOption = options.find((x) => x.value === value);
                if (foundOption) {
                  onChange?.(foundOption);
                  setTemporaryValue("");
                } else {
                  setTemporaryValue(value);
                }
              }}
              className={className}
              value={
                temporaryValue && temporaryValue.length > 0
                  ? temporaryValue
                  : value?.value
                  ? String(value?.value)
                  : ""
              }
            />
          </div>

          {/* placeholder={title} */}
          <datalist id={id}>{renderOptions()}</datalist>
        </span>
      ) : (
        <select
          onChange={onChangeSelect}
          className={className}
          value={String(value?.value)}
        >
          {renderOptions()}
        </select>
      )}
    </div>
  );
};
