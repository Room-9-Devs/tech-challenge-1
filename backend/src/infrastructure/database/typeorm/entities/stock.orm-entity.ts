import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ItemOrmEntity } from './item.orm-entity';

@Entity('stocks')
export class StockOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'item_id' })
  itemId: string;

  @OneToOne(() => ItemOrmEntity)
  @JoinColumn({ name: 'item_id' })
  item: ItemOrmEntity;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reserved: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
