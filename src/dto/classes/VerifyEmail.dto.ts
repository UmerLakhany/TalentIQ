import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

/** Body of POST /api/v1/recruiter/auth/verify-email */
export default class VerifyEmailDTO {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email!: string;

  @IsNotEmpty({ message: 'Verification code is required.' })
  @IsString({ message: 'Verification code must be a string.' })
  @Matches(/^\d{4,8}$/, { message: 'Verification code must contain only digits.' })
  otp!: string;
}
