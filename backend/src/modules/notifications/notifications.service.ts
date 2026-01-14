import { Injectable, Inject } from '@nestjs/common';
import type { INotificationProvider } from './interfaces/notification-provider.interface';
import { DeliveryChannel } from './dtos/send-otp.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @Inject('NOTIFICATION_PROVIDER')
        private readonly provider: INotificationProvider,
    ) { }

    async sendOtp(recipient: string, channel: DeliveryChannel): Promise<any> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
        const message = `Your Chatly verification code is: ${otp}`;

        let success = false;
        if (channel === DeliveryChannel.SMS) {
            success = await this.provider.sendSMS(recipient, message);
        } else {
            success = await this.provider.sendEmail(recipient, 'Chatly Verification Code', message);
        }

        return { success, message: 'OTP sent successfully (Mock)' };
    }
}
