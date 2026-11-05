/**
 * Secure password rule, identical to `passwordRegex` in the recruiter panel (src/utils/index.ts):
 * at least 8 characters with a lowercase letter, an uppercase letter, a number and a special
 * character, using only letters, numbers and the symbols _ ~ = @ # $ > . < , [ { } ( ) ! % | ' " ` : ; + * ? &
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_~=@#$>.<,[{}()!%|'"`:;+*?&])[A-Za-z\d_~=@#$>.<,[{}()!%|'"`:;+*?&]{8,}$/;

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt only uses the first 72 bytes of a password. */
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_RULE_MESSAGE =
  'must have at least 8 characters, including an uppercase letter, a lowercase letter, a number and a special character (_ ~ = @ # $ > . < , [ { } ( ) ! % | \' " ` : ; + * ? &).';
