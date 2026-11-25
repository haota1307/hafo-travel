const { randomUUID } = require('node:crypto');

const { isEmail } = require('class-validator');
const { ObjectId } = require('mongoose').mongo;

const { data: roleSeeds } = require('../apps/identity/src/seeds/role.json');
const {
  MIN_PROVISIONED_PASSWORD_LENGTH,
  hashPassword,
  isPasswordHash,
  isProvisioningPasswordValid,
} = require('../libs/utils/src/lib/password.util.ts');

const {
  AuthToolError,
  INITIAL_ADMIN_INDEX,
  reportFailure,
  withIdentityDb,
} = require('./identity-db.cjs');

const ADMIN_SEED = roleSeeds.find((role) => role.name === 'administrator');
const EXACT_MATCH = { collation: { locale: 'simple' } };

function isLoginEmail(email) {
  return (
    typeof email === 'string' &&
    email === email.trim() &&
    email.length <= 254 &&
    isEmail(email)
  );
}

function getPassword(name) {
  const password = process.env[name];

  if (!isProvisioningPasswordValid(password)) {
    throw new AuthToolError(
      `${name} must have at least ${MIN_PROVISIONED_PASSWORD_LENGTH} characters and at most 1024 UTF-8 bytes.`,
    );
  }

  return password;
}

function passwordAlreadySet(profile) {
  if (!Object.hasOwn(profile, 'passwordHash')) {
    return false;
  }

  if (!isPasswordHash(profile.passwordHash)) {
    throw new AuthToolError(
      'The existing profile has invalid password data. Resolve it before provisioning.',
    );
  }

  return true;
}

async function provisionProfile(db) {
  const id = process.env.AUTH_PROFILE_ID?.trim();
  const password = getPassword('AUTH_PROFILE_PASSWORD');

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw new AuthToolError(
      'AUTH_PROFILE_ID must be the MongoDB ObjectId of an existing profile.',
    );
  }

  const users = await getUsersForProvisioning(db);
  const profileId = new ObjectId(id);
  const profile = await users.findOne({ _id: profileId });

  if (!profile) {
    throw new AuthToolError('The selected profile was not found.');
  }

  if (typeof profile.userId !== 'string' || !profile.userId.trim()) {
    throw new AuthToolError(
      'The selected profile has no usable userId. Repair the profile identity before provisioning.',
    );
  }

  if (!isLoginEmail(profile.email)) {
    throw new AuthToolError(
      'The selected profile has no usable email. Repair the profile email before provisioning.',
    );
  }

  const [roleId] =
    Array.isArray(profile.roles) && profile.roles.length === 1
      ? profile.roles
      : [];

  if (
    !(roleId instanceof ObjectId) ||
    !(await db.collection('role').findOne({ _id: roleId }))
  ) {
    throw new AuthToolError(
      'The selected profile must have one existing role.',
    );
  }

  if (passwordAlreadySet(profile)) {
    return 'The selected profile already has a password.';
  }

  const passwordHash = await hashPassword(password);
  const result = await users.updateOne(
    {
      _id: profileId,
      userId: profile.userId,
      email: profile.email,
      roles: profile.roles,
      passwordHash: { $exists: false },
    },
    { $set: { passwordHash, updatedAt: new Date() } },
    EXACT_MATCH,
  );

  if (result.modifiedCount === 1) {
    return 'The selected profile can now sign in.';
  }

  const current = await users.findOne(
    {
      _id: profileId,
      userId: profile.userId,
      email: profile.email,
      roles: profile.roles,
    },
    EXACT_MATCH,
  );

  if (current && passwordAlreadySet(current)) {
    return 'The selected profile already has a password.';
  }

  throw new AuthToolError(
    'The selected profile changed during provisioning. Review it and run the command again.',
  );
}

async function provisionAdministrator(db) {
  const email = process.env.ADMIN_ACCOUNT?.trim();
  const password = getPassword('ADMIN_PASSWORD');
  const firstName = process.env.ADMIN_FIRST_NAME?.trim();
  const lastName = process.env.ADMIN_LAST_NAME?.trim();

  if (!isLoginEmail(email) || !firstName || !lastName) {
    throw new AuthToolError(
      'Set a valid ADMIN_ACCOUNT email, ADMIN_FIRST_NAME and ADMIN_LAST_NAME.',
    );
  }

  const roleId = new ObjectId(ADMIN_SEED._id.$oid);
  const administrator = await db
    .collection('role')
    .findOne({ _id: roleId, name: ADMIN_SEED.name }, EXACT_MATCH);

  if (!administrator) {
    throw new AuthToolError(
      'Run the Identity role seed before provisioning the initial administrator.',
    );
  }

  const users = await getUsersForProvisioning(db);

  if (await checkInitialAdministrator(users, email, roleId)) {
    return 'The initial administrator already has a password.';
  }

  const existingProfile = await users.findOne({ email }, EXACT_MATCH);

  if (existingProfile) {
    throw new AuthToolError(
      'ADMIN_ACCOUNT belongs to an existing profile. Choose a new email for the initial administrator.',
    );
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  try {
    await users.insertOne({
      email,
      firstName,
      lastName,
      userId: randomUUID(),
      roles: [roleId],
      initialAdministrator: true,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    if (await checkInitialAdministrator(users, email, roleId)) {
      return 'The initial administrator already has a password.';
    }

    throw new AuthToolError(
      'ADMIN_ACCOUNT belongs to an existing profile. Choose a new email for the initial administrator.',
    );
  }

  return 'The initial administrator can now sign in.';
}

async function getUsersForProvisioning(db) {
  const users = db.collection('users');
  const indexes = await users.indexes().catch((error) => {
    if (error.code === 26) {
      return [];
    }

    throw error;
  });
  const hasInitialAdminIndex = indexes.some(
    (index) =>
      index.name === INITIAL_ADMIN_INDEX &&
      index.key.initialAdministrator === 1 &&
      Object.keys(index.key).length === 1 &&
      index.unique &&
      index.partialFilterExpression?.initialAdministrator === true &&
      Object.keys(index.partialFilterExpression).length === 1,
  );
  const hasUniqueEmailIndex = indexes.some(
    (index) =>
      index.key.email === 1 &&
      Object.keys(index.key).length === 1 &&
      index.unique &&
      !index.sparse &&
      !index.partialFilterExpression &&
      (!index.collation || index.collation.locale === 'simple'),
  );

  if (!hasInitialAdminIndex || !hasUniqueEmailIndex) {
    throw new AuthToolError(
      'Run node tools/auth-storage.cjs migrate before provisioning credentials.',
    );
  }

  return users;
}

async function checkInitialAdministrator(users, email, roleId) {
  const profile = await users.findOne({ initialAdministrator: true });

  if (!profile) {
    return false;
  }

  if (
    profile.email !== email ||
    profile.roles?.length !== 1 ||
    !roleId.equals(profile.roles[0]) ||
    !passwordAlreadySet(profile)
  ) {
    throw new AuthToolError(
      'The initial administrator has already been created. Review the selected profile and assigned role.',
    );
  }

  return true;
}

async function main() {
  const mode = process.argv[2];

  if (
    process.argv.length !== 3 ||
    !['profile', 'administrator'].includes(mode)
  ) {
    throw new AuthToolError(
      'Usage: node tools/provision-credentials.cjs profile|administrator',
    );
  }

  const message = await withIdentityDb(
    mode === 'profile' ? provisionProfile : provisionAdministrator,
  );
  process.stdout.write(`${message}\n`);
}

main().catch(reportFailure);
