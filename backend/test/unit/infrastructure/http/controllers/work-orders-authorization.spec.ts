import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { ROLES_KEY } from '@/infrastructure/http/auth/roles.decorator';
import { WorkOrdersController } from '@/infrastructure/http/controllers/work-orders.controller';

describe('WorkOrdersController authorization', () => {
  const guard = new RolesGuard(new Reflector());

  function contextFor(handlerName: keyof WorkOrdersController, role: string) {
    const handler = WorkOrdersController.prototype[handlerName];
    return {
      getHandler: () => handler,
      getClass: () => WorkOrdersController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'account-id', role, entityType: 'employee' },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it.each([
    'create',
    'addItem',
    'changeItem',
    'removeItem',
    'confirmPayment',
  ] as const)(
    '%s requires admin or staff and rejects clients',
    (handlerName) => {
      const handler = WorkOrdersController.prototype[handlerName];
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        'admin',
        'staff',
      ]);
      expect(guard.canActivate(contextFor(handlerName, 'staff'))).toBe(true);
      expect(guard.canActivate(contextFor(handlerName, 'admin'))).toBe(true);
      expect(() =>
        guard.canActivate(contextFor(handlerName, 'client')),
      ).toThrow(ForbiddenException);
    },
  );

  it('allows clients through the role guard only on consultation and status routes', () => {
    expect(guard.canActivate(contextFor('list', 'client'))).toBe(true);
    expect(guard.canActivate(contextFor('find', 'client'))).toBe(true);
    expect(guard.canActivate(contextFor('changeStatus', 'client'))).toBe(true);
  });

  it('uses JWT and role guards at controller level', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, WorkOrdersController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });
});
