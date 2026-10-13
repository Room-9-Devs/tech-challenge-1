import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RepairOrmEntity } from './repair.orm-entity';
import { ProductOrmEntity } from './product.orm-entity';
import { WorkOrderOrmEntity } from './work-order.orm-entity';

const decimalTransformer = {
  from: (value: string | number | null): number | null =>
    value === null || value === undefined
      ? null
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : value,
  to: (value: number | null): number | null => value,
};

@Entity('work_order_items')
export class WorkOrderItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrderOrmEntity, (workOrder) => workOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrderOrmEntity;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column('decimal', {
    name: 'unit_price',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @ManyToOne(() => RepairOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service: RepairOrmEntity | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => ProductOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductOrmEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
