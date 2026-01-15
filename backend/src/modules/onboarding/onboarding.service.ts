import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliveryChannel } from '../notifications/dtos/send-otp.dto';
import { Step1Dto } from './dtos/step1.dto';
import { Step2Dto } from './dtos/step2.dto';

@Injectable()
export class OnboardingService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * STEP 1: Create User and Send OTP (PUBLIC - No Auth Required)
   *
   * Creates a new Supabase auth.user with email/password
   * Supabase automatically sends OTP to email
   *
   * @param dto - Contains email and password
   * @returns User ID and confirmation message
   */
  async createUserAndSendOTP(dto: Step1Dto) {
    try {
      // 1. Create Supabase auth user
      const { data, error } = await this.supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          // Frontend will redirect to Step 2 after user clicks email link
          emailRedirectTo: `${this.configService.get('FRONTEND_URL')}/onboarding/step-2`,
        },
      });

      if (error) {
        console.error('Auth signUp error:', error);
        throw new BadRequestException(
          error.message || 'Failed to create user account'
        );
      }

      if (!data.user) {
        throw new BadRequestException('User creation failed - no user returned');
      }

      console.log(`User created: ${data.user.id} (${dto.email})`);

      // 2. OTP is sent automatically by Supabase
      // User will receive email with OTP code
      return {
        success: true,
        message: 'Account created. Check your email for the OTP code.',
        userId: data.user.id,
        email: data.user.email,
        needsOtpVerification: true,
      };
    } catch (error) {
      console.error('createUserAndSendOTP error:', error);
      throw error;
    }
  }

  /**
   * STEP 2: Verify OTP and Create Profile (PUBLIC - No Auth Required)
   *
   * Verifies the OTP token sent to email
   * Creates user profile if it doesn't exist
   * Returns session tokens for authenticated requests in Step 3+
   *
   * @param dto - Contains email and OTP code
   * @returns Session tokens and user profile data
   */
  async verifyOTPAndCreateProfile(dto: Step2Dto) {
    try {
      // 1. Verify OTP token with Supabase
      const { data, error } = await this.supabase.auth.verifyOtp({
        email: dto.email,
        token: dto.otp,
        type: 'signup',
      });

      if (error) {
        console.error('OTP verification error:', error);
        throw new UnauthorizedException(
          'Invalid or expired OTP code. Please try again.'
        );
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('OTP verification failed');
      }

      const userId = data.user.id;
      console.log(`OTP verified for user: ${userId}`);

      // 2. Check if profile exists, create if needed
      const { data: existingProfile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      let profile = existingProfile;

      if (profileError || !existingProfile) {
        // Profile doesn't exist - create it
        console.log(`Creating profile for user ${userId}`);
        const { data: newProfile, error: createError } = await this.supabase
          .from('profiles')
          .insert({
            id: userId,
            email: dto.email,
            role: 'business_owner', // Default role
            phone_number: null,
            phone_verified: false,
          })
          .select('*')
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          // Don't fail here - profile might have been created by trigger
          // Try to fetch it again
          const { data: fetchedProfile } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          profile = fetchedProfile;
        } else {
          profile = newProfile;
        }
      }

      console.log(`Profile ready for user ${userId}`);

      // 3. Return session tokens and user data for Step 3+
      return {
        success: true,
        message: 'Email verified successfully',
        userId: data.user.id,
        email: data.user.email,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        profile: profile,
        readyForStep3: true,
      };
    } catch (error) {
      console.error('verifyOTPAndCreateProfile error:', error);
      throw error;
    }
  }

  /**
   * Gets the current onboarding status and data for a user
   * PROTECTED - requires authentication
   */
  async getStatus(userId: string) {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*, platform_clients(*)')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('getStatus Error:', profileError);
      // If profile not found, return rudimentary status or error
      // Assuming profile MUST exist for auth user
      throw new NotFoundException(`Profile not found: ${profileError.message}`);
    }

    const client = profile.platform_clients;

    return {
      currentStep: client?.onboarding_step || 1, // Default to 1
      onboardingStatus: client?.onboarding_status || 'started',
      // Return merged data for the wizard
      data: {
        // Profile Data
        role: profile.role,
        phone: profile.phone_number,

        // Client Data
        companyName: client?.business_name,
        website: client?.website,
        industry: client?.industry,
        employeeCount: client?.employee_count,
        customerType: client?.customer_type,
        acquisitionChannels: client?.acquisition_channels,
        usageGoals: client?.usage_goals,

        // Meta info
        emailVerified: true // Assuming true if they are authenticated via Supabase
      }
    };
  }

  /**
   * Updates the wizard step data.
   * Automatically creates platform_client if missing.
   * PROTECTED - requires authentication
   */
  async saveStep(userId: string, data: any) {
    // 1. Ensure Profile & Platform Client Link
    const clientId = await this.ensurePlatformClient(userId, data);

    // 2. Prepare Updates
    const dbUpdate: Record<string, any> = {};

    // Platform Client Updates
    if (data.companyName) dbUpdate['business_name'] = data.companyName;
    if (data.website) dbUpdate['website'] = data.website;
    if (data.industry) dbUpdate['industry'] = data.industry;
    if (data.employeeCount) dbUpdate['employee_count'] = data.employeeCount;
    if (data.customerType) dbUpdate['customer_type'] = data.customerType;
    if (data.acquisitionChannels) dbUpdate['acquisition_channels'] = data.acquisitionChannels;
    if (data.usageGoals) dbUpdate['usage_goals'] = data.usageGoals;

    // Step tracking
    if (data.currentStep) {
      // Only advance, don't regress unless explicit? Usually logic is "save current state".
      dbUpdate['onboarding_step'] = data.currentStep;
    }

    // Status Updates
    if (data.currentStep === 1) dbUpdate['onboarding_status'] = 'started';
    // More status logic can be added here

    if (data.isCompleted) {
      dbUpdate['onboarding_completed_at'] = new Date().toISOString();
      dbUpdate['status'] = 'active'; // Activate tenant
      dbUpdate['onboarding_status'] = 'completed';
    }

    // Profile Updates (Role, Phone)
    const profileUpdate: Record<string, any> = {};
    if (data.role) profileUpdate['role'] = data.role;
    if (data.phone) profileUpdate['phone_number'] = data.phone; // Assuming phone collected in step 7

    // 3. Execute Updates
    if (Object.keys(dbUpdate).length > 0) {
      const { error } = await this.supabase
        .from('platform_clients')
        .update(dbUpdate)
        .eq('id', clientId);

      if (error) throw new InternalServerErrorException(`Failed to update client: ${error.message}`);
    }

    if (Object.keys(profileUpdate).length > 0) {
      await this.supabase.from('profiles').update(profileUpdate).eq('id', userId);
    }

    return { success: true, step: data.currentStep };
  }

  /**
   * Checks if user has a platform_client linked. If not, creates one.
   * Returns the platform_client_id.
   */
  private async ensurePlatformClient(userId: string, contextData: any): Promise<number> {
    // 1. Get Profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('platform_client_id, email') // Assuming email might be in profiles if synced, OR we get it from auth.users (not accessible easily here without admin call or passing it)
      // Ideally contextData should have email if it's step 1.
      .eq('id', userId)
      .single();

    if (profile?.platform_client_id) {
      return profile.platform_client_id;
    }

    // 2. Create new Platform Client
    // We need an email for the business. Use user's email if available, or placeholder.
    const email = contextData.email || `${userId}@placeholder.chatly`;
    // Note: For Step 1, we expect email in data.

    const { data: newClient, error: createError } = await this.supabase
      .from('platform_clients')
      .insert({
        business_name: contextData.companyName || 'My Business', // Default until set
        email: email,
        onboarding_status: 'started',
        onboarding_step: 1
      })
      .select('id')
      .single();

    if (createError) {
      console.error('ensurePlatformClient Error:', createError);
      // Handle unique constraint: maybe client exists by email?
      // Logic to attach existing client could go here ("Invite flow").
      throw new InternalServerErrorException(`Failed to create tenant: ${createError.message}`);
    }

    // 3. Link to Profile
    await this.supabase
      .from('profiles')
      .update({ platform_client_id: newClient.id })
      .eq('id', userId);

    return newClient.id;
  }

  /**
   * Send SMS verification code (PROTECTED)
   */
  async sendPhoneVerification(userId: string) {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', userId)
      .single();

    if (!profile?.phone_number) {
      throw new InternalServerErrorException('Phone number not found for user');
    }

    return this.notificationsService.sendOtp(profile.phone_number, DeliveryChannel.SMS);
  }

  /**
   * Verify SMS code (PROTECTED)
   */
  async verifyPhoneCode(userId: string, code: string) {
    // Mock verification
    // In prod: verify via Twilio
    const isValid = code === '123456' || code === '987654';

    if (isValid) {
      await this.supabase.from('profiles').update({ phone_verified: true }).eq('id', userId);
      return { success: true };
    }

    throw new InternalServerErrorException('Invalid OTP code');
  }

  /**
   * Complete onboarding (PROTECTED)
   */
  async completeOnboarding(userId: string) {
    const clientId = await this.ensurePlatformClient(userId, {});

    const { error } = await this.supabase
      .from('platform_clients')
      .update({
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString(),
        status: 'active',
        onboarding_step: 7
      })
      .eq('id', clientId);

    if (error) throw new InternalServerErrorException(`Failed to complete onboarding: ${error.message}`);

    // Also ensure profile is marked as phone verified since they passed step 7
    await this.supabase.from('profiles').update({ phone_verified: true }).eq('id', userId);

    return { success: true };
  }
}
