enum USER {
  CREATE = 'user.create',
  GET_ALL = 'user.get_all',
  GET_BY_ID = 'user.get_by_id',
  UPDATE_BY_ID = 'user.update_by_id',
  DELETE_BY_ID = 'user.delete_by_id',
}

enum KEYCLOAK {
  CREATE_USER = 'keycloak.create_user',
}

enum AUTHORIZER {
  LOGIN = 'authorizer.login',
  VERIFY_USER_TOKEN = 'authorizer.verify_user_token',
}

export const TCP_REQUEST_MESSAGE = {
  USER,
  KEYCLOAK,
  AUTHORIZER,
};
