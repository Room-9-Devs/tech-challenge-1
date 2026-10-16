export const WORK_ORDER_APPROVAL_TOKEN_REPOSITORY = Symbol(
  'WORK_ORDER_APPROVAL_TOKEN_REPOSITORY',
);

export interface WorkOrderApprovalTokenRecord {
  id: string;
  workOrderId: string;
  clientId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
}

export type NewWorkOrderApprovalToken = Omit<
  WorkOrderApprovalTokenRecord,
  'id' | 'usedAt' | 'revokedAt'
>;

export interface WorkOrderApprovalTokenRepository {
  save(token: NewWorkOrderApprovalToken): Promise<WorkOrderApprovalTokenRecord>;
  // Válido = não expirado, não usado e não revogado.
  findValidByHash(
    tokenHash: string,
  ): Promise<WorkOrderApprovalTokenRecord | null>;
  // Retorna false se o token deixou de ser válido entre a leitura e o uso.
  markUsed(id: string): Promise<boolean>;
  revokeAllByWorkOrder(workOrderId: string): Promise<void>;
}
