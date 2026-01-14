
import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConfigModule, NotificationsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule { }
