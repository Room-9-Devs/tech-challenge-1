import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EventEntityType } from '@/domain/types/entity-reference.type';
import { EventTypeOrmEntity } from './event-type.orm-entity';

@Entity('events')
@Index(['entityType', 'entityId'])
@Index(['eventTypeId'])
export class EventOrmEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'event_type_id', type: 'uuid' })
  eventTypeId: string;

  @ManyToOne(() => EventTypeOrmEntity)
  @JoinColumn({ name: 'event_type_id' })
  eventType: EventTypeOrmEntity;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: ['client', 'employee', 'user', 'vehicle', 'product', 'stock', 'repair'],
  })
  entityType: EventEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
