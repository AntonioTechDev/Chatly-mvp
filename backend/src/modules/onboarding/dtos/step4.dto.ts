
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class Step4Dto {
    @IsEnum(['b2c', 'b2b', 'both'], { message: 'Invalid customer type' })
    @IsNotEmpty()
    customerType: string;

    @IsArray()
    @IsNotEmpty()
    acquisitionChannels: string[];
}
