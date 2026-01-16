import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    this.logger.log(`[canActivate] CHECKING route: ${route}`);

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(`[canActivate] Route is PUBLIC, bypassing auth`);
      return true;
    }

    this.logger.log(`[canActivate] Route is PROTECTED, validating JWT`);
    const result = super.canActivate(context);

    // Log result for debugging
    if (typeof result === 'boolean') {
      this.logger.log(`[canActivate] JWT validation result: ${result ? 'PASSED' : 'FAILED'}`);
    } else {
      this.logger.log(`[canActivate] JWT validation in progress (async)`);
    }

    return result;
  }
}
