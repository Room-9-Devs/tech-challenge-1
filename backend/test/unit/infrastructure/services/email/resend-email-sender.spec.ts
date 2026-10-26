import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ResendEmailSender } from '@/infrastructure/services/email/resend-email-sender';

jest.mock('resend');

describe('ResendEmailSender', () => {
  const input = {
    to: 'cliente@example.com',
    subject: 'Orçamento disponível',
    html: '<p>Seu orçamento está disponível.</p>',
  };

  let sendMock: jest.Mock;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  const createConfigService = (
    env: Record<string, string | undefined>,
  ): ConfigService =>
    ({ get: jest.fn((key: string) => env[key]) }) as unknown as ConfigService;

  beforeEach(() => {
    sendMock = jest.fn();
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: { send: sendMock },
    }));
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should send email through Resend with configured sender', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    const sender = new ResendEmailSender(
      createConfigService({
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'oficina@example.com',
      }),
    );

    await sender.send(input);

    expect(Resend).toHaveBeenCalledWith('re_test');
    expect(sendMock).toHaveBeenCalledWith({
      from: 'oficina@example.com',
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should forward inline attachments to Resend', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    const sender = new ResendEmailSender(
      createConfigService({
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'oficina@example.com',
      }),
    );
    const attachments = [
      {
        filename: 'logo.png',
        content: Buffer.from('png'),
        contentType: 'image/png',
        contentId: 'logo',
      },
    ];

    await sender.send({ ...input, attachments });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ attachments }),
    );
  });

  it('should redirect to EMAIL_REDIRECT_TO keeping the original subject', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    const sender = new ResendEmailSender(
      createConfigService({
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'oficina@example.com',
        EMAIL_REDIRECT_TO: 'professor@example.com',
      }),
    );

    await sender.send(input);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['professor@example.com'],
        subject: 'Orçamento disponível',
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('professor@example.com'),
    );
  });

  it('should accept comma separated addresses in EMAIL_REDIRECT_TO', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    const sender = new ResendEmailSender(
      createConfigService({
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'oficina@example.com',
        EMAIL_REDIRECT_TO: ' professor@example.com, monitor@example.com ,',
      }),
    );

    await sender.send({ ...input, to: ['a@example.com', 'b@example.com'] });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['professor@example.com', 'monitor@example.com'],
        subject: 'Orçamento disponível',
      }),
    );
  });

  it('should log and not throw when Resend returns an error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        name: 'validation_error',
        message: 'Invalid from',
        statusCode: 422,
      },
    });
    const sender = new ResendEmailSender(
      createConfigService({
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'oficina@example.com',
      }),
    );

    await expect(sender.send(input)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should log and not throw when Resend client throws', async () => {
    sendMock.mockRejectedValue(new Error('Network error'));
    const sender = new ResendEmailSender(
      createConfigService({
        RESEND_API_KEY: 're_test',
        EMAIL_FROM: 'oficina@example.com',
      }),
    );

    await expect(sender.send(input)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip sending and warn when API key is not configured', async () => {
    const sender = new ResendEmailSender(
      createConfigService({ EMAIL_FROM: 'oficina@example.com' }),
    );

    await expect(sender.send(input)).resolves.toBeUndefined();
    expect(Resend).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
