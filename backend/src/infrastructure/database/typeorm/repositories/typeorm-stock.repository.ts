import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '@/domain/entities/stock.entity';
import { StockRepository } from '@/domain/repositories/stock.repository';
import { StockOrmEntity } from '../entities/stock.orm-entity';
import { StockMapper } from '../mappers/stock.mapper';

@Injectable()
export class TypeOrmStockRepository implements StockRepository {
  constructor(
    @InjectRepository(StockOrmEntity)
    private readonly repository: Repository<StockOrmEntity>,
  ) {}

  async findByItemId(itemId: string): Promise<Stock | null> {
    const ormEntity = await this.repository.findOne({ where: { itemId } });
    return ormEntity ? StockMapper.toDomain(ormEntity) : null;
  }
}
