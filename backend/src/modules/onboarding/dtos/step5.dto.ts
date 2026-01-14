
import { IsArray, IsOptional } from 'class-validator';

export class Step5Dto {
    @IsArray()
    @IsOptional()
    usageGoals: string[];

    @IsArray()
    @IsOptional()
    dataStorage: string[];
}
