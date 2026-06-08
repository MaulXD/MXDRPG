"use client";

import { useId, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  hint?: string;
};

export function PasswordInput({
  value,
  onChange,
  label,
  placeholder,
  autoComplete = "current-password",
  minLength,
  required = true,
  hint,
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="auth-field" htmlFor={inputId}>
      <span className="auth-field__label">{label}</span>
      <div className="auth-field__password-wrap">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="auth-field__input auth-field__input--password"
          placeholder={placeholder}
          spellCheck={false}
        />
        <button
          type="button"
          className="auth-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>
      {hint ? <span className="auth-field__hint">{hint}</span> : null}
    </label>
  );
}
