import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderConflictError } from '@/domain/errors/work-order-conflict.error';
import { InvalidWorkOrderError } from '@/domain/errors/invalid-work-order.error';
import { InsufficientStockError } from '@/domain/errors/insufficient-stock.error';
import { WorkOrderAccessDeniedError } from '@/domain/errors/work-order-access-denied.error';
import {
  IntegrationDatabase,
  openIntegrationDatabase,
  resetWorkshopData,
} from './support/integration-database';
import { Workshop, buildWorkshop } from './support/workshop-scenario';

const databaseTests =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

databaseTests('PostgreSQL work order integration flows', () => {
  let harness: IntegrationDatabase;
  let database: DataSource;
  let workshop: Workshop;

  beforeAll(async () => {
    harness = await openIntegrationDatabase();
    database = harness.database;
  }, 30000);

  beforeEach(async () => {
    await resetWorkshopData(database);
    workshop = await buildWorkshop(database);
  }, 30000);

  afterAll(async () => {
    await harness.close();
  }, 30000);

  async function readOrder(id: string) {
    const [row] = await database.query(
      `SELECT status, client_id, created_by, number, total_price
       FROM work_orders WHERE id = $1`,
      [id],
    );
    return row as {
      status: string;
      client_id: string;
      created_by: string;
      number: string;
      total_price: string;
    };
  }

  async function readStock(productId: string) {
    const [row] = await database.query(
      `SELECT quantity, reserved FROM stocks WHERE product_id = $1`,
      [productId],
    );
    return { quantity: Number(row.quantity), reserved: Number(row.reserved) };
  }

  async function countStockEvents(code: string, stockId: string) {
    const rows = await database.query(
      `SELECT 1
       FROM events e
       JOIN event_types t ON t.id = e.event_type_id
       WHERE t.code = $1
         AND e.entity_type = 'stock'
         AND e.entity_id = $2`,
      [code, stockId],
    );
    return rows.length;
  }

  async function readMovements(workOrderId: string) {
    return database.query(
      `SELECT movement_type, quantity, previous_quantity, reference_type, reference_id
       FROM stock_movements
       WHERE reference_type = 'work_order' AND reference_id = $1`,
      [workOrderId],
    );
  }

  async function readItems(workOrderId: string) {
    return database.query(
      `SELECT service_id, product_id, quantity, unit_price
       FROM work_order_items
       WHERE work_order_id = $1
       ORDER BY created_at`,
      [workOrderId],
    );
  }

  async function createOrder(): Promise<string> {
    const order = await workshop.createWorkOrder.execute({
      vehicleId: workshop.vehicleId,
      observations: null,
      actor: workshop.staff,
    });
    return order.id;
  }

  it('percorre a OS de received até delivered e baixa o estoque na aprovação', async () => {
    const workOrderId = await createOrder();
    const currentYear = new Date().getFullYear();

    let order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.RECEIVED);
    expect(order.client_id).toBe(workshop.clientUserId);
    expect(order.created_by).toBe(workshop.staffUserId);
    expect(order.number).toBe(`OS-0001/${currentYear}`);
    expect(Number(order.total_price)).toBe(0);

    // Passo 2
    await workshop.addItem.execute({
      id: workOrderId,
      serviceId: workshop.repairId,
      quantity: 1,
      actor: workshop.staff,
    });
    const itemsAfterService = await readItems(workOrderId);
    expect(itemsAfterService).toHaveLength(1);
    expect(itemsAfterService[0].service_id).toBe(workshop.repairId);
    expect(itemsAfterService[0].product_id).toBeNull();
    expect(Number(itemsAfterService[0].unit_price)).toBe(150);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 0,
    });
    order = await readOrder(workOrderId);
    expect(Number(order.total_price)).toBe(150);

    // Passo 3
    await workshop.addItem.execute({
      id: workOrderId,
      productId: workshop.productId,
      quantity: 2,
      actor: workshop.staff,
    });
    const itemsAfterProduct = await readItems(workOrderId);
    expect(itemsAfterProduct).toHaveLength(2);
    const productItem = itemsAfterProduct.find(
      (item) => item.product_id === workshop.productId,
    );
    expect(productItem).toBeDefined();
    expect(productItem.service_id).toBeNull();
    expect(Number(productItem.quantity)).toBe(2);
    expect(Number(productItem.unit_price)).toBe(40);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 0,
    });
    order = await readOrder(workOrderId);
    expect(Number(order.total_price)).toBe(230);

    // Passo 4
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'teste',
      actor: workshop.staff,
    });
    order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.UNDER_DIAGNOSIS);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 0,
    });

    // Passo 5
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'teste',
      actor: workshop.staff,
    });
    order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.AWAITING_APPROVAL);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 2,
    });
    expect(await countStockEvents('stock.reserved', workshop.stockId)).toBe(1);
    expect(await readMovements(workOrderId)).toHaveLength(0);

    // Passo 6
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.APPROVED,
      note: 'teste',
      actor: workshop.client,
    });
    order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.APPROVED);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 3,
      reserved: 0,
    });
    const movements = await readMovements(workOrderId);
    expect(movements).toHaveLength(1);
    expect(movements[0].movement_type).toBe('OUT');
    expect(Number(movements[0].quantity)).toBe(2);
    expect(Number(movements[0].previous_quantity)).toBe(5);
    expect(movements[0].reference_type).toBe('work_order');
    expect(movements[0].reference_id).toBe(workOrderId);
    expect(await countStockEvents('stock.consumed', workshop.stockId)).toBe(1);
    expect(await countStockEvents('stock.released', workshop.stockId)).toBe(0);

    // Passo 7
    const call = workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.IN_PROGRESS,
      note: 'teste',
      actor: workshop.staff,
    });
    await expect(call).rejects.toBeInstanceOf(WorkOrderConflictError);
    await expect(call).rejects.toThrow(
      'Confirme o pagamento antes de iniciar o serviço',
    );
    order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.APPROVED);

    // Passo 8
    await workshop.confirmPayment.execute({
      id: workOrderId,
      note: 'pago',
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.IN_PROGRESS,
      note: 'teste',
      actor: workshop.staff,
    });
    order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.IN_PROGRESS);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 3,
      reserved: 0,
    });

    // Passo 9
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.COMPLETED,
      note: 'teste',
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.DELIVERED,
      note: 'teste',
      actor: workshop.staff,
    });
    order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.DELIVERED);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 3,
      reserved: 0,
    });
  }, 30000);

  it('recusa do client libera a reserva e não baixa o estoque', async () => {
    const workOrderId = await createOrder();
    await workshop.addItem.execute({
      id: workOrderId,
      serviceId: workshop.repairId,
      quantity: 1,
      actor: workshop.staff,
    });
    await workshop.addItem.execute({
      id: workOrderId,
      productId: workshop.productId,
      quantity: 2,
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'teste',
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'teste',
      actor: workshop.staff,
    });

    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.CANCELLED,
      note: 'teste',
      actor: workshop.client,
    });

    const order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.CANCELLED);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 0,
    });
    expect(await readMovements(workOrderId)).toHaveLength(0);
    expect(await countStockEvents('stock.released', workshop.stockId)).toBe(1);
    expect(await countStockEvents('stock.consumed', workshop.stockId)).toBe(0);
  }, 30000);

  it('não grava item quando a quantidade passa do disponível', async () => {
    const workOrderId = await createOrder();

    await expect(
      workshop.addItem.execute({
        id: workOrderId,
        productId: workshop.productId,
        quantity: 6,
        actor: workshop.staff,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    expect(await readItems(workOrderId)).toHaveLength(0);
    const order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.RECEIVED);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 0,
    });
  }, 30000);

  it('a segunda reserva falha e não grava awaiting_approval', async () => {
    const orderAId = await createOrder();
    await workshop.addItem.execute({
      id: orderAId,
      productId: workshop.productId,
      quantity: 3,
      actor: workshop.staff,
    });
    const orderBId = await createOrder();
    await workshop.addItem.execute({
      id: orderBId,
      productId: workshop.productId,
      quantity: 3,
      actor: workshop.staff,
    });

    await workshop.changeStatus.execute({
      id: orderAId,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'teste',
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: orderAId,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'teste',
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: orderBId,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'teste',
      actor: workshop.staff,
    });

    await expect(
      workshop.changeStatus.execute({
        id: orderBId,
        status: WorkOrderStatus.AWAITING_APPROVAL,
        note: 'teste',
        actor: workshop.staff,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    expect((await readOrder(orderAId)).status).toBe(
      WorkOrderStatus.AWAITING_APPROVAL,
    );
    expect((await readOrder(orderBId)).status).toBe(
      WorkOrderStatus.UNDER_DIAGNOSIS,
    );
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 3,
    });
    expect(await readMovements(orderBId)).toHaveLength(0);
    expect(await countStockEvents('stock.reserved', workshop.stockId)).toBe(1);
  }, 30000);

  it('trava os itens depois do envio do orçamento', async () => {
    const workOrderId = await createOrder();
    await workshop.addItem.execute({
      id: workOrderId,
      serviceId: workshop.repairId,
      quantity: 1,
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'teste',
      actor: workshop.staff,
    });
    await workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'teste',
      actor: workshop.staff,
    });

    const call = workshop.addItem.execute({
      id: workOrderId,
      serviceId: workshop.repairId,
      quantity: 1,
      actor: workshop.staff,
    });
    await expect(call).rejects.toBeInstanceOf(InvalidWorkOrderError);
    await expect(call).rejects.toThrow(
      'Os itens só podem ser alterados antes do envio do orçamento',
    );

    const [count] = await database.query(
      `SELECT COUNT(*)::int AS total FROM work_order_items WHERE work_order_id = $1`,
      [workOrderId],
    );
    expect(count.total).toBe(1);
    expect(await readStock(workshop.productId)).toEqual({
      quantity: 5,
      reserved: 0,
    });
  }, 30000);

  it('recusa a transição ilegal de received para completed', async () => {
    const workOrderId = await createOrder();

    const call = workshop.changeStatus.execute({
      id: workOrderId,
      status: WorkOrderStatus.COMPLETED,
      note: 'teste',
      actor: workshop.staff,
    });
    await expect(call).rejects.toBeInstanceOf(InvalidWorkOrderError);
    await expect(call).rejects.toThrow(
      'Não é permitido alterar a OS de received para completed',
    );

    const order = await readOrder(workOrderId);
    expect(order.status).toBe(WorkOrderStatus.RECEIVED);
  }, 30000);

  it('cliente não vê OS de outro cliente', async () => {
    const ownOrderId = await createOrder();

    const otherClientId = randomUUID();
    const otherUserId = randomUUID();
    const otherVehicleId = randomUUID();
    await database.query(
      `INSERT INTO clients (id, name, document_type, document, phone)
      VALUES ($1, 'Outro', 'CPF', '15350946056', '11987654323')`,
      [otherClientId],
    );
    await database.query(
      `INSERT INTO users (id, username, email, password, entity_type, entity_id, role_id)
      VALUES ($1, 'outro', 'outro@example.com', 'test-hash', 'client', $2, $3)`,
      [otherUserId, otherClientId, workshop.clientRoleId],
    );
    await database.query(
      `INSERT INTO vehicles (id, license_plate, brand, model, year, color, user_id)
      VALUES ($1, 'XYZ9Z99', 'Fiat', 'Uno', 2018, 'Branco', $2)`,
      [otherVehicleId, otherUserId],
    );
    const otherOrder = await workshop.createWorkOrder.execute({
      vehicleId: otherVehicleId,
      observations: null,
      actor: workshop.staff,
    });

    const result = await workshop.listWorkOrders.execute({
      query: { page: 1, limit: 10 },
      actor: workshop.client,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].clientId).toBe(workshop.clientUserId);

    await expect(
      workshop.findWorkOrder.execute({
        id: otherOrder.id,
        actor: workshop.client,
      }),
    ).rejects.toBeInstanceOf(WorkOrderAccessDeniedError);

    const own = await workshop.findWorkOrder.execute({
      id: ownOrderId,
      actor: workshop.client,
    });
    expect(own.order.clientId).toBe(workshop.clientUserId);
  }, 30000);
});
