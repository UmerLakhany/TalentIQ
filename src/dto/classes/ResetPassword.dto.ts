import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from '../../common/passwordPolicy';

/** Body of POST /api/v1/recruiter/auth/reset-password */
export default class ResetPasswordDTO {
  @IsNotEmpty({ message: 'Reset token is required.' })
  @IsString({ message: 'Reset token must be a string.' })
  reset_token!: string;

  // Same rules as registration.
  @IsNotEmpty({ message: 'New password is required.' })
  @IsString({ message: 'New password must be a string.' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters.` })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: `New password must be at most ${PASSWORD_MAX_LENGTH} characters.` })
  @Matches(PASSWORD_REGEX, { message: `New password ${PASSWORD_RULE_MESSAGE}` })
  new_password!: string;

  @IsNotEmpty({ message: 'Confirm password is required.' })
  @IsString({ message: 'Confirm password must be a string.' })
  confirm_password!: string;
}
