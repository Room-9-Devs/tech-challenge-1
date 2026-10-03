import { ParallelumFipeGateway } from '@/infrastructure/services/fipe/parallelum-fipe.gateway';
import {
  FipeNotFoundError,
  FipeUnavailableError,
  FipeTimeoutError,
  FipeRateLimitError,
} from '@/domain/errors/fipe.error';

const price = {
  brand: 'Fiat',
  codeFipe: '001004-9',
  fuel: 'Gasolina',
  fuelAcronym: 'G',
  model: 'Palio',
  modelYear: 2000,
  price: 'R$ 10.000,00',
  referenceMonth: 'outubro de 2026',
  vehicleType: 1,
};
function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
function gateway(token?: string): ParallelumFipeGateway {
  return new ParallelumFipeGateway({
    get: jest.fn().mockReturnValue(token),
  } as never);
}

describe('ParallelumFipeGateway', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns all year/fuel prices using the existing response contract', async () => {
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response([{ code: '2000-1' }, { code: '1999-2' }]))
      .mockResolvedValueOnce(response(price))
      .mockResolvedValueOnce(
        response({
          ...price,
          modelYear: 1999,
          fuel: 'Álcool',
          fuelAcronym: 'A',
        }),
      );
    const result = await gateway().getPrices('001004-9');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      valor: price.price,
      marca: price.brand,
      modelo: price.model,
      anoModelo: 2000,
      combustivel: 'Gasolina',
      codigoFipe: '001004-9',
      mesReferencia: price.referenceMonth,
      tipoVeiculo: 1,
      siglaCombustivel: 'G',
      dataConsulta: expect.any(String),
    });
    expect(result[1]).toMatchObject({ anoModelo: 1999, combustivel: 'Álcool' });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://fipe.parallelum.com.br/api/v2/cars/001004-9/years',
      {
        headers: { Accept: 'application/json' },
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://fipe.parallelum.com.br/api/v2/cars/001004-9/years/2000-1',
      expect.any(Object),
    );
  });

  it('sends the optional subscription token only as a header', async () => {
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response([{ code: '2000-1' }]))
      .mockResolvedValueOnce(response(price));
    await gateway('test-token').getPrices('001004-9');
    for (const [url, options] of fetch.mock.calls) {
      expect(String(url)).not.toContain('test-token');
      expect(options?.headers).toEqual({
        Accept: 'application/json',
        'X-Subscription-Token': 'test-token',
      });
    }
  });

  it.each([
    ['motorcycles', 2, 1],
    ['trucks', 3, 2],
  ])('finds a code belonging to %s', async (type, typeId, notFoundCount) => {
    const fetch = jest.spyOn(global, 'fetch');
    for (let i = 0; i < notFoundCount; i++)
      fetch.mockResolvedValueOnce(response({}, 404));
    fetch
      .mockResolvedValueOnce(response([{ code: '2000-1' }]))
      .mockResolvedValueOnce(response({ ...price, vehicleType: typeId }));
    await expect(gateway().getPrices('001004-9')).resolves.toEqual([
      expect.objectContaining({ tipoVeiculo: typeId }),
    ]);
    expect(fetch).toHaveBeenCalledWith(
      `https://fipe.parallelum.com.br/api/v2/${type}/001004-9/years`,
      expect.any(Object),
    );
  });

  it('returns not found when the code is absent in every vehicle type', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({}, 404));
    await expect(gateway().getPrices('001004-9')).rejects.toThrow(
      FipeNotFoundError,
    );
  });

  it('stops on quota exhaustion rather than treating it as a missing code', async () => {
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(response({}, 429));
    await expect(gateway().getPrices('001004-9')).rejects.toThrow(
      FipeRateLimitError,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 500])(
    'maps provider HTTP %s to an upstream failure',
    async (status) => {
      jest.spyOn(global, 'fetch').mockResolvedValue(response({}, status));
      await expect(gateway().getPrices('001004-9')).rejects.toThrow(
        FipeUnavailableError,
      );
    },
  );

  it('maps network failures', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));
    await expect(gateway().getPrices('001004-9')).rejects.toThrow(
      FipeUnavailableError,
    );
  });

  it('maps an expired request deadline to a timeout', async () => {
    const controller = new AbortController();
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      controller.abort();
      throw new Error('aborted');
    });
    await expect(gateway().getPrices('001004-9')).rejects.toThrow(
      FipeTimeoutError,
    );
  });

  it.each([{}, [{ code: '../invalid' }]])(
    'rejects malformed year data',
    async (body) => {
      jest.spyOn(global, 'fetch').mockResolvedValue(response(body));
      await expect(gateway().getPrices('001004-9')).rejects.toThrow(
        FipeUnavailableError,
      );
    },
  );

  it.each([{}, { ...price, price: 10000 }, { ...price, codeFipe: '001005-7' }])(
    'rejects malformed or mismatched price data',
    async (body) => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(response([{ code: '2000-1' }]))
        .mockResolvedValueOnce(response(body));
      await expect(gateway().getPrices('001004-9')).rejects.toThrow(
        FipeUnavailableError,
      );
    },
  );

  it('accepts the zero-kilometer year identifier', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response([{ code: '32000-1' }]))
      .mockResolvedValueOnce(response({ ...price, modelYear: 32000 }));
    await expect(gateway().getPrices('001004-9')).resolves.toEqual([
      expect.objectContaining({ anoModelo: 32000 }),
    ]);
  });
});
