import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as public (no authentication required)
 * Used to bypass SupabaseAuthGuard on specific endpoints
 */
export const Public = () => SetMetadata('isPublic', true);
