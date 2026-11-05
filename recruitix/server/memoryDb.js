// Minimal in-memory stand-in for the slice of the MongoDB driver API this server uses.
// Demo/offline fallback only — data lives in process memory and is lost on restart (and, on
// serverless, whenever the instance is recycled). Supported: find/findOne (equality, $in, $ne,
// sort), insertOne/insertMany, updateOne ($set/$setOnInsert/$inc, upsert), countDocuments.
import { ObjectId } from 'mongodb';

const isObjectId = (v) => v instanceof ObjectId;
const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v) && !isObjectId(v) && !(v instanceof Date);

function clone(v) {
  if (Array.isArray(v)) return v.map(clone);
  if (v instanceof Date) return new Date(v.getTime());
  if (isPlain(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v; // primitives and (immutable) ObjectIds
}

function eq(a, b) {
  if (isObjectId(a) && isObjectId(b)) return a.equals(b);
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

function matchesValue(actual, cond) {
  if (isPlain(cond) && Object.keys(cond).some((k) => k.startsWith('$'))) {
    return Object.entries(cond).every(([op, arg]) => {
      if (op === '$in') return arg.some((x) => eq(actual, x));
      if (op === '$ne') return !eq(actual, arg);
      throw new Error(`memoryDb: unsupported operator ${op}`);
    });
  }
  return eq(actual, cond);
}

const matches = (doc, filter) => Object.entries(filter).every(([k, cond]) => matchesValue(doc[k], cond));

function compare(a, b) {
  const x = a instanceof Date ? a.getTime() : a;
  const y = b instanceof Date ? b.getTime() : b;
  return x < y ? -1 : x > y ? 1 : 0;
}

function sortDocs(docs, sort) {
  const keys = Object.entries(sort ?? {});
  if (!keys.length) return docs;
  return [...docs].sort((a, b) => {
    for (const [k, dir] of keys) {
      const c = compare(a[k], b[k]);
      if (c) return c * dir;
    }
    return 0;
  });
}

function applyUpdate(doc, update) {
  Object.assign(doc, clone(update.$set ?? {}));
  for (const [k, n] of Object.entries(update.$inc ?? {})) doc[k] = (doc[k] ?? 0) + n;
}

class MemoryCollection {
  constructor() {
    this.docs = [];
  }

  async findOne(filter = {}, opts = {}) {
    const found = sortDocs(this.docs.filter((d) => matches(d, filter)), opts.sort)[0];
    return found ? clone(found) : null;
  }

  find(filter = {}) {
    const run = (sort) => sortDocs(this.docs.filter((d) => matches(d, filter)), sort).map(clone);
    let sortSpec = null;
    const cursor = {
      sort(spec) {
        sortSpec = spec;
        return cursor;
      },
      async toArray() {
        return run(sortSpec);
      },
    };
    return cursor;
  }

  async countDocuments(filter = {}) {
    return this.docs.filter((d) => matches(d, filter)).length;
  }

  async insertOne(doc) {
    const stored = clone(doc);
    stored._id ??= new ObjectId();
    this.docs.push(stored);
    return { insertedId: stored._id };
  }

  async insertMany(docs) {
    const insertedIds = {};
    for (const [i, doc] of docs.entries()) insertedIds[i] = (await this.insertOne(doc)).insertedId;
    return { insertedIds, insertedCount: docs.length };
  }

  async updateOne(filter, update, opts = {}) {
    const target = this.docs.find((d) => matches(d, filter));
    if (target) {
      applyUpdate(target, update);
      return { matchedCount: 1, modifiedCount: 1 };
    }
    if (!opts.upsert) return { matchedCount: 0, modifiedCount: 0 };

    const base = {};
    for (const [k, v] of Object.entries(filter)) if (!isPlain(v)) base[k] = clone(v);
    const doc = { ...base, ...clone(update.$setOnInsert ?? {}) };
    applyUpdate(doc, update);
    await this.insertOne(doc);
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
  }
}

export class MemoryDb {
  constructor() {
    this.collections = new Map();
    this.files = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new MemoryCollection());
    return this.collections.get(name);
  }

  // Stand-in for GridFSBucket: just enough for the snapshot / resume upload paths.
  bucket() {
    const files = this.files;
    return {
      openUploadStream() {
        const id = new ObjectId();
        return {
          id,
          end(buffer, cb) {
            files.set(id.toString(), buffer);
            cb?.();
          },
        };
      },
      async delete(id) {
        files.delete(id.toString());
      },
    };
  }
}

// Demo-mode ids. The in-memory DB is wiped whenever the (serverless) instance restarts or a new
// one serves a request, which would orphan a candidate's JWT, company links and in-flight exam
// session. Making the demo user and companies deterministic — and encoding company + round into
// the session id — lets all of them be recognised/rebuilt after a reset instead of "invalid_session".
const hex2 = (n) => n.toString(16).padStart(2, '0');
const DEMO_ROUNDS = ['technical', 'personal', 'hr'];
const DEMO_SLUGS = ['tcs', 'wipro', 'infosys', 'general'];

export const DEMO_USER_ID = new ObjectId(`d0${'0'.repeat(22)}`);
export const demoCompanyId = (slug) => new ObjectId(`c0${hex2(Math.max(0, DEMO_SLUGS.indexOf(slug)))}${'0'.repeat(20)}`);

export function newDemoSessionId(companyId, round) {
  const companyIdx = companyId.toString().slice(2, 4);
  const roundIdx = hex2(Math.max(0, DEMO_ROUNDS.indexOf(round)));
  const random = Array.from({ length: 18 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return new ObjectId(`d5${companyIdx}${roundIdx}${random}`);
}

export function parseDemoSessionId(id) {
  const h = id.toString();
  if (!h.startsWith('d5')) return null;
  const round = DEMO_ROUNDS[parseInt(h.slice(4, 6), 16)];
  if (!round) return null;
  return { companyId: new ObjectId(`c0${h.slice(2, 4)}${'0'.repeat(20)}`), round };
}
