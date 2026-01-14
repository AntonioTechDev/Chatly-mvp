import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { INotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class TwilioProvider implements INotificationProvider {
    private readonly logger = new Logger(TwilioProvider.name);
    private client: Twilio;
    private fromNumber: string;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

        if (!accountSid || !authToken) {
            this.logger.warn('Twilio credentials not found. SMS sending will fail.');
            return;
        }

        this.client = new Twilio(accountSid, authToken);
    }

    async sendSMS(to: string, message: string): Promise<boolean> {
        if (!this.client) {
            this.logger.error('Twilio client not initialized');
            return false;
        }

        try {
            await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: to,
            });
            this.logger.log(`SMS sent to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
            return false;
        }
    }

    async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        this.logger.warn('TwilioProvider does not support email sending directly.');
        return false;
    }
}
