// On-device memory store (Phase 0). Holds items captured on the phone — the
// local half of 2brn's "second brain". Embeddings (added in Step 2) are stored
// as a JSON-encoded number[] in the `embedding` column; semantic search runs in
// JS over these vectors (see docs/PHASE-0.md). We can graduate to a dedicated
// vector store (ObjectBox / sqlite-vec) later if the brute-force scan gets slow.
import * as SQLite from 'expo-sqlite'

export interface LocalMemory {
  id: number
  text: string
  title: string | null
  source: string
  sourceUrl: string | null
  createdAt: string // ISO-8601 (UTC)
  embedding: number[] | null
}

export interface NewMemory {
  text: string
  title?: string | null
  source?: string
  sourceUrl?: string | null
  embedding?: number[] | null
}

// Raw row shape as stored in SQLite (embedding is a JSON string column).
interface MemoryRow {
  id: number
  text: string
  title: string | null
  source: string
  source_url: string | null
  created_at: string
  embedding: string | null
}

const DB_NAME = 'twobrn.db'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

/** Open (once) and migrate the local database. Safe to call repeatedly. */
function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME)
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          title TEXT,
          source TEXT NOT NULL DEFAULT 'mobile',
          source_url TEXT,
          created_at TEXT NOT NULL,
          embedding TEXT
        );
      `)
      return db
    })()
  }
  return dbPromise
}

function rowToMemory(r: MemoryRow): LocalMemory {
  return {
    id: r.id,
    text: r.text,
    title: r.title,
    source: r.source,
    sourceUrl: r.source_url,
    createdAt: r.created_at,
    embedding: r.embedding ? (JSON.parse(r.embedding) as number[]) : null,
  }
}

/** Insert one memory; returns its new row id. */
export async function insertMemory(m: NewMemory): Promise<number> {
  const db = await getDb()
  const res = await db.runAsync(
    `INSERT INTO memories (text, title, source, source_url, created_at, embedding)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      m.text,
      m.title ?? null,
      m.source ?? 'mobile',
      m.sourceUrl ?? null,
      new Date().toISOString(),
      m.embedding ? JSON.stringify(m.embedding) : null,
    ],
  )
  return res.lastInsertRowId
}

/** All memories, newest first. */
export async function getAllMemories(): Promise<LocalMemory[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<MemoryRow>(
    'SELECT * FROM memories ORDER BY datetime(created_at) DESC, id DESC',
  )
  return rows.map(rowToMemory)
}

/** Number of stored memories. */
export async function countMemories(): Promise<number> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM memories')
  return row?.n ?? 0
}

/** Delete one memory by id. */
export async function deleteMemory(id: number): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM memories WHERE id = ?', [id])
}

/**
 * Dev-only sanity check (Phase 0, Step 1): insert a row, confirm the count grew,
 * then remove it so it leaves no trace. Returns the before/after counts.
 */
export async function selfTest(): Promise<{ before: number; after: number }> {
  const before = await countMemories()
  const id = await insertMemory({ text: 'db self-test', source: 'selftest' })
  const after = await countMemories()
  await deleteMemory(id)
  return { before, after }
}
