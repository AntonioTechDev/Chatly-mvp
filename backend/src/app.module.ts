import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NotificationsModule,
    AuthModule,
    OnboardingModule,
  ],
})
export class AppModule { }
