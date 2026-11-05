import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Body of POST /api/v1/recruiter/auth/reset-password */
export default class ResetPasswordDTO {
  @IsNotEmpty({ message: 'Reset token is required.' })
  @IsString({ message: 'Reset token must be a string.' })
  reset_token!: string;

  // Same rules as registration.
  @IsNotEmpty({ message: 'New password is required.' })
  @IsString({ message: 'New password must be a string.' })
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  @MaxLength(72, { message: 'New password must be at most 72 characters.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'New password must contain at least one letter and one number.' })
  new_password!: string;

  @IsNotEmpty({ message: 'Confirm password is required.' })
  @IsString({ message: 'Confirm password must be a string.' })
  confirm_password!: string;
}
