import { Product } from '@/domain/entities/product.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';

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

  async findAll(): Promise<Product[]> {
    return this.products.filter((product) => product.active);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.products.find((product) => product.sku === sku) ?? null;
  }

  clear(): void {
    this.products = [];
  }
}
