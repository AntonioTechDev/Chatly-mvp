import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MockNotificationProvider } from './providers/mock.provider';
import { TwilioProvider } from './providers/twilio.provider';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: 'NOTIFICATION_PROVIDER',
      useFactory: (config: ConfigService) => {
        const useMock = config.get('USE_MOCK_NOTIFICATIONS') === 'true';
        return useMock ? new MockNotificationProvider() : new TwilioProvider(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule { }
