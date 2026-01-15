import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for Step 2: OTP Verification
 * This is a PUBLIC endpoint - user verifies email via OTP
 * After successful verification, user receives session tokens
 */
export class Step2Dto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string; // 6-digit code sent to email
}
