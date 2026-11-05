import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export default class ChangePassDTO {

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}
