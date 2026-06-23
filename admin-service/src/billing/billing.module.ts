import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
