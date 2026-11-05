"use client";

import { FC, KeyboardEvent, ClipboardEvent, useRef } from "react";

interface OtpInputProps {
  /** Current code, e.g. "1234" while typing a 6-digit code. */
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  /** Id of the element describing the field (e.g. the error message), for screen readers. */
  describedBy?: string;
}

/**
 * One box per digit. Typing moves to the next box, Backspace to the previous one,
 * and pasting a full code fills every box. Only digits are accepted.
 */
const OtpInput: FC<OtpInputProps> = ({ value, onChange, length = 6, disabled, hasError, describedBy }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const focusBox = (index: number) => {
    const box = inputs.current[Math.max(0, Math.min(index, length - 1))];
    box?.focus();
    box?.select();
  };

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    // Several digits at once (autofill / mobile keyboards): fill from this box onwards
    if (typed.length > 1) {
      const next = (digits.slice(0, index).join("") + typed).slice(0, length);
      onChange(next);
      focusBox(next.length);
      return;
    }
    setDigit(index, typed);
    focusBox(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        focusBox(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusBox(pasted.length);
  };

  return (
    <div className="d-flex justify-content-between gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={`form-control hf-otp-input text-center fw-semibold ${hasError ? "is-invalid" : ""}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
};

export default OtpInput;
