import { Body, Controller, Post, Get, Request, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { Step1Dto } from './dtos/step1.dto';
import { Step2Dto } from './dtos/step2.dto';
import { Step3Dto } from './dtos/step3.dto';
import { Step4Dto } from './dtos/step4.dto';
import { Step5Dto } from './dtos/step5.dto';
import { Step6Dto } from './dtos/step6.dto';
import { VerifyPhoneDto } from './dtos/verify-phone.dto';

@Controller('onboarding')
@UseGuards(SupabaseAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) { }

  /**
   * STEP 1: PUBLIC - User Registration (Email & Password)
   * Creates Supabase auth.user and sends OTP to email
   * No authentication required - user hasn't signed up yet
   */
  @Post('step-1')
  @Public()
  async step1(@Body() dto: Step1Dto) {
    return this.onboardingService.createUserAndSendOTP(dto);
  }

  /**
   * STEP 2: PUBLIC - OTP Verification
   * Verifies email via OTP, creates profile if needed, returns session tokens
   * No authentication required - user verifies after receiving OTP
   */
  @Post('step-2/verify-otp')
  @Public()
  async step2(@Body() dto: Step2Dto) {
    return this.onboardingService.verifyOTPAndCreateProfile(dto);
  }

  /**
   * Get onboarding status (PROTECTED - requires authentication)
   */
  @Get('status')
  async getStatus(@Request() req: RequestWithUser) {
    return this.onboardingService.getStatus(req.user.sub);
  }

  /**
   * STEP 3: PROTECTED - Company Information
   * Requires authentication from Step 2 onwards
   */
  @Post('step-3')
  async step3(@Request() req: RequestWithUser, @Body() dto: Step3Dto) {
    // Step 3 completed -> User is at Step 4
    return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 4 });
  }

  /**
   * STEP 4: PROTECTED
   */
  @Post('step-4')
  async step4(@Request() req: RequestWithUser, @Body() dto: Step4Dto) {
    // Step 4 completed -> User is at Step 5
    return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 5 });
  }

  /**
   * STEP 5: PROTECTED
   */
  @Post('step-5')
  async step5(@Request() req: RequestWithUser, @Body() dto: Step5Dto) {
    // Step 5 completed -> User is at Step 6
    return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 6 });
  }

  /**
   * STEP 6: PROTECTED
   */
  @Post('step-6')
  async step6(@Request() req: RequestWithUser, @Body() dto: Step6Dto) {
    // Step 6 completed -> User is at Step 7
    return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 7 });
  }

  /**
   * STEP 7: PROTECTED - Send SMS verification code
   */
  @Post('step-7/send-sms')
  async sendPhoneCode(@Request() req: RequestWithUser) {
    return this.onboardingService.sendPhoneVerification(req.user.sub);
  }

  /**
   * STEP 7: PROTECTED - Verify SMS code
   */
  @Post('step-7/verify-sms')
  async verifyPhoneCode(@Request() req: RequestWithUser, @Body() dto: VerifyPhoneDto) {
    return this.onboardingService.verifyPhoneCode(req.user.sub, dto.code);
  }

  /**
   * Complete onboarding (PROTECTED)
   */
  @Post('complete')
  async complete(@Request() req: RequestWithUser) {
    return this.onboardingService.completeOnboarding(req.user.sub);
  }
}
