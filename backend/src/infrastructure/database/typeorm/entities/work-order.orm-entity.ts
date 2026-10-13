import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { UserOrmEntity } from './user.orm-entity';
import { VehicleOrmEntity } from './vehicle.orm-entity';
import { WorkOrderItemOrmEntity } from './work-order-item.orm-entity';

const decimalTransformer = {
  from: (value: string | number | null): number | null =>
    value === null || value === undefined
      ? null
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : value,
  to: (value: number | null): number | null => value,
};

@Entity('work_orders')
@Index(['status', 'createdAt'])
export class WorkOrderOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  number: string;

  @Column({ type: 'varchar', length: 32 })
  status: WorkOrderStatus;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @ManyToOne(() => VehicleOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleOrmEntity;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: UserOrmEntity;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: UserOrmEntity;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @Column('decimal', {
    name: 'total_price',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalPrice: number;

  @OneToMany(() => WorkOrderItemOrmEntity, (item) => item.workOrder, {
    cascade: ['insert', 'update'],
  })
  items: WorkOrderItemOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
