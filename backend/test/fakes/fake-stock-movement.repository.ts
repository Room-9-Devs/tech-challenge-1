import { StockMovement } from '@/domain/entities/stock-movement.entity';
import {
  StockMovementQuery,
  StockMovementRepository,
  StockMovementWithProduct,
} from '@/domain/repositories/stock-movement.repository';
import { PaginatedOutput } from '@/shared/pagination/pagination.types';
import { FakeProductRepository } from './fake-product.repository';

export class FakeStockMovementRepository implements StockMovementRepository {
  private stockMovements: StockMovement[] = [];

  constructor(private readonly productRepository?: FakeProductRepository) {}

  async save(stockMovement: StockMovement): Promise<StockMovement> {
    this.stockMovements.push(stockMovement);
    return stockMovement;
  }

  async findAll(
    query?: StockMovementQuery,
  ): Promise<PaginatedOutput<StockMovementWithProduct>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search?.trim().toLowerCase();
    const filters = query?.filters ?? {};

    let data: StockMovementWithProduct[] = [];

    for (const stockMovement of this.stockMovements) {
      const product = this.productRepository?.findAnyById(
        stockMovement.productId,
      );
      if (product) {
        data.push({ stockMovement, product });
      }
    }

    for (const key of ['productId', 'movementType', 'createdBy']) {
      if (filters[key] === undefined) continue;
      data = data.filter(
        ({ stockMovement }) =>
          (stockMovement as unknown as Record<string, unknown>)[key] ===
          filters[key],
      );
    }

    if (query?.startDate) {
      data = data.filter(
        ({ stockMovement }) => stockMovement.createdAt >= query.startDate!,
      );
    }

    if (query?.endDate) {
      data = data.filter(
        ({ stockMovement }) => stockMovement.createdAt <= query.endDate!,
      );
    }

    if (search) {
      const terms = search.split(/\s+/);
      data = data.filter(({ product }) =>
        terms.some(
          (term) =>
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term),
        ),
      );
    }

    data.sort(
      (a, b) =>
        b.stockMovement.createdAt.getTime() -
        a.stockMovement.createdAt.getTime(),
    );

    if (query?.sort && query.sort.length > 0) {
      data.sort((a, b) => {
        for (const { field, order } of query.sort!) {
          const valueA = (a.stockMovement as unknown as Record<string, unknown>)[field];
          const valueB = (b.stockMovement as unknown as Record<string, unknown>)[field];

          const comparison =
            valueA instanceof Date && valueB instanceof Date
              ? valueA.getTime() - valueB.getTime()
              : typeof valueA === 'number' && typeof valueB === 'number'
                ? valueA - valueB
                : String(valueA).localeCompare(String(valueB));

          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    data = data.slice(startIndex, startIndex + limit);

    return {
      data,
      meta: { page, limit, totalItems, totalPages },
    };
  }

  items(): StockMovement[] {
    return [...this.stockMovements];
  }

  clear(): void {
    this.stockMovements = [];
  }

  snapshot(): StockMovement[] {
    return [...this.stockMovements];
  }

  restore(stockMovements: StockMovement[]): void {
    this.stockMovements = [...stockMovements];
  }
}
