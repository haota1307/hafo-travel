import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditEventDestination } from '@common/schemas/audit-event.schema';

import { AuditController } from '@audit/controllers/audit.controller';
import { AuditRepository } from '@audit/repositories/audit.repository';
import { AuditService } from '@audit/services/audit.service';

@Module({
  imports: [MongooseModule.forFeature([AuditEventDestination])],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
