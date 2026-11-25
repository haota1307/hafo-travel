const { ObjectId } = require('mongoose').mongo;

const roleSeed = require('../apps/identity/src/seeds/role.json');
const {
  AUTH_SESSIONS_COLLECTION,
} = require('../libs/constants/src/lib/auth-storage.constants.ts');

const {
  AuthToolError,
  INITIAL_ADMIN_INDEX,
  reportFailure,
  withIdentityDb,
} = require('./identity-db.cjs');

async function migrate() {
  if (process.argv.length !== 3 || process.argv[2] !== 'migrate') {
    throw new AuthToolError('Usage: node tools/auth-storage.cjs migrate');
  }

  await withIdentityDb(async (db) => {
    try {
      await db.createCollection(AUTH_SESSIONS_COLLECTION);
    } catch (error) {
      if (error.code !== 48) {
        throw error;
      }
    }

    const sessions = db.collection(AUTH_SESSIONS_COLLECTION);
    await sessions.createIndex({ refreshHash: 1 }, { unique: true });
    await sessions.createIndex({ previousRefreshHash: 1 }, { sparse: true });
    await sessions.createIndex(
      { refreshExpiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
    await removeLegacyAccessFields(sessions);

    const clientRole = roleSeed.data.find((role) => role.name === 'client');
    await db.collection('role').updateOne(
      { name: clientRole.name },
      {
        $setOnInsert: { ...clientRole, _id: new ObjectId(clientRole._id.$oid) },
      },
      { upsert: true },
    );

    const users = db.collection('users');
    await users.createIndex(
      { googleSubject: 1 },
      { unique: true, sparse: true },
    );
    await users.createIndex(
      { email: 1 },
      { unique: true, collation: { locale: 'simple' } },
    );
    await users.createIndex(
      { initialAdministrator: 1 },
      {
        name: INITIAL_ADMIN_INDEX,
        unique: true,
        partialFilterExpression: { initialAdministrator: true },
      },
    );
  });

  process.stdout.write('Identity auth storage is ready.\n');
}

async function removeLegacyAccessFields(sessions) {
  const indexes = await sessions.indexes();
  const legacyIndexes = indexes.filter(
    (index) =>
      Object.hasOwn(index.key, 'accessHash') &&
      Object.keys(index.key).length === 1,
  );

  for (const index of legacyIndexes) {
    try {
      await sessions.dropIndex(index.name);
    } catch (error) {
      if (error.code !== 27) {
        throw error;
      }
    }
  }

  await sessions.updateMany(
    {
      $or: [
        { accessHash: { $exists: true } },
        { accessExpiresAt: { $exists: true } },
      ],
    },
    { $unset: { accessHash: '', accessExpiresAt: '' } },
  );
}

migrate().catch(reportFailure);
