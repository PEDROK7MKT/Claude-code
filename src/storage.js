// Persistência dos módulos Cofre e Arquivo via IndexedDB (storage API
// assíncrona — nunca localStorage). Se o ambiente bloquear IndexedDB,
// cai para um Map em memória e o app segue 100% usável na sessão.

const DB_NAME = 'batcave-ops-db'
const STORE = 'kv'
const memory = new Map()

function openDB() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function kvGet(key) {
  const db = await openDB()
  if (!db) return memory.get(key) ?? null
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function kvSet(key, value) {
  const db = await openDB()
  if (!db) {
    memory.set(key, value)
    return
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      memory.set(key, value)
      resolve()
    }
  })
}
