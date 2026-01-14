import { Logger, Injectable } from '@nestjs/common';
import { INotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class MockNotificationProvider implements INotificationProvider {
    private readonly logger = new Logger(MockNotificationProvider.name);

    async sendSMS(to: string, message: string): Promise<boolean> {
        this.logger.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        return true;
    }

    async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
        return true;
    }
}
