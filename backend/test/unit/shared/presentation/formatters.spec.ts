import {
  escapeHtml,
  formatCurrency,
  formatDate,
} from '@/shared/presentation/formatters';

describe('presentation formatters', () => {
  // Intl separa "R$" do valor com espaço não separável
  const nbsp = String.fromCharCode(160);

  it('should escape html special characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });

  it('should format currency in BRL', () => {
    expect(formatCurrency(1809.5)).toBe(`R$${nbsp}1.809,50`);
  });

  it('should format the date in the Sao Paulo timezone', () => {
    expect(formatDate(new Date('2026-10-07T01:30:00Z'))).toBe('06/10/2026');
  });
});
