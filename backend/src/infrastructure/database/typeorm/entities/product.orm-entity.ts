import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ProductType,
  ProductUnit,
} from '../../../../domain/entities/product.entity';

const decimalTransformer = {
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return typeof value === 'string' ? parseFloat(value) : value;
  },
  to: (value: number | null): number | null => value,
};

@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'product_type', type: 'enum', enum: ProductType })
  productType: ProductType;

  @Column({ type: 'enum', enum: ProductUnit })
  unit: ProductUnit;

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
