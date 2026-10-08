import { Product } from '@/domain/entities/product.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { compareValues } from '../helpers/compare-values';

export class FakeProductRepository implements ProductRepository {
  private products: Product[] = [];

  async save(product: Product): Promise<Product> {
    const existingIndex = this.products.findIndex(
      (existing) => existing.id === product.id,
    );

    if (existingIndex >= 0) {
      this.products[existingIndex] = product;
    } else {
      this.products.push(product);
    }

    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return (
      this.products.find((product) => product.id === id && product.active) ??
      null
    );
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number | boolean> },
  ): Promise<PaginatedOutput<Product>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search?.trim().toLowerCase();
    const filters = query?.filters ?? {};

    const allowedFilters = ['sku', 'name', 'productType', 'unit'];

    let data = this.products.filter((product) => product.active);

    for (const [key, rawValue] of Object.entries(filters)) {
      if (!allowedFilters.includes(key)) continue;

      const value = rawValue === 'true' ? true : rawValue === 'false' ? false : rawValue;
      data = data.filter((product) => {
        const productValue = (product as unknown as Record<string, unknown>)[key];
        return productValue === value;
      });
    }

    if (search) {
      const terms = search.split(/\s+/);
      data = data.filter((product) =>
        terms.some(
          (term) =>
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term) ||
            (product.description?.toLowerCase().includes(term) ?? false),
        ),
      );
    }

    const allowedSortColumns = [
      'name',
      'description',
      'sku',
      'productType',
      'unit',
      'cost',
      'salePrice',
      'active',
      'createdAt',
      'updatedAt',
    ];

    if (query?.sort && query.sort.length > 0) {
      data.sort((a, b) => {
        for (const { field, order } of query.sort!) {
          if (!allowedSortColumns.includes(field)) continue;

          const valueA = (a as unknown as Record<string, unknown>)[field];
          const valueB = (b as unknown as Record<string, unknown>)[field];

          if (valueA == null || valueB == null) continue;

          const comparison = compareValues(valueA, valueB);
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

  async findBySku(sku: string): Promise<Product | null> {
    return this.products.find((product) => product.sku === sku) ?? null;
  }

  clear(): void {
    this.products = [];
  }
}
