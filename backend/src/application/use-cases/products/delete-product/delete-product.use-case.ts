import { Injectable, Inject } from '@nestjs/common';
import { ItemRepository } from '@/domain/repositories/item.repository';
import { StockRepository } from '@/domain/repositories/stock.repository';
import { ItemNotFoundError } from '@/domain/errors/item-not-found.error';
import { ItemHasStockError } from '@/domain/errors/item-has-stock.error';
import { ITEM_REPOSITORY } from '../create-item/create-item.use-case';
import { DeleteItemInputDto } from './delete-item-input.dto';

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');

@Injectable()
export class DeleteItemUseCase {
  constructor(
    @Inject(ITEM_REPOSITORY)
    private readonly itemRepository: ItemRepository,
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(input: DeleteItemInputDto): Promise<void> {
    const item = await this.itemRepository.findById(input.id);

    if (!item) {
      throw new ItemNotFoundError(input.id);
    }

    const stock = await this.stockRepository.findByItemId(item.id);

    if (stock && stock.hasBalance()) {
      throw new ItemHasStockError(item.id);
    }

    item.deactivate();

    await this.itemRepository.save(item);
  }
}
