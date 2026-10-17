import { Inject, Injectable } from '@nestjs/common';
import {
  PROFILE_REPOSITORY,
  ProfileRepository,
} from '@/application/ports/profile.repository';
import { PRODUCT_REPOSITORY } from '@/application/use-cases/products/create-product/create-product.use-case';
import { REPAIR_REPOSITORY } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { VEHICLE_REPOSITORY } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { UserRepository } from '@/domain/repositories/user.repository';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';

export interface WorkOrderRecipient {
  email: string;
  customerName: string;
  vehicle: string;
}

export interface WorkOrderQuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface WorkOrderQuote extends WorkOrderRecipient {
  orderNumber: string;
  items: WorkOrderQuoteItem[];
  total: number;
  generatedAt: Date;
}

const UNKNOWN_VEHICLE = 'cadastrado na OS';

// Monta o orçamento legível (cliente, veículo e itens descritos) usado no e-mail e na página de aprovação.
@Injectable()
export class WorkOrderQuoteService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(REPAIR_REPOSITORY) private readonly repairs: RepairRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async findRecipient(order: WorkOrder): Promise<WorkOrderRecipient | null> {
    const client = await this.users.findById(order.clientId);
    if (!client) return null;

    const [profile, vehicle] = await Promise.all([
      this.profiles.findById('client', client.entityId),
      this.vehicles.findById(order.vehicleId),
    ]);

    return {
      email: client.email,
      customerName: profile?.name ?? client.username,
      vehicle: vehicle
        ? `${vehicle.brand} ${vehicle.model} - ${vehicle.license_plate}`
        : UNKNOWN_VEHICLE,
    };
  }

  async buildQuote(order: WorkOrder): Promise<WorkOrderQuote | null> {
    const recipient = await this.findRecipient(order);
    if (!recipient) return null;

    return {
      ...recipient,
      orderNumber: order.number,
      items: await this.describeItems(order),
      total: order.totalPrice,
      generatedAt: order.updatedAt,
    };
  }

  private describeItems(order: WorkOrder): Promise<WorkOrderQuoteItem[]> {
    return Promise.all(
      order.items.map(async (item) => ({
        description: await this.describeItem(item),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    );
  }

  private async describeItem(item: WorkOrderItem): Promise<string> {
    if (item.serviceId) {
      const repair = await this.repairs.findById(item.serviceId);
      return repair?.description ?? 'Serviço';
    }

    // Produto pode ter sido inativado depois de entrar na OS
    const product = await this.products.findByIdIncludingInactive(
      item.productId,
    );
    return product?.name ?? 'Peça';
  }
}
