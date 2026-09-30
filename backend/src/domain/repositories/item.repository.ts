import { Item } from '../entities/item.entity';

export interface ItemRepository {
  save(item: Item): Promise<Item>;
  findById(id: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  findBySku(sku: string): Promise<Item | null>;
}
