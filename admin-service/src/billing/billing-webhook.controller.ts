import { Controller, Post, Headers, Req, Res, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Controller('billing/webhook')
export class BillingWebhookController {
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

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        return res.status(HttpStatus.BAD_REQUEST).send('Raw body missing');
      }

      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        const subscriptionId = session.subscription as string;

        if (orgId && subscriptionId) {
          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
          const priceId = (subscription as any).items?.data[0]?.price?.id;

          let planName = 'FREE';
          const starterPriceId = this.configService.get<string>('STRIPE_PRICE_STARTER');
          const proPriceId = this.configService.get<string>('STRIPE_PRICE_PROFESSIONAL');

          if (priceId === starterPriceId) planName = 'STARTER';
          else if (priceId === proPriceId) planName = 'PROFESSIONAL';

          await this.prisma.organizations.update({
            where: { id: orgId },
            data: {
              plan: planName,
              subscription_id: subscriptionId,
              plan_expires_at: new Date((subscription as any).current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
          
          await this.prisma.organizations.updateMany({
            where: { subscription_id: subscriptionId },
            data: {
              plan_expires_at: new Date((subscription as any).current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.prisma.organizations.updateMany({
          where: { subscription_id: subscription.id },
          data: {
            plan: 'FREE',
            subscription_id: null,
            plan_expires_at: null,
          },
        });
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = (subscription as any).items?.data[0]?.price?.id;
        
        let planName = 'FREE';
        const starterPriceId = this.configService.get<string>('STRIPE_PRICE_STARTER');
        const proPriceId = this.configService.get<string>('STRIPE_PRICE_PROFESSIONAL');

        if (priceId === starterPriceId) planName = 'STARTER';
        else if (priceId === proPriceId) planName = 'PROFESSIONAL';

        await this.prisma.organizations.updateMany({
          where: { subscription_id: subscription.id },
          data: {
            plan: planName,
            plan_expires_at: new Date((subscription as any).current_period_end * 1000),
          },
        });
        break;
      }
    }

    res.status(HttpStatus.OK).json({ received: true });
  }
}
