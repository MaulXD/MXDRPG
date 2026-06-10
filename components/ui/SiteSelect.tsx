"use client";

import "./site-select.css";
import { useEffect, useId, useRef, useState } from "react";

export type SiteSelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SiteSelectOption[];
  id?: string;
  className?: string;
  "aria-label"?: string;
};

export function SiteSelect({
  value,
  onChange,
  options,
  id,
  className = "",
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`site-select${open ? " site-select--open" : ""}${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        id={id}
        className="site-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel ?? selected?.label}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="site-select__value">{selected?.label}</span>
        <span className="site-select__chevron" aria-hidden />
      </button>
      {open ? (
        <ul id={listId} className="site-select__list" role="listbox" aria-label={ariaLabel}>
          {options.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`site-select__option${opt.value === value ? " is-selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
