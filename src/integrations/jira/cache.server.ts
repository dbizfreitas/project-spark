// Server-only. Cache em memória por instância do processo — em runtime
// serverless/edge (Cloudflare Workers, via nitro) cada isolate pode ter seu
// próprio módulo carregado, então o hit-rate entre requisições não é
// garantido como seria num processo Node de vida longa (caso do jira-live
// original). Ainda assim é um ganho real dentro do mesmo isolate/warm start,
// e nunca piora corretude — só cache de leitura, nunca fonte de verdade.
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Limite generoso — mesma razão do jira-live: sem isso, cada chave de
// issue/sprint já consultada fica pra sempre.
const MAX_ENTRIES = 2000;

const store = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  // Reinsere no fim (Map preserva ordem de inserção) — marca como usado
  // recentemente, pra eviction abaixo derrubar o realmente mais antigo (LRU).
  store.delete(key);
  store.set(key, entry);
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs = 5 * 60_000): void {
  store.delete(key); // se já existir, remove antes pra reinserir no fim
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  if (store.size > MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) store.delete(oldestKey);
  }
}
