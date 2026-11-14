import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { KeycloakHttpService } from '../src/app/modules/keycloak/services/keycloak-http.service';

describe('Keycloak user creation response', () => {
  const post = jest.fn();
  let service: KeycloakHttpService;

  beforeEach(() => {
    post.mockReset();
    jest
      .spyOn(axios, 'create')
      .mockReturnValue({ post } as unknown as AxiosInstance);
    service = new KeycloakHttpService(
      new ConfigService({
        KEYCLOAK_CONFIG: {
          HOST: 'https://keycloak.test',
          REALM: 'test',
          CLIENT_ID: 'client',
          CLIENT_SECRET: 'secret',
        },
      }),
    );
    post.mockResolvedValueOnce({ data: { access_token: 'client-token' } });
  });

  afterEach(() => jest.restoreAllMocks());

  const input = {
    email: 'user@example.com',
    firstName: 'First',
    lastName: 'Last',
    password: 'password',
  };

  it('reads the created user ID from Location', async () => {
    post.mockResolvedValueOnce({
      headers: {
        location: 'https://keycloak.test/admin/realms/test/users/user-1',
      },
    });

    await expect(service.createUser(input)).resolves.toBe('user-1');
  });

  it.each([undefined, null, 42, [], ''])(
    'rejects a missing or invalid Location header: %p',
    async (location) => {
      post.mockResolvedValueOnce({ headers: { location } });

      await expect(service.createUser(input)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    },
  );
});
