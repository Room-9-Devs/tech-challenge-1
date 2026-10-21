import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity';
import { VehicleOrmEntity } from './vehicle.orm-entity';

@Entity('users')
@Index(['entityType', 'entityId'])
export class UserOrmEntity {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 20 })
  entityType: 'client' | 'employee';

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleOrmEntity, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: RoleOrmEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => VehicleOrmEntity, (vehicle) => vehicle.user)
  vehicles: VehicleOrmEntity[];
}
