
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class Step2Dto {
    @IsBoolean()
    @IsNotEmpty()
    emailVerified: boolean;
}
