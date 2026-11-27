import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { type AuditEventInput, normalizeAuditEvent } from '@audit/audit-event';
import { AuditRepository } from '@audit/repositories/audit.repository';
import { AuditService } from '@audit/services/audit.service';

const roleEvent: AuditEventInput = {
  eventId: 'd2d51882-1ff6-4388-a6af-86e171000001',
  schemaVersion: 1,
  source: 'identity',
  occurredAt: '2026-11-27T03:15:00Z',
  actor: { userId: 'admin-1' },
  action: 'role.update',
  target: { type: 'role', id: '000000000000000000000001' },
  changes: {
    roleUpdated: {
      description: { before: '', after: 'Quản lý tour' },
      permissions: { added: ['role.update', 'role.create'], removed: [] },
    },
  },
  processId: 'process-1',
};

describe('AuditService', () => {
  const duplicateEventId = { code: 11000, keyPattern: { eventId: 1 } };
  const repository = {
    create: jest.fn(),
    getByEventId: jest.fn(),
    list: jest.fn(),
  };
  let module: TestingModule;
  let service: AuditService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: repository },
      ],
    }).compile();
    service = module.get(AuditService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  it('stores a role change and recognizes the same event with reordered permissions', async () => {
    await expect(service.appendAuditEvent(roleEvent)).resolves.toEqual({
      eventId: roleEvent.eventId,
      duplicate: false,
    });
    const storedEvent = repository.create.mock.calls[0][0];
    expect(storedEvent.changes.roleUpdated).toEqual({
      description: { before: '', after: 'Quản lý tour' },
      permissions: { added: ['role.create', 'role.update'], removed: [] },
    });

    repository.create.mockRejectedValue(duplicateEventId);
    repository.getByEventId.mockResolvedValue(storedEvent);

    await expect(
      service.appendAuditEvent({
        ...roleEvent,
        occurredAt: '2026-11-27T03:15:00.000+00:00',
        changes: {
          roleUpdated: {
            description: { before: '', after: 'Quản lý tour' },
            permissions: { added: ['role.create', 'role.update'], removed: [] },
          },
        },
      }),
    ).resolves.toEqual({ eventId: roleEvent.eventId, duplicate: true });
  });

  it('rejects reuse of an existing event ID with changed details', async () => {
    repository.create.mockRejectedValue(duplicateEventId);
    repository.getByEventId.mockResolvedValue(normalizeAuditEvent(roleEvent));

    await expect(
      service.appendAuditEvent({
        ...roleEvent,
        processId: 'different-process',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates other storage failures', async () => {
    const storageFailure = new Error('MongoDB unavailable');
    repository.create.mockRejectedValue(storageFailure);

    await expect(service.appendAuditEvent(roleEvent)).rejects.toBe(
      storageFailure,
    );
    expect(repository.getByEventId).not.toHaveBeenCalled();
  });

  it.each([
    { schemaVersion: 2 },
    { occurredAt: '2026-02-30T00:00:00Z' },
    { target: { type: 'user', id: 'user-1' } },
    { changes: { roleUpdated: { description: { before: '', after: '' } } } },
  ])('rejects invalid event fields %o before writing', async (changes) => {
    await expect(
      service.appendAuditEvent({ ...roleEvent, ...changes }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('uses the last returned event as the cursor when the repository has more rows', async () => {
    const first = normalizeAuditEvent(roleEvent);
    const second = {
      ...first,
      eventId: 'd2d51882-1ff6-4388-a6af-86e171000000',
    };
    repository.list
      .mockResolvedValueOnce([first, second])
      .mockResolvedValueOnce([second]);

    const page = await service.listAuditEvents({ limit: 1 });
    expect(page.events).toEqual([first]);
    expect(page.nextCursor).toBeDefined();

    await expect(
      service.listAuditEvents({ limit: 1, cursor: page.nextCursor }),
    ).resolves.toEqual({ events: [second] });
    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        limit: 1,
        cursor: { occurredAt: first.occurredAt, eventId: first.eventId },
      }),
    );
  });

  it('rejects a malformed cursor before querying', async () => {
    await expect(
      service.listAuditEvents({ cursor: 'invalid-cursor' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.list).not.toHaveBeenCalled();
  });
});
