import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  async createCheckout(
    @GetUser() user: AuthenticatedUser,
    @Body('priceId') priceId: string,
  ): Promise<{ url: string }> {
    const url = await this.billingService.createCheckoutSession(user.organizationId, priceId);
    return { url };
  }

  @Post('portal')
  async createPortal(
    @GetUser() user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    const url = await this.billingService.createPortalSession(user.organizationId);
    return { url };
  }
}
