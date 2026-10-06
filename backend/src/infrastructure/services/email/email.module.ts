import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from '@/application/ports/email-sender.port';
import { ResendEmailSender } from './resend-email-sender';

@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: ResendEmailSender,
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
