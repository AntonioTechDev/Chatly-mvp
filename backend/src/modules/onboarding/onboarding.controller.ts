import { Body, Controller, Post, Get, Request, UseGuards, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) { }

  /**
   * STEP 1: PUBLIC - User Registration (Email & Password)
   * Creates Supabase auth.user and sends OTP to email
   * No authentication required - user hasn't signed up yet
   */
  @Post('step-1')
  @Public()
  async step1(@Body() dto: Step1Dto) {
    this.logger.log(`[step-1] REQUEST received: ${JSON.stringify({ email: dto.email })}`);
    try {
      const result = await this.onboardingService.createUserAndSendOTP(dto);
      this.logger.log(`[step-1] SUCCESS: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`[step-1] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 2: PUBLIC - OTP Verification
   * Verifies email via OTP, creates profile if needed, returns session tokens
   * No authentication required - user verifies after receiving OTP
   */
  @Post('step-2/verify-otp')
  @Public()
  async step2(@Body() dto: Step2Dto) {
    this.logger.log(`[step-2/verify-otp] REQUEST received: ${JSON.stringify({ email: dto.email, codeLength: dto.otp?.length })}`);
    try {
      const result = await this.onboardingService.verifyOTPAndCreateProfile(dto);
      this.logger.log(`[step-2/verify-otp] SUCCESS`);
      return result;
    } catch (error) {
      this.logger.error(`[step-2/verify-otp] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get onboarding status (PROTECTED - requires authentication)
   */
  @Get('status')
  async getStatus(@Request() req: RequestWithUser) {
    this.logger.log(`[status] REQUEST received: userId=${req.user.sub}`);
    try {
      const result = await this.onboardingService.getStatus(req.user.sub);
      this.logger.log(`[status] SUCCESS: ${JSON.stringify({ currentStep: result.currentStep, status: result.onboardingStatus })}`);
      return result;
    } catch (error) {
      this.logger.error(`[status] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 3: PROTECTED - Company Information
   * Requires authentication from Step 2 onwards
   */
  @Post('step-3')
  async step3(@Request() req: RequestWithUser, @Body() dto: Step3Dto) {
    this.logger.log(`[step-3] REQUEST received: userId=${req.user.sub}, data=${JSON.stringify(dto)}`);
    try {
      // Step 3 completed -> User is at Step 4
      const result = await this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 4 });
      this.logger.log(`[step-3] SUCCESS: moved to step 4`);
      return result;
    } catch (error) {
      this.logger.error(`[step-3] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 4: PROTECTED
   */
  @Post('step-4')
  async step4(@Request() req: RequestWithUser, @Body() dto: Step4Dto) {
    this.logger.log(`[step-4] REQUEST received: userId=${req.user.sub}, data=${JSON.stringify(dto)}`);
    try {
      // Step 4 completed -> User is at Step 5
      const result = await this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 5 });
      this.logger.log(`[step-4] SUCCESS: moved to step 5`);
      return result;
    } catch (error) {
      this.logger.error(`[step-4] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 5: PROTECTED
   */
  @Post('step-5')
  async step5(@Request() req: RequestWithUser, @Body() dto: Step5Dto) {
    this.logger.log(`[step-5] REQUEST received: userId=${req.user.sub}, data=${JSON.stringify(dto)}`);
    try {
      // Step 5 completed -> User is at Step 6
      const result = await this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 6 });
      this.logger.log(`[step-5] SUCCESS: moved to step 6`);
      return result;
    } catch (error) {
      this.logger.error(`[step-5] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 6: PROTECTED
   */
  @Post('step-6')
  async step6(@Request() req: RequestWithUser, @Body() dto: Step6Dto) {
    this.logger.log(`[step-6] REQUEST received: userId=${req.user.sub}, data=${JSON.stringify(dto)}`);
    try {
      // Step 6 completed -> User is at Step 7
      const result = await this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 7 });
      this.logger.log(`[step-6] SUCCESS: moved to step 7`);
      return result;
    } catch (error) {
      this.logger.error(`[step-6] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 7: PROTECTED - Send SMS verification code
   */
  @Post('step-7/send-sms')
  async sendPhoneCode(@Request() req: RequestWithUser) {
    this.logger.log(`[step-7/send-sms] REQUEST received: userId=${req.user.sub}`);
    try {
      const result = await this.onboardingService.sendPhoneVerification(req.user.sub);
      this.logger.log(`[step-7/send-sms] SUCCESS`);
      return result;
    } catch (error) {
      this.logger.error(`[step-7/send-sms] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * STEP 7: PROTECTED - Verify SMS code
   */
  @Post('step-7/verify-sms')
  async verifyPhoneCode(@Request() req: RequestWithUser, @Body() dto: VerifyPhoneDto) {
    this.logger.log(`[step-7/verify-sms] REQUEST received: userId=${req.user.sub}, codeLength=${dto.code?.length}`);
    try {
      const result = await this.onboardingService.verifyPhoneCode(req.user.sub, dto.code);
      this.logger.log(`[step-7/verify-sms] SUCCESS`);
      return result;
    } catch (error) {
      this.logger.error(`[step-7/verify-sms] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Complete onboarding (PROTECTED)
   */
  @Post('complete')
  async complete(@Request() req: RequestWithUser) {
    this.logger.log(`[complete] REQUEST received: userId=${req.user.sub}`);
    try {
      const result = await this.onboardingService.completeOnboarding(req.user.sub);
      this.logger.log(`[complete] SUCCESS`);
      return result;
    } catch (error) {
      this.logger.error(`[complete] ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }
}
