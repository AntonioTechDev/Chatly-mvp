
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Step1Dto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    userId?: string;
}
