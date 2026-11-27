import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { QueryFilter } from 'mongoose';

import {
  type AuditEvent,
  type AuditEventData,
  type AuditEventModel,
  AuditEventModelName,
} from '@common/schemas/audit-event.schema';

import type { AuditQuery } from '@audit/audit-query';

@Injectable()
export class AuditRepository implements OnModuleInit {
  constructor(
    @InjectModel(AuditEventModelName)
    private readonly auditEventModel: AuditEventModel,
  ) {}

  async onModuleInit() {
    await this.auditEventModel.init();
  }

  create(event: AuditEventData) {
    return this.auditEventModel.create(event);
  }

  getByEventId(eventId: string) {
    return this.auditEventModel
      .findOne({ eventId })
      .select('-_id -createdAt -updatedAt')
      .lean()
      .exec();
  }

  list({ from, to, action, actorUserId, target, limit, cursor }: AuditQuery) {
    const filter: QueryFilter<AuditEvent> = {};

    if (from || to) {
      filter.occurredAt = {
        ...(from && { $gte: from }),
        ...(to && { $lt: to }),
      };
    }
    if (action) {
      filter.action = action;
    }
    if (actorUserId) {
      filter['actor.userId'] = actorUserId;
    }
    if (target) {
      filter['target.type'] = target.type;
      filter['target.id'] = target.id;
    }
    if (cursor) {
      filter.$or = [
        { occurredAt: { $lt: cursor.occurredAt } },
        { occurredAt: cursor.occurredAt, eventId: { $lt: cursor.eventId } },
      ];
    }

    return this.auditEventModel
      .find(filter)
      .sort({ occurredAt: -1, eventId: -1 })
      .limit(limit + 1)
      .lean()
      .exec();
  }
}
