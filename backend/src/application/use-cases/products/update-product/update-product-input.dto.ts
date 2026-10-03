import { ItemType, ItemUnit } from '@/domain/entities/item.entity';

export interface UpdateItemInputDto {
  id: string;
  sku: string;
  name: string;
  description?: string;
  itemType: ItemType;
  unit: ItemUnit;
  cost: number;
  salePrice: number;
}
