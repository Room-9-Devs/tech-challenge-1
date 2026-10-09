import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockMovementType } from '../../../../domain/entities/stock-movement.entity';
import { ProductOrmEntity } from './product.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('stock_movements')
export class StockMovementOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'previous_quantity', type: 'int', nullable: true })
  previousQuantity: number | null;

  @Column({ name: 'movement_type', type: 'enum', enum: StockMovementType })
  movementType: StockMovementType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('uuid', { name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserOrmEntity;
}
