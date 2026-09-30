import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemType, ItemUnit } from '../../../../domain/entities/item.entity';

const decimalTransformer = {
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return typeof value === 'string' ? parseFloat(value) : value;
  },
  to: (value: number | null): number | null => value,
};

@Entity('items')
export class ItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'item_type', type: 'enum', enum: ItemType })
  itemType: ItemType;

  @Column({ type: 'enum', enum: ItemUnit })
  unit: ItemUnit;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  cost: number;

  @Column('decimal', {
    name: 'sale_price',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  salePrice: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
