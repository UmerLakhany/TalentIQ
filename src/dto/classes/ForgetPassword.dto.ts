import { IsEmail, IsNotEmpty } from 'class-validator';

/** Body of POST /api/v1/recruiter/auth/forgot-password */
export default class ForgetPasswordDTO {
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email!: string;
}
