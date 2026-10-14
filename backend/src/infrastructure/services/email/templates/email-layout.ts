import { readFileSync } from 'fs';
import { join } from 'path';
import {
  EmailAttachment,
  SendEmailInput,
} from '@/application/ports/email-sender.port';
import { escapeHtml } from './email-formatters';

export type RenderedEmail = Omit<SendEmailInput, 'to'>;

export const EMAIL_TITLE = 'Oficina Mecânica - Tech Challenge';

export const EMAIL_LOGO_CONTENT_ID = 'logo';

// Copiado para o dist pelo "assets" do nest-cli.json
const LOGO_PATH = join(__dirname, '..', 'assets', 'logo.png');

let logo: Buffer | undefined;

// Anexo inline: o Gmail bloqueia imagens em data URI, mas exibe cid:
function logoAttachment(): EmailAttachment {
  logo ??= readFileSync(LOGO_PATH);

  return {
    filename: 'logo.png',
    content: logo,
    contentType: 'image/png',
    contentId: EMAIL_LOGO_CONTENT_ID,
  };
}

export interface EmailLayoutInput {
  title: string;
  preheader: string;
  content: string;
}

// Identidade visual baseada no portal da Pós Tech: tema escuro com destaque magenta.
export const EMAIL_COLORS = {
  background: '#1E1E1E',
  surface: '#2B2B2B',
  border: '#3D3D3D',
  primary: '#ED145B',
  success: '#2ECC71',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#8C8C8C',
} as const;

// Gmail e Outlook ignoram web fonts e caem no Arial.
export const EMAIL_FONT = "'Montserrat', Arial, Helvetica, sans-serif";

export const EMAIL_FOOTER_TEXT =
  'Este é um e-mail automático. Por favor, não responda.';

export const EMAIL_TEXT_STYLE = `font-family:${EMAIL_FONT};color:${EMAIL_COLORS.textSecondary};font-size:15px;line-height:24px;`;

export interface EmailHeadingInput {
  highlight: string;
  title: string;
  caption: string;
}

export function renderEmailHeading({
  highlight,
  title,
  caption,
}: EmailHeadingInput): string {
  const colors = EMAIL_COLORS;

  return `<p style="margin:0;font-family:${EMAIL_FONT};font-size:20px;line-height:28px;color:${colors.text};"><strong>${escapeHtml(highlight)}</strong> - ${escapeHtml(title)}</p>
            <p style="margin:6px 0 0 0;font-family:${EMAIL_FONT};font-size:11px;font-weight:600;letter-spacing:0.5px;color:${colors.success};">${escapeHtml(caption)}</p>`;
}

export function renderEmailLayout({
  title,
  preheader,
  content,
}: EmailLayoutInput): Pick<RenderedEmail, 'html' | 'attachments'> {
  return {
    html: renderHtml({ title, preheader, content }),
    attachments: [logoAttachment()],
  };
}

function renderHtml({ title, preheader, content }: EmailLayoutInput): string {
  const colors = EMAIL_COLORS;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${colors.background};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.background}" style="background-color:${colors.background};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td bgcolor="${colors.surface}" style="background-color:${colors.surface};padding:20px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:16px;">
                  <img src="cid:${EMAIL_LOGO_CONTENT_ID}" width="64" height="64" alt="Logo ${EMAIL_TITLE}" style="display:block;width:64px;height:64px;border:0;">
                </td>
                <td valign="middle" style="font-family:${EMAIL_FONT};font-size:17px;line-height:24px;letter-spacing:1.5px;color:${colors.text};">
                  <span style="font-weight:700;">OFICINA MECÂNICA</span> <span style="font-weight:400;color:${colors.primary};">- TECH CHALLENGE</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid ${colors.border};padding-top:16px;font-family:${EMAIL_FONT};font-size:12px;line-height:18px;color:${colors.textMuted};">
                  ${EMAIL_FOOTER_TEXT}<br>
                  ${EMAIL_TITLE}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
