import { ItemType, ItemUnit } from '@/domain/entities/item.entity';

export interface ListItemsOutputDto {
  items: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    itemType: ItemType;
    unit: ItemUnit;
    cost: number;
    salePrice: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
