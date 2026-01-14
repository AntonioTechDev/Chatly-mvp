
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class Step6Dto {
    @IsString()
    @IsNotEmpty()
    role: string;

    @IsPhoneNumber(undefined, { message: 'Invalid phone number format' }) // Requires google-libphonenumber installed? Actually class-validator uses it.
    @IsNotEmpty()
    phoneNumber: string;
}
