import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'mock-key';
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async createCheckoutSession(organizationId: string, priceId: string): Promise<string> {
    const org = await this.prisma.organizations.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    const dashboardUrl = this.configService.get<string>('DASHBOARD_URL') || 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      client_reference_id: organizationId,
      metadata: {
        organizationId,
      },
      success_url: `${dashboardUrl}/dashboard/settings/billing?success=true`,
      cancel_url: `${dashboardUrl}/dashboard/settings/billing?canceled=true`,
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create Stripe checkout session');
    }

    return session.url;
  }

  async createPortalSession(organizationId: string): Promise<string> {
    const org = await this.prisma.organizations.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    if (!org.subscription_id) {
      throw new BadRequestException('Organization does not have an active subscription');
    }

    const dashboardUrl = this.configService.get<string>('DASHBOARD_URL') || 'http://localhost:3000';

    const subscription = await this.stripe.subscriptions.retrieve(org.subscription_id);
    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: subscription.customer as string,
      return_url: `${dashboardUrl}/dashboard/settings/billing`,
    });

    return portalSession.url;
  }
}
