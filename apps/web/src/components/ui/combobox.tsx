import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover as PopoverPrimitive } from "radix-ui";
import { PopoverContent } from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyText = "No results found.",
  className,
  inputClassName,
  disabled = false,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxRef = React.useRef<HTMLUListElement>(null);

  // Determine selected option
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Closed presentation derives from the controlled value. Only explicit opening
  // resets the search draft, so a delayed close effect cannot overwrite typing.
  const changeOpen = (open: boolean) => {
    if (open && !isOpen) setInputValue(selectedOption?.label ?? "");
    setIsOpen(open);
    setActiveIndex(-1);
  };

  React.useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }, [disabled]);

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (!isOpen || !inputValue || inputValue === selectedOption?.label) {
      return options;
    }
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue, isOpen, selectedOption]);

  // Scroll active item into view
  React.useEffect(() => {
    if (isOpen && activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          changeOpen(true);
          setActiveIndex(options.length ? 0 : -1);
        } else {
          setActiveIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          changeOpen(true);
          setActiveIndex(options.length - 1);
        } else {
          setActiveIndex((prev) => prev > 0 ? prev - 1 : filteredOptions.length - 1);
        }
        break;
      case "Enter":
        if (isOpen) e.preventDefault();
        if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onChange?.(filteredOptions[activeIndex].value);
          changeOpen(false);
        }
        break;
      case "Escape":
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          changeOpen(false);
        }
        break;
      case "Tab":
        if (isOpen) {
          changeOpen(false);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) setIsOpen(true);
    setActiveIndex(-1); // Reset active index when typing
  };

  const handleOptionClick = (optionValue: string) => {
    onChange?.(optionValue);
    inputRef.current?.focus();
    changeOpen(false);
  };

  const listboxId = React.useId();
  const activeDescendantId =
    activeIndex >= 0 && activeIndex < filteredOptions.length ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <PopoverPrimitive.Root open={isOpen && !disabled} onOpenChange={changeOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div className={cn("relative min-w-0 w-full", className)}>
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={isOpen && !disabled}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={isOpen ? activeDescendantId : undefined}
            aria-autocomplete="list"
            disabled={disabled}
            value={isOpen ? inputValue : selectedOption?.label ?? ""}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={() => !disabled && changeOpen(true)}
            onFocus={() => !disabled && changeOpen(true)}
            placeholder={placeholder}
            className={cn(
              "floating-trigger bg-background pr-12",
              inputClassName
            )}
          />
          {value && !isOpen ? (
            <button
              type="button"
              className="floating-trigger absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
                setInputValue("");
                inputRef.current?.focus();
                changeOpen(false);
              }}
              aria-label={`Bỏ chọn ${ariaLabel ?? placeholder}`}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="floating-trigger absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                const nextOpen = !isOpen;
                inputRef.current?.focus();
                changeOpen(nextOpen);
              }}
              aria-label={`Mở danh sách ${ariaLabel ?? placeholder}`}
              tabIndex={-1}
            >
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverPrimitive.Anchor>

      {/* Radix owns collision, portal and dismissal; the input retains combobox focus. */}
      <PopoverContent
        role="presentation"
        align="start"
        sideOffset={4}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target instanceof Node && inputRef.current?.parentElement?.contains(event.target)) event.preventDefault();
        }}
        className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-1rem)] rounded-lg p-0"
      >
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? placeholder}
          className="max-h-[min(15rem,var(--radix-popover-content-available-height))] overflow-auto p-1 focus:outline-none"
        >
          {filteredOptions.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </li>
          ) : (
            filteredOptions.map((option, index) => {
              const isActive = index === activeIndex;
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => handleOptionClick(option.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "floating-option relative flex min-h-11 w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                    isActive && "bg-accent text-accent-foreground",
                    isSelected && "font-medium text-primary"
                  )}
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">{option.label}</span>
                  {isSelected && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
                      <Check aria-hidden="true" className="h-4 w-4" />
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </PopoverPrimitive.Root>
  );
}
