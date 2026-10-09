import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { EventEntityType } from '@/domain/types/entity-reference.type';

@Entity('event_types')
export class EventTypeOrmEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({
    name: 'allowed_entity_types',
    type: 'enum',
    enum: ['client', 'employee', 'user', 'vehicle', 'product', 'stock', 'repair'],
    array: true,
    default: '{}',
  })
  allowedEntityTypes: EventEntityType[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
