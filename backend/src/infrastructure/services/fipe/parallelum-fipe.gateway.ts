import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FipeGateway, FipePrice } from '@/application/ports/fipe.gateway';
import { DomainError } from '@/domain/errors/domain.error';
import {
  FipeNotFoundError,
  FipeUnavailableError,
  FipeTimeoutError,
  FipeRateLimitError,
} from '@/domain/errors/fipe.error';

interface ParallelumPrice {
  brand: string;
  codeFipe: string;
  fuel: string;
  fuelAcronym: string;
  model: string;
  modelYear: number;
  price: string;
  referenceMonth: string;
  vehicleType: number;
}

function isPrice(value: unknown): value is ParallelumPrice {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    [
      'brand',
      'codeFipe',
      'fuel',
      'fuelAcronym',
      'model',
      'price',
      'referenceMonth',
    ].every(
      (key) =>
        typeof data[key] === 'string' &&
        (data[key] as string).trim().length > 0,
    ) &&
    Number.isInteger(data.modelYear) &&
    [1, 2, 3].includes(data.vehicleType as number)
  );
}

@Injectable()
export class ParallelumFipeGateway implements FipeGateway {
  constructor(private readonly config: ConfigService) {}

  async getPrices(code: string): Promise<FipePrice[]> {
    // One deadline covers discovery and all price requests.
    const signal = AbortSignal.timeout(10000);
    try {
      for (const type of ['cars', 'motorcycles', 'trucks']) {
        const path = `/${type}/${encodeURIComponent(code)}/years`;
        let years: unknown;
        try {
          years = await this.request(path, signal);
        } catch (error) {
          if (error instanceof FipeNotFoundError) continue;
          throw error;
        }
        if (!Array.isArray(years)) throw new FipeUnavailableError();
        if (years.length === 0) continue;
        const yearCodes = years.map((year: unknown) => {
          if (
            typeof year !== 'object' ||
            year === null ||
            !('code' in year) ||
            typeof year.code !== 'string' ||
            !/^(?:\d{4}|32000)-\d$/.test(year.code)
          ) {
            throw new FipeUnavailableError();
          }
          return year.code;
        });
        const prices: FipePrice[] = [];
        // Limit concurrency instead of sending every model-year request at once.
        for (let index = 0; index < yearCodes.length; index += 4) {
          // Um 404 em um ano individual não pode derrubar a resposta inteira.
          const batch = await Promise.all(
            yearCodes.slice(index, index + 4).map(async (year) => {
              let data: unknown;
              try {
                data = await this.request(
                  `${path}/${encodeURIComponent(year)}`,
                  signal,
                );
              } catch (error) {
                if (error instanceof FipeNotFoundError) return null;
                throw error;
              }
              if (!isPrice(data) || data.codeFipe !== code)
                throw new FipeUnavailableError();
              return {
                valor: data.price,
                marca: data.brand,
                modelo: data.model,
                anoModelo: data.modelYear,
                combustivel: data.fuel,
                codigoFipe: data.codeFipe,
                mesReferencia: data.referenceMonth,
                tipoVeiculo: data.vehicleType,
                siglaCombustivel: data.fuelAcronym,
                dataConsulta: new Date().toISOString(),
              } as FipePrice;
            }),
          );
          prices.push(
            ...batch.filter(
              (price): price is FipePrice => price !== null,
            ),
          );
        }
        if (prices.length === 0) continue;
        return prices;
      }
      throw new FipeNotFoundError();
    } catch (error) {
      if (signal.aborted) throw new FipeTimeoutError();
      if (error instanceof DomainError) throw error;
      throw new FipeUnavailableError();
    }
  }

  private async request(path: string, signal: AbortSignal): Promise<unknown> {
    const token = this.config.get<string>('FIPE_API_TOKEN')?.trim();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['X-Subscription-Token'] = token;
    const response = await fetch(
      `https://fipe.parallelum.com.br/api/v2${path}`,
      { headers, signal },
    );
    if (response.status === 404) throw new FipeNotFoundError();
    if (response.status === 429) throw new FipeRateLimitError();
    if (!response.ok) throw new FipeUnavailableError();
    return response.json();
  }
}
