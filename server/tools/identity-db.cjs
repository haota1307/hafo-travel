const { existsSync } = require('node:fs');
const { loadEnvFile } = require('node:process');

const { MongoClient } = require('mongoose').mongo;

const INITIAL_ADMIN_INDEX = 'auth_initial_administrator';

class AuthToolError extends Error {}

async function withIdentityDb(operation) {
  if (existsSync('.env')) {
    loadEnvFile('.env');
  }

  const { MONGODB_URL, IDENTITY_MONGODB_DB_NAME } = process.env;

  if (!MONGODB_URL || !IDENTITY_MONGODB_DB_NAME?.trim()) {
    throw new AuthToolError(
      'Set MONGODB_URL and IDENTITY_MONGODB_DB_NAME for the intended Identity database.',
    );
  }

  const client = new MongoClient(MONGODB_URL, {
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    await client.connect();

    return await operation(client.db(IDENTITY_MONGODB_DB_NAME));
  } finally {
    await client.close();
  }
}

function reportFailure(error) {
  const message =
    error instanceof AuthToolError
      ? error.message
      : 'Identity auth operation failed. Check the MongoDB connection, permissions and existing indexes.';

  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

module.exports = {
  AuthToolError,
  INITIAL_ADMIN_INDEX,
  reportFailure,
  withIdentityDb,
};
