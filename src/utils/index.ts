export const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Secure password: at least 8 characters with a lowercase letter, an uppercase letter, a number and a
 * special character, using only letters, numbers and the symbols in PASSWORD_SPECIAL_CHARACTERS.
 */
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_~=@#$>.<,[{}()!%|'"`:;+*?&])[A-Za-z\d_~=@#$>.<,[{}()!%|'"`:;+*?&]{8,}$/;

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt (used by the backend) only reads the first 72 characters. */
export const PASSWORD_MAX_LENGTH = 72;
/** Symbols allowed by passwordRegex. */
export const PASSWORD_SPECIAL_CHARACTERS = "_ ~ = @ # $ > . < , [ { } ( ) ! % | ' \" ` : ; + * ? &";

/** Each part of passwordRegex with a label, for the live password checklist. */
export const PASSWORD_CHECKS: { label: string; test: (value: string) => boolean }[] = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (v) => v.length >= PASSWORD_MIN_LENGTH },
  { label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "One number (0–9)", test: (v) => /\d/.test(v) },
  { label: "One special character (e.g. @ # $ ! %)", test: (v) => /[_~=@#$>.<,[{}()!%|'"`:;+*?&]/.test(v) },
];

/** Characters passwordRegex doesn't allow (spaces, -, ^, /, \, ], non-English letters, ...). */
const UNSUPPORTED_PASSWORD_CHARACTER = /[^A-Za-z\d_~=@#$>.<,[{}()!%|'"`:;+*?&]/;

/**
 * react-hook-form `validate` for new passwords: checks passwordRegex and returns a message that
 * says exactly what is missing (true when valid).
 */
export const validatePassword = (value: string): true | string => {
  if (UNSUPPORTED_PASSWORD_CHARACTER.test(value)) {
    return `Use only letters, numbers and these symbols: ${PASSWORD_SPECIAL_CHARACTERS}`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  const missing = PASSWORD_CHECKS.find((check) => !check.test(value));
  if (missing) {
    return `Password must have: ${missing.label.charAt(0).toLowerCase()}${missing.label.slice(1)}.`;
  }
  return passwordRegex.test(value) || "Enter a stronger password.";
};
