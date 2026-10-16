import { Header, applyDecorators } from '@nestjs/common';
import {
  BRAND_COLORS,
  BRAND_FONT,
  BRAND_TITLE,
} from '@/shared/presentation/brand';
import { escapeHtml } from '@/shared/presentation/formatters';
import { readBrandLogo } from '@/shared/presentation/logo';

// Páginas sem JavaScript: a política pode bloquear tudo, exceto CSS inline e envio de formulário à própria API.
export const HTML_PAGE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  // O token está na URL: não pode vazar para outros sites nem ficar em cache ou em buscadores.
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
};

export function HtmlPage(): MethodDecorator {
  return applyDecorators(
    ...Object.entries(HTML_PAGE_HEADERS).map(([name, value]) =>
      Header(name, value),
    ),
  );
}

let logoDataUri: string | undefined;

// Embutida na página: dispensa uma rota pública só para a imagem e mantém a CSP restrita a data:
function brandLogoDataUri(): string {
  logoDataUri ??= `data:image/png;base64,${readBrandLogo().toString('base64')}`;
  return logoDataUri;
}

export interface PageLayoutInput {
  title: string;
  content: string;
}

export function renderPageLayout({ title, content }: PageLayoutInput): string {
  const colors = BRAND_COLORS;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: ${colors.background}; color: ${colors.textSecondary}; font-family: ${BRAND_FONT}; font-size: 15px; line-height: 24px; }
  main { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
  header { display: flex; align-items: center; gap: 16px; background: ${colors.surface}; padding: 20px 24px; font-size: 17px; line-height: 24px; letter-spacing: 1.5px; color: ${colors.text}; }
  header img { display: block; width: 64px; height: 64px; flex-shrink: 0; }
  header span { color: ${colors.primary}; }
  section { padding: 32px 24px; }
  h1 { margin: 0; font-size: 20px; line-height: 28px; color: ${colors.text}; font-weight: 400; }
  h1 strong { font-weight: 700; }
  .caption { margin: 6px 0 0; font-size: 11px; font-weight: 600; letter-spacing: .5px; color: ${colors.success}; }
  .quote { margin-top: 24px; padding: 24px; background: ${colors.surface}; border-left: 4px solid ${colors.primary}; }
  .quote-title { margin: 0 0 16px; font-size: 14px; font-weight: 700; letter-spacing: 1px; color: ${colors.text}; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 0 0 8px; border-bottom: 1px solid ${colors.border}; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: ${colors.textMuted}; text-align: left; }
  td { padding: 12px 0; border-bottom: 1px solid ${colors.border}; font-size: 14px; color: ${colors.text}; }
  .center { text-align: center; }
  .right { text-align: right; white-space: nowrap; }
  th + th, td + td { padding-left: 12px; }
  .muted { color: ${colors.textSecondary}; }
  .total td { border-bottom: 0; padding-top: 16px; font-weight: 700; letter-spacing: 1px; }
  .total .right { font-size: 18px; color: ${colors.primary}; }
  form { margin-top: 32px; }
  label { display: block; margin-bottom: 8px; font-size: 13px; color: ${colors.textSecondary}; }
  textarea { width: 100%; min-height: 96px; padding: 12px; background: ${colors.surface}; color: ${colors.text}; border: 1px solid ${colors.border}; font: inherit; resize: vertical; }
  button { margin-top: 16px; padding: 14px 32px; border: 1px solid ${colors.primary}; background: ${colors.primary}; color: ${colors.text}; font: inherit; font-size: 14px; font-weight: 700; letter-spacing: 1px; cursor: pointer; }
  button.secondary { background: transparent; border-color: ${colors.textMuted}; color: ${colors.textSecondary}; }
  a { color: ${colors.primary}; }
  .switch { margin-top: 24px; font-size: 13px; }
  .notice { margin-top: 24px; }
  footer { margin: 0 24px; padding-top: 16px; border-top: 1px solid ${colors.border}; font-size: 12px; line-height: 18px; color: ${colors.textMuted}; }
</style>
</head>
<body>
<main>
  <header>
    <img src="${brandLogoDataUri()}" width="64" height="64" alt="Logo ${escapeHtml(BRAND_TITLE)}">
    <div><strong>OFICINA MECÂNICA</strong> <span>- TECH CHALLENGE</span></div>
  </header>
  <section>
    ${content}
  </section>
  <footer>${BRAND_TITLE}</footer>
</main>
</body>
</html>`;
}
