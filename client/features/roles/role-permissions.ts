import {
  dashboardPermission,
  navigation,
  type Destination,
} from "@/features/dashboard/sections";

export const permissionActions = ["view", "create", "edit", "delete"] as const;

type PermissionAction = (typeof permissionActions)[number];

type PagePermissions = Partial<Record<PermissionAction, string[]>>;

const pagePermissions: Partial<Record<Destination, PagePermissions>> = {
  users: {
    view: ["user.get_all", "user.get_by_id"],
    create: ["user.create"],
    edit: ["user.update", "user.assign_roles"],
  },
  roles: {
    create: ["role.create"],
    edit: ["role.update"],
    delete: ["role.delete"],
  },
};

const requiredPermissions = new Map([
  [dashboardPermission("roles"), ["role.get_all", "role.get_by_id"]],
  [dashboardPermission("permissions"), ["role.get_all"]],
  ["role.update", ["role.get_by_id"]],
  ["user.assign_roles", ["role.get_all"]],
]);

const supportingPermissions = new Set([...requiredPermissions.values()].flat());

export function getPermissionRows(catalog?: ReadonlySet<string>) {
  const destinations = navigation.flatMap(({ pages }) => pages);

  return destinations.flatMap((page) => {
    const access = dashboardPermission(page);
    const group = pagePermissions[page];
    const actions = new Map<PermissionAction, string[]>();

    for (const action of permissionActions) {
      const codes = group?.[action] ?? [];
      const permissions = (
        action === "view" ? [access, ...codes] : codes
      ).filter((permission) => !catalog || catalog.has(permission));

      if (permissions.length > 0) {
        actions.set(action, permissions);
      }
    }

    return actions.size > 0 ? [{ page, actions }] : [];
  });
}

export function getOtherPermissions(
  permissions: readonly string[],
  rows: ReturnType<typeof getPermissionRows>,
) {
  const covered = new Set(
    rows.flatMap(({ actions }) => [...actions.values()].flat()),
  );

  return [...new Set(permissions)].filter(
    (permission) =>
      !covered.has(permission) && !supportingPermissions.has(permission),
  );
}

export function getPermissionSelection(
  permissions: readonly string[],
  selected: ReadonlySet<string>,
) {
  const checked = permissions.every((permission) => {
    const dependencies = requiredPermissions.get(permission) ?? [];

    return (
      selected.has(permission) &&
      dependencies.every((dependency) => selected.has(dependency))
    );
  });

  return {
    checked,
    partial:
      !checked && permissions.some((permission) => selected.has(permission)),
  };
}

export function applyPermissionChanges(
  permissions: readonly string[],
  changes: ReadonlyMap<string, boolean>,
) {
  const next = new Set(permissions);
  const removedRequirements = new Set<string>();

  for (const [permission, checked] of changes) {
    const dependencies = requiredPermissions.get(permission) ?? [];

    if (checked) {
      next.add(permission);

      for (const dependency of dependencies) {
        next.add(dependency);
      }
    } else {
      next.delete(permission);

      for (const dependency of dependencies) {
        removedRequirements.add(dependency);
      }
    }
  }

  const retainedRequirements = new Set(
    [...next].flatMap(
      (permission) => requiredPermissions.get(permission) ?? [],
    ),
  );

  for (const dependency of removedRequirements) {
    if (!retainedRequirements.has(dependency)) {
      next.delete(dependency);
    }
  }

  return [...next];
}
