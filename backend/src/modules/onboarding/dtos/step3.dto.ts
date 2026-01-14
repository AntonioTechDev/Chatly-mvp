
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class Step3Dto {
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsString()
    @IsNotEmpty()
    industry: string;

    @IsString()
    @IsNotEmpty()
    employeeCount: string;
}
