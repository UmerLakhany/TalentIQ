import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export default class LoginDTO {

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

}
