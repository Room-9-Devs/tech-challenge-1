import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clients')
export class ClientOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'document_type', type: 'enum', enum: ['CPF', 'CNPJ'] })
  documentType: 'CPF' | 'CNPJ';

  @Column({ type: 'varchar', length: 14, unique: true })
  document: string;

  @Column({ type: 'varchar', length: 11 })
  phone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}