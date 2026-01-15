import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for Step 1: Email & Password Registration
 * This is a PUBLIC endpoint - user is NOT yet authenticated
 * Used to create auth.users entry and send OTP
 */
export class Step1Dto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
