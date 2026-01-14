import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { Step1Dto } from './dtos/step1.dto';
import { Step3Dto } from './dtos/step3.dto';
import { Step4Dto } from './dtos/step4.dto';
import { Step5Dto } from './dtos/step5.dto';
import { Step6Dto } from './dtos/step6.dto';
import { VerifyPhoneDto } from './dtos/verify-phone.dto';

@Controller('onboarding')
@UseGuards(SupabaseAuthGuard)
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Post('step-1')
    async step1(@Request() req: RequestWithUser, @Body() dto: Step1Dto) {
        return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 1 });
    }

    @Post('step-2/verify-email')
    async step2Confirm(@Request() req: RequestWithUser) {
        return this.onboardingService.saveStep(req.user.sub, { emailVerified: true, currentStep: 2 });
    }

    @Post('step-3')
    async step3(@Request() req: RequestWithUser, @Body() dto: Step3Dto) {
        return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 3 });
    }

    @Post('step-4')
    async step4(@Request() req: RequestWithUser, @Body() dto: Step4Dto) {
        return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 4 });
    }

    @Post('step-5')
    async step5(@Request() req: RequestWithUser, @Body() dto: Step5Dto) {
        return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 5 });
    }

    @Post('step-6')
    async step6(@Request() req: RequestWithUser, @Body() dto: Step6Dto) {
        return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 6 });
    }

    @Post('step-7/send-sms')
    async sendPhoneCode(@Request() req: RequestWithUser) {
        return this.onboardingService.sendPhoneVerification(req.user.sub);
    }

    @Post('step-7/verify-sms')
    async verifyPhoneCode(@Request() req: RequestWithUser, @Body() dto: VerifyPhoneDto) {
        return this.onboardingService.verifyPhoneCode(req.user.sub, dto.code);
    }
}
