import { Injectable, Inject } from '@nestjs/common';
import { ItemRepository } from '@/domain/repositories/item.repository';
import { ItemNotFoundError } from '@/domain/errors/item-not-found.error';
import { ItemAlreadyExistsError } from '@/domain/errors/item-already-exists.error';
import { ITEM_REPOSITORY } from '../create-item/create-item.use-case';
import { UpdateItemInputDto } from './update-item-input.dto';
import { UpdateItemOutputDto } from './update-item-output.dto';

@Injectable()
export class UpdateItemUseCase {
  constructor(
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
  ) {}

  async execute(input: UpdateItemInputDto): Promise<UpdateItemOutputDto> {
    const item = await this.itemRepository.findById(input.id);

    if (!item) {
      throw new ItemNotFoundError(input.id);
    }

    if (item.sku !== input.sku) {
      const existingItem = await this.itemRepository.findBySku(input.sku);

      if (existingItem) {
        throw new ItemAlreadyExistsError(input.sku);
      }
    }

    item.changeSku(input.sku);
    item.changeName(input.name);
    item.changeDescription(input.description);
    item.changeItemType(input.itemType);
    item.changeUnit(input.unit);
    item.changeCost(input.cost);
    item.changeSalePrice(input.salePrice);

    const updatedItem = await this.itemRepository.save(item);

    return {
      id: updatedItem.id,
      sku: updatedItem.sku,
      name: updatedItem.name,
      description: updatedItem.description,
      itemType: updatedItem.itemType,
      unit: updatedItem.unit,
      cost: updatedItem.cost,
      salePrice: updatedItem.salePrice,
      active: updatedItem.active,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    };
  }
}
