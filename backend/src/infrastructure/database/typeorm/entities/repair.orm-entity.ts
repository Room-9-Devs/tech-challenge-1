import {
  Entity,
  Index,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('repairs')
@Index('UQ_repairs_description_active', ['description'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
export class RepairOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column('decimal', {
    name: 'unit_value',
    precision: 10,
    scale: 2,
    transformer: {
      from: (value: string | number | null): number | null => {
        if (value === null || value === undefined) {
          return null;
        }
        return typeof value === 'string' ? parseFloat(value) : value;
      },
      to: (value: number | null): number | null => value,
    },
  })
  unitValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
