import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendOtpDto } from './dtos/send-otp.dto';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('otp')
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        return this.notificationsService.sendOtp(sendOtpDto.recipient, sendOtpDto.channel);
    }
}
