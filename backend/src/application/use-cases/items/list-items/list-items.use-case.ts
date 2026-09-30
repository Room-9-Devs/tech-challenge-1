import { Injectable, Inject } from '@nestjs/common';
import { ItemRepository } from '@/domain/repositories/item.repository';
import { ITEM_REPOSITORY } from '../create-item/create-item.use-case';
import { ListItemsOutputDto } from './list-items-output.dto';

@Injectable()
export class ListItemsUseCase {
  constructor(
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
  ) {}

  async execute(): Promise<ListItemsOutputDto> {
    const items = await this.itemRepository.findAll();

    return {
      items: items.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        itemType: item.itemType,
        unit: item.unit,
        cost: item.cost,
        salePrice: item.salePrice,
        active: item.active,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  }
}
