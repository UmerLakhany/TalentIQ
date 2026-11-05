import { IsEmail, IsNotEmpty } from 'class-validator';

/** Body of POST /api/v1/recruiter/auth/resend-otp */
export default class ResendOtpDTO {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email!: string;
}
