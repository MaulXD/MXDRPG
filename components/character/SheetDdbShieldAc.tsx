"use client";

type Props = {
  value: number;
  className?: string;
  tabIndex?: number;
};

/** CA dentro de escudo — estilo DDB / mock da ficha. */
export function SheetDdbShieldAc({ value, className, tabIndex = -1 }: Props) {
  return (
    <div
      className={`sheet-ddb-shield-ac${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={`CA ${value}`}
      tabIndex={tabIndex}
    >
      <span className="sheet-ddb-shield-ac__label" aria-hidden="true">
        CA
      </span>
      <div className="sheet-ddb-shield-ac__frame">
        <svg
          className="sheet-ddb-shield-ac__svg"
          viewBox="0 0 40 46"
          focusable="false"
          aria-hidden="true"
        >
          <path
            className="sheet-ddb-shield-ac__fill"
            d="M20 3 L35 9.5 V22.5 C35 31.5 28.5 38.5 20 42.5 C11.5 38.5 5 31.5 5 22.5 V9.5 Z"
          />
          <path
            className="sheet-ddb-shield-ac__rim"
            d="M20 3 L35 9.5 V22.5 C35 31.5 28.5 38.5 20 42.5 C11.5 38.5 5 31.5 5 22.5 V9.5 Z"
            fill="none"
          />
        </svg>
        <strong className="sheet-ddb-shield-ac__value" aria-hidden="true">
          {value}
        </strong>
      </div>
    </div>
  );
}
