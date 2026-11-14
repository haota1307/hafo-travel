const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const { MongoClient, ObjectId } = require('mongoose').mongo;

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

async function bootstrap() {
  const uri = required('MONGODB_URL');
  const database = required('MONGODB_DB_NAME');
  const userId = required('BOOTSTRAP_ADMIN_KEYCLOAK_ID');
  const email = required('BOOTSTRAP_ADMIN_EMAIL');
  const firstName = required('BOOTSTRAP_ADMIN_FIRST_NAME');
  const lastName = required('BOOTSTRAP_ADMIN_LAST_NAME');
  const seed = JSON.parse(
    readFileSync(
      join(__dirname, '../apps/user-access/src/seeds/role.json'),
      'utf8',
    ),
  ).data[0];
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

  try {
    await client.connect();
    const db = client.db(database);
    const users = db.collection('users');
    const conflicts = await users
      .find({ $or: [{ email }, { userId }] })
      .toArray();

    if (
      conflicts.length > 1 ||
      conflicts.some((user) => user.userId !== userId || user.email !== email)
    ) {
      throw new Error(
        'An existing user conflicts with the supplied email or Keycloak ID',
      );
    }

    const now = new Date();
    const role = await db.collection('role').findOneAndUpdate(
      { name: seed.name },
      {
        $set: {
          description: seed.description,
          permissions: seed.permissions,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: new ObjectId(seed._id.$oid),
          name: seed.name,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    await users.updateOne(
      { userId, email },
      {
        $set: { firstName, lastName, updatedAt: now, roles: [role._id] },
        $setOnInsert: { userId, email, createdAt: now },
      },
      { upsert: true },
    );
    process.stdout.write(
      'Administrator role and application profile provisioned. Keycloak account must already exist.\n',
    );
  } finally {
    await client.close();
  }
}

bootstrap().catch(() => {
  process.stderr.write(
    'Administrator provisioning failed. Check required environment variables, user conflicts and MongoDB connectivity.\n',
  );
  process.exitCode = 1;
});
