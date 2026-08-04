import dns from 'node:dns';
import { MongoClient, GridFSBucket } from 'mongodb';

// Some local/router DNS resolvers refuse SRV queries (needed for the mongodb+srv:// scheme)
// even though they resolve plain A/AAAA records fine, surfacing as "querySrv ECONNREFUSED".
// Falling back to public resolvers keeps local dev working without changing the connection string.
dns.setServers([...dns.getServers(), '8.8.8.8', '1.1.1.1']);

const DB_NAME = 'recruitix';

// Cached across invocations — required for correctness on serverless (Vercel), where
// reconnecting on every request would quickly exhaust Atlas's connection limit.
let clientPromise = null;

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

export async function getDb() {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}

export async function getSnapshotBucket() {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: 'snapshots' });
}
