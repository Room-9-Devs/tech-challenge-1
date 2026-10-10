import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkOrderNumberGenerator } from '@/application/ports/work-order-number-generator.port';

@Injectable()
export class TypeOrmWorkOrderNumberGenerator implements WorkOrderNumberGenerator {
  constructor(private readonly dataSource: DataSource) {}

  async next(): Promise<string> {
    const year = new Date().getFullYear();
    const [row] = await this.dataSource.query(
      `INSERT INTO "work_order_number_sequences" ("year", "last_number")
       VALUES ($1, 1)
       ON CONFLICT ("year") DO UPDATE
       SET "last_number" = "work_order_number_sequences"."last_number" + 1
       RETURNING "last_number"`,
      [year],
    );
    return `OS-${String(row.last_number).padStart(4, '0')}/${year}`;
  }
}
