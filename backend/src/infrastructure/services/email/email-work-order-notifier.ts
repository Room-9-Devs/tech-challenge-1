import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EMAIL_SENDER,
  EmailSender,
} from '@/application/ports/email-sender.port';
import {
  PROFILE_REPOSITORY,
  ProfileRepository,
} from '@/application/ports/profile.repository';
import { WorkOrderNotifier } from '@/application/ports/work-order-notifier.port';
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
import { RenderedEmail } from './templates/email-layout';
import {
  WorkOrderEmailItem,
  renderWorkOrderAwaitingApprovalEmail,
} from './templates/work-order-awaiting-approval.template';
import { renderWorkOrderCompletedEmail } from './templates/work-order-completed.template';

interface WorkOrderRecipient {
  email: string;
  customerName: string;
  vehicle: string;
}

const UNKNOWN_VEHICLE = 'cadastrado na OS';

@Injectable()
export class EmailWorkOrderNotifier implements WorkOrderNotifier {
  private readonly logger = new Logger(EmailWorkOrderNotifier.name);

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(REPAIR_REPOSITORY) private readonly repairs: RepairRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
  ) {}

  async notifyAwaitingApproval(order: WorkOrder): Promise<void> {
    await this.notify(order, async (recipient) =>
      renderWorkOrderAwaitingApprovalEmail({
        customerName: recipient.customerName,
        vehicle: recipient.vehicle,
        orderNumber: order.number,
        items: await this.describeItems(order),
        total: order.totalPrice,
        generatedAt: order.updatedAt,
      }),
    );
  }

  async notifyCompleted(order: WorkOrder): Promise<void> {
    await this.notify(order, async (recipient) =>
      renderWorkOrderCompletedEmail({
        customerName: recipient.customerName,
        vehicle: recipient.vehicle,
        orderNumber: order.number,
        completedAt: order.updatedAt,
      }),
    );
  }

  // O status já foi gravado quando a notificação roda: qualquer falha aqui só pode ser registrada.
  private async notify(
    order: WorkOrder,
    render: (recipient: WorkOrderRecipient) => Promise<RenderedEmail>,
  ): Promise<void> {
    try {
      const recipient = await this.findRecipient(order);
      if (!recipient) {
        this.logger.warn(
          `Cliente da ${order.number} não encontrado. E-mail não enviado.`,
        );
        return;
      }

      const content = await render(recipient);
      await this.emailSender.send({ to: recipient.email, ...content });
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Falha ao notificar o cliente da ${order.number}: ${failure.message}`,
        failure.stack,
      );
    }
  }

  private async findRecipient(
    order: WorkOrder,
  ): Promise<WorkOrderRecipient | null> {
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

  private describeItems(order: WorkOrder): Promise<WorkOrderEmailItem[]> {
    return Promise.all(
      order.items.map(async (item) => ({
        description: await this.describeItem(item),
        quantity: item.quantity,
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
