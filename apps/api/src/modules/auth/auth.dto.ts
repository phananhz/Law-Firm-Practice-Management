import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
export class VerifyMfaDto {
  @IsString() mfaSessionToken!: string;
  @Matches(/^\d{6,8}$/) code!: string;
}
export class ForgotPasswordDto {
  @IsEmail() email!: string;
}
export class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() @MinLength(12) newPassword!: string;
}
export class ConfirmMfaDto {
  @Matches(/^\d{6,8}$/) code!: string;
}
