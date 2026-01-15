
import { IsArray, IsOptional } from 'class-validator';

export class Step5Dto {
    @IsArray()
    @IsOptional()
    usageGoals: string[];

    @IsOptional()
    // It can be a string now
    dataStorage: string; // no @IsArray
}
