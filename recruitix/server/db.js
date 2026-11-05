import { MongoClient, GridFSBucket } from 'mongodb';
import bcrypt from 'bcryptjs';
import { MemoryDb } from './memoryDb.js';

const DB_NAME = 'recruitix';

export const DEMO_USER = { email: 'demo@recruitix.com', password: 'Demo@1234', name: 'Demo Candidate' };

// Cached across invocations — required for correctness on serverless (Vercel), where
// reconnecting on every request would quickly exhaust Atlas's connection limit.
let clientPromise = null;
let memoryDbPromise = null;

// Demo mode: an in-memory database pre-seeded with companies, questions and a demo login. Used
// when DEMO_MODE=true, or automatically when the Atlas host no longer resolves in DNS (deleted
// cluster / wrong URI). Data is not persisted.
function getMemoryDb() {
  if (!memoryDbPromise) {
    memoryDbPromise = (async () => {
      const db = new MemoryDb();
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase(db);
      const now = new Date();
      await db.collection('users').insertOne({
        email: DEMO_USER.email,
        passwordHash: await bcrypt.hash(DEMO_USER.password, 10),
        displayName: DEMO_USER.name,
        dateOfBirth: '2000-01-01',
        role: 'candidate',
        faceEnrolled: false,
        enrollmentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      // eslint-disable-next-line no-console
      console.warn(`[db] DEMO MODE: using in-memory database (not persisted). Login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
      return db;
    })();
  }
  return memoryDbPromise;
}

function getClientPromise() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Missing MONGODB_URI environment variable.');
    }
    // maxIdleTimeMS keeps pooled sockets shorter-lived than Atlas's own idle
    // timeout, so a frozen-then-thawed serverless invocation doesn't try to
    // reuse a connection Atlas has already torn down (which surfaces as a
    // TLS "internal_error" alert rather than a clean disconnect).
    clientPromise = new MongoClient(uri, { maxIdleTimeMS: 10000 }).connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

let useMemory = process.env.DEMO_MODE === 'true' || !process.env.MONGODB_URI;

export async function getDb() {
  if (!useMemory) {
    try {
      const client = await getClientPromise();
      return client.db(DB_NAME);
    } catch (err) {
      // Only an unresolvable host switches to demo mode; other failures (auth, network blips)
      // still surface as errors rather than silently dropping to non-persistent storage.
      if (err?.code !== 'ENOTFOUND' && err?.code !== 'ENODATA') throw err;
      // eslint-disable-next-line no-console
      console.warn(`[db] MongoDB host not found (${err.message}); switching to demo mode.`);
      useMemory = true;
    }
  }
  return getMemoryDb();
}

export async function getSnapshotBucket() {
  const db = await getDb();
  return db instanceof MemoryDb ? db.snapshotBucket() : new GridFSBucket(db, { bucketName: 'snapshots' });
}
