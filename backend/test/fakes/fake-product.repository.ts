import { Item } from '@/domain/entities/item.entity';
import { ItemRepository } from '@/domain/repositories/item.repository';

export class FakeItemRepository implements ItemRepository {
  private items: Item[] = [];

  async save(item: Item): Promise<Item> {
    const existingIndex = this.items.findIndex(
      (existing) => existing.id === item.id,
    );

    if (existingIndex >= 0) {
      this.items[existingIndex] = item;
    } else {
      this.items.push(item);
    }

    return item;
  }

  async findById(id: string): Promise<Item | null> {
    return this.items.find((item) => item.id === id && item.active) ?? null;
  }

  async findAll(): Promise<Item[]> {
    return this.items.filter((item) => item.active);
  }

  async findBySku(sku: string): Promise<Item | null> {
    return this.items.find((item) => item.sku === sku) ?? null;
  }

  clear(): void {
    this.items = [];
  }
}
