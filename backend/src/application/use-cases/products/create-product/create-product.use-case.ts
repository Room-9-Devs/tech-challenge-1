import { Injectable, Inject } from '@nestjs/common';
import { Item } from '@/domain/entities/item.entity';
import { ItemRepository } from '@/domain/repositories/item.repository';
import { ItemAlreadyExistsError } from '@/domain/errors/item-already-exists.error';
import { CreateItemInputDto } from './create-item-input.dto';
import { CreateItemOutputDto } from './create-item-output.dto';

export const ITEM_REPOSITORY = Symbol('ITEM_REPOSITORY');

@Injectable()
export class CreateItemUseCase {
  constructor(
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
  ) {}

  async execute(input: CreateItemInputDto): Promise<CreateItemOutputDto> {
    const existingItem = await this.itemRepository.findBySku(input.sku);

    if (existingItem) {
      throw new ItemAlreadyExistsError(input.sku);
    }

    const item = Item.create({
      sku: input.sku,
      name: input.name,
      description: input.description,
      itemType: input.itemType,
      unit: input.unit,
      cost: input.cost,
      salePrice: input.salePrice,
    });

    const savedItem = await this.itemRepository.save(item);

    return {
      id: savedItem.id,
      sku: savedItem.sku,
      name: savedItem.name,
      description: savedItem.description,
      itemType: savedItem.itemType,
      unit: savedItem.unit,
      cost: savedItem.cost,
      salePrice: savedItem.salePrice,
      active: savedItem.active,
      createdAt: savedItem.createdAt,
      updatedAt: savedItem.updatedAt,
    };
  }
}
