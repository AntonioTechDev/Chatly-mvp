
import { IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class Step3Dto {
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsOptional()
    @ValidateIf(o => o.website !== '' && o.website !== null)
    @IsUrl()
    website?: string;

    @IsString()
    @IsNotEmpty()
    industry: string;

    @IsString()
    @IsNotEmpty()
    employeeCount: string;
}
