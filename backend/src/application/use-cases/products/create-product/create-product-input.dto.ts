import { ItemType, ItemUnit } from '@/domain/entities/item.entity';

export interface CreateItemInputDto {
  sku: string;
  name: string;
  description?: string;
  itemType: ItemType;
  unit: ItemUnit;
  cost: number;
  salePrice: number;
}
