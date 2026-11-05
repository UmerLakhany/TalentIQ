import { IsEmail, IsNotEmpty } from 'class-validator';

export default class ForgetPasswordDTO {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
