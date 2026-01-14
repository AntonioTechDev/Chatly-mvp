import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum DeliveryChannel {
    SMS = 'sms',
    EMAIL = 'email',
}

export class SendOtpDto {
    @IsNotEmpty()
    @IsString()
    recipient: string; // Phone number or Email

    @IsNotEmpty()
    @IsEnum(DeliveryChannel)
    channel: DeliveryChannel;
}
