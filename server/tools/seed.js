const fs = require('node:fs');
const path = require('node:path');
const { loadEnvFile } = require('node:process');

const { MongoClient, ObjectId } = require('mongoose').mongo;

// Hàm chuyển đổi các kiểu dữ liệu đặc biệt của MongoDB ($oid, $date)
function mapData(_data) {
  return _data.map((item) => {
    return Object.entries(item).reduce((acc, [key, value]) => {
      if (key === '_id' && value?.$oid) {
        acc[key] = new ObjectId(value.$oid);
      } else if (value?.$oid) {
        acc[key] = new ObjectId(value.$oid);
      } else if (value?.$date) {
        acc[key] = new Date(value.$date);
      } else {
        acc[key] = value;
      }

      return acc;
    }, {});
  });
}

// Hàm xử lý từng file JSON
async function processFile(filePath, mode, db) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const seed = JSON.parse(raw);
  const seedData = mapData(seed.data);

  const collection = db.collection(seed.collection);

  if (mode === 'prune') {
    await collection.deleteMany({});

    if (seedData.length > 0) {
      await collection.insertMany(seedData);
    }

    console.log(
      `✅ [${seed.collection}] pruned & inserted ${seedData.length} docs`,
    );
  } else {
    for (const doc of seedData) {
      const exists = await collection.findOne(doc);

      if (!exists) {
        await collection.insertOne(doc);
        console.log(
          `➕ Inserted into [${seed.collection}] ->`,
          doc.name || doc._id,
        );
      }
    }

    console.log(`✅ [${seed.collection}] migration completed`);
  }
}

// Hàm khởi chạy chính
async function bootstrap() {
  const dirPath = process.argv[2];
  const mode = process.argv[3] || 'migrate'; // prune | migrate
  const databaseKey = process.argv[4] || 'IDENTITY_MONGODB_DB_NAME';
  const defaultDatabase = process.argv[5] || 'identity';

  if (!dirPath) {
    console.error('❌ Please provide a seeder directory path');
    process.exit(1);
  }

  if (mode !== 'migrate' && mode !== 'prune') {
    throw new Error('Invalid mode, use "prune" or "migrate"');
  }

  const absoluteDir = path.resolve(dirPath);

  if (!fs.existsSync(absoluteDir)) {
    console.error(`❌ Seeder directory not found: ${absoluteDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(absoluteDir)
    .filter((file) => file.endsWith('.json'));

  if (files.length === 0) {
    console.log('No JSON seed files found.');

    return;
  }

  if (fs.existsSync('.env')) {
    loadEnvFile('.env');
  }

  const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(process.env[databaseKey] || defaultDatabase);

    for (const file of files) {
      const filePath = path.join(absoluteDir, file);
      await processFile(filePath, mode, db);
    }

    console.log('🎉 All seeders executed successfully!');
  } finally {
    await client.close();
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error while seeding:', error.message);
  process.exitCode = 1;
});
