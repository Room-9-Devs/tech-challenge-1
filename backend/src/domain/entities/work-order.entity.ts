import { randomUUID } from 'crypto';
import { InvalidWorkOrderError } from '../errors/invalid-work-order.error';
import { WorkOrderItem } from './work-order-item.entity';
import { WorkOrderStatus } from './work-order-status.enum';

export interface WorkOrderProps {
  id?: string;
  number: string;
  status?: WorkOrderStatus;
  vehicleId: string;
  clientId: string;
  createdBy: string;
  observations?: string | null;
  items?: WorkOrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrder {
  private readonly _id: string;
  private readonly _number: string;
  private _status: WorkOrderStatus;
  private readonly _vehicleId: string;
  private readonly _clientId: string;
  private readonly _createdBy: string;
  private _observations: string | null;
  private readonly _items: WorkOrderItem[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WorkOrderProps) {
    this._id = props.id ?? randomUUID();
    this._number = props.number;
    this._status = props.status ?? WorkOrderStatus.RECEIVED;
    this._vehicleId = props.vehicleId;
    this._clientId = props.clientId;
    this._createdBy = props.createdBy;
    this._observations = props.observations?.trim() || null;
    this._items = [...(props.items ?? [])];
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: WorkOrderProps): WorkOrder {
    WorkOrder.validate(props);
    return new WorkOrder(props);
  }

  public static reconstitute(props: WorkOrderProps): WorkOrder {
    WorkOrder.validate(props);
    return new WorkOrder(props);
  }

  get id(): string {
    return this._id;
  }

  get number(): string {
    return this._number;
  }

  get status(): WorkOrderStatus {
    return this._status;
  }

  get vehicleId(): string {
    return this._vehicleId;
  }

  get clientId(): string {
    return this._clientId;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get observations(): string | null {
    return this._observations;
  }

  get items(): WorkOrderItem[] {
    return [...this._items];
  }

  get totalPrice(): number {
    return this._items.reduce((total, item) => total + item.subtotal, 0);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeStatus(status: WorkOrderStatus): void {
    WorkOrder.validateStatus(status);
    const allowedNextStatuses: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      [WorkOrderStatus.RECEIVED]: [WorkOrderStatus.UNDER_DIAGNOSIS],
      [WorkOrderStatus.UNDER_DIAGNOSIS]: [WorkOrderStatus.AWAITING_APPROVAL],
      [WorkOrderStatus.AWAITING_APPROVAL]: [
        WorkOrderStatus.APPROVED,
        WorkOrderStatus.CANCELLED,
      ],
      [WorkOrderStatus.APPROVED]: [WorkOrderStatus.IN_PROGRESS],
      [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED],
      [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.DELIVERED],
      [WorkOrderStatus.DELIVERED]: [],
      [WorkOrderStatus.CANCELLED]: [],
    };
    if (!allowedNextStatuses[this._status].includes(status)) {
      throw new InvalidWorkOrderError(
        `Não é permitido alterar a OS de ${this._status} para ${status}`,
      );
    }
    if (status === WorkOrderStatus.AWAITING_APPROVAL && this._items.length === 0) {
      throw new InvalidWorkOrderError(
        'A OS precisa ter pelo menos um item para aguardar aprovação',
      );
    }
    this._status = status;
    this._updatedAt = new Date();
  }

  public changeObservations(observations: string | null): void {
    this._observations = observations?.trim() || null;
    this._updatedAt = new Date();
  }

  public addItem(item: WorkOrderItem): void {
    this.ensureItemsCanChange();
    if (!(item instanceof WorkOrderItem)) {
      throw new InvalidWorkOrderError('O item da OS é inválido');
    }
    if (this._items.some((existing) => existing.id === item.id)) {
      throw new InvalidWorkOrderError('O item já pertence à ordem de serviço');
    }
    this._items.push(item);
    this._updatedAt = new Date();
  }

  public removeItem(itemId: string): boolean {
    this.ensureItemsCanChange();
    const index = this._items.findIndex((item) => item.id === itemId);
    if (index === -1) return false;

    this._items.splice(index, 1);
    this._updatedAt = new Date();
    return true;
  }

  public changeItemQuantity(itemId: string, quantity: number): void {
    this.ensureItemsCanChange();
    const item = this._items.find((existing) => existing.id === itemId);
    if (!item) {
      throw new InvalidWorkOrderError('Item não encontrado na ordem de serviço');
    }
    item.changeQuantity(quantity);
    this._updatedAt = new Date();
  }

  private ensureItemsCanChange(): void {
    if (
      this._status !== WorkOrderStatus.RECEIVED &&
      this._status !== WorkOrderStatus.UNDER_DIAGNOSIS
    ) {
      throw new InvalidWorkOrderError(
        'Os itens só podem ser alterados antes do envio do orçamento',
      );
    }
  }

  private static validate(props: WorkOrderProps): void {
    if (!/^OS-\d{4,}\/\d{4}$/.test(props.number ?? '')) {
      throw new InvalidWorkOrderError(
        'O número deve seguir o formato OS-0001/2026',
      );
    }
    WorkOrder.validateStatus(props.status ?? WorkOrderStatus.RECEIVED);
    WorkOrder.validateReference(props.vehicleId, 'Veículo');
    WorkOrder.validateReference(props.clientId, 'Cliente');
    WorkOrder.validateReference(props.createdBy, 'Funcionário responsável');
    if (props.items?.some((item) => !(item instanceof WorkOrderItem))) {
      throw new InvalidWorkOrderError('A lista de itens da OS é inválida');
    }
  }

  private static validateReference(value: string, label: string): void {
    if (!value || !value.trim()) {
      throw new InvalidWorkOrderError(`${label} é obrigatório`);
    }
  }

  private static validateStatus(status: WorkOrderStatus): void {
    if (!Object.values(WorkOrderStatus).includes(status)) {
      throw new InvalidWorkOrderError('O status da OS é inválido');
    }
  }
}
