import { readBrandLogo } from '@/shared/presentation/logo';

describe('readBrandLogo', () => {
  it('should load the PNG logo once and reuse it', () => {
    const logo = readBrandLogo();

    // Assinatura de arquivo PNG
    expect(logo.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(readBrandLogo()).toBe(logo);
  });
});
