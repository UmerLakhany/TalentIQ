import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Body of POST /api/v1/recruiter/auth/login (matches LoginPayload in the recruiter panel). */
export default class LoginDTO {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MaxLength(72, { message: 'Password must be at most 72 characters.' })
  password!: string;

  @IsOptional()
  @IsBoolean({ message: 'remember_me must be true or false.' })
  remember_me?: boolean;
}
