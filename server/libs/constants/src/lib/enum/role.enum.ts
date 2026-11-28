export enum ROLE {
  ADMINISTRATOR = 'administrator',
  CLIENT = 'client',
}

export enum PERMISSION {
  UI_DASHBOARD = 'UI:dashboard',
  UI_DASHBOARD_INQUIRIES = 'UI:dashboard/inquiries',
  UI_DASHBOARD_TOURS = 'UI:dashboard/tours',
  UI_DASHBOARD_DEPARTURES = 'UI:dashboard/departures',
  UI_DASHBOARD_BOOKINGS = 'UI:dashboard/bookings',
  UI_DASHBOARD_PAYMENTS = 'UI:dashboard/payments',
  UI_DASHBOARD_CONTENT = 'UI:dashboard/content',
  UI_DASHBOARD_USERS = 'UI:dashboard/users',
  UI_DASHBOARD_ROLES = 'UI:dashboard/roles',
  UI_DASHBOARD_PERMISSIONS = 'UI:dashboard/permissions',
  USER_CREATE = 'user.create',
  USER_GET_BY_ID = 'user.get_by_id',
  USER_GET_ALL = 'user.get_all',
  USER_UPDATE = 'user.update',
  USER_ASSIGN_ROLES = 'user.assign_roles',
  USER_DELETE = 'user.delete',
  ROLE_CREATE = 'role.create',
  ROLE_GET_BY_ID = 'role.get_by_id',
  ROLE_GET_ALL = 'role.get_all',
  ROLE_UPDATE = 'role.update',
  ROLE_DELETE = 'role.delete',
}

export const DASHBOARD_PERMISSIONS = Object.values(PERMISSION).filter(
  (permission) =>
    permission === PERMISSION.UI_DASHBOARD ||
    permission.startsWith(`${PERMISSION.UI_DASHBOARD}/`),
);
