import {
  Inject,
  Injectable,
  type OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';

import { AuthorizationCache } from '@common/configuration/authorization-cache.config';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import {
  IDENTITY_SERVICE_NAME,
  type IdentityServiceClient,
} from '@common/interfaces/grpc/identity/v1/identity';
import { requestGrpcData } from '@common/utils/rpc.util';

@Injectable()
export class AuthorizationService implements OnModuleInit {
  private identity: IdentityServiceClient;

  constructor(
    private readonly cache: AuthorizationCache,
    @Inject(GRPC_SERVICES.IDENTITY_SERVICE) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.identity = this.client.getService<IdentityServiceClient>(
      IDENTITY_SERVICE_NAME,
    );
  }

  async permissions(
    userId: string,
    profileId: string,
    processId?: string,
    accessVersion?: string,
  ) {
    const assignment = await this.cache.read(
      this.cache.userKey(userId),
      async () => {
        const response = await requestGrpcData(
          this.identity.getUserById,
          { userId },
          { processId },
        );

        const { user, locked } = response;

        if (
          !user ||
          locked ||
          user.userId !== userId ||
          user.roles.length !== 1 ||
          !user.roles[0]?.id
        ) {
          throw new UnauthorizedException('Authentication is required');
        }

        return {
          profileId: user.id,
          roleId: user.roles[0].id,
          accessVersion: response.accessVersion,
        };
      },
    );

    if (
      assignment.profileId !== profileId ||
      assignment.accessVersion !== accessVersion ||
      typeof assignment.roleId !== 'string'
    ) {
      throw new UnauthorizedException('Authentication is required');
    }

    const id = assignment.roleId;
    const permissions = await this.cache.read(
      this.cache.roleKey(id),
      async () => {
        const { role } = await requestGrpcData(
          this.identity.getRole,
          { id },
          { processId },
        );

        if (role?.id !== id) {
          throw new UnauthorizedException('Authentication is required');
        }

        return role.permissions;
      },
    );

    if (
      !Array.isArray(permissions) ||
      !permissions.every((permission) => typeof permission === 'string')
    ) {
      throw new UnauthorizedException('Authentication is required');
    }

    return permissions;
  }
}
