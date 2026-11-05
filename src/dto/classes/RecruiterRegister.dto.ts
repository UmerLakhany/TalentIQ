import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Body of POST /api/v1/recruiter/auth/register (snake_case, matching the recruiter panel). */
export default class RecruiterRegisterDTO {
  @IsNotEmpty({ message: 'Full name is required.' })
  @IsString({ message: 'Full name must be a string.' })
  @MinLength(2, { message: 'Full name must be at least 2 characters.' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters.' })
  full_name!: string;

  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(255, { message: 'Email must be at most 255 characters.' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  // bcrypt only uses the first 72 bytes of a password.
  @MaxLength(72, { message: 'Password must be at most 72 characters.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Password must contain at least one letter and one number.' })
  password!: string;
}
