import localforage from 'localforage';

// Отдельный инстанс IndexedDB для состояния Pinia.
// Не пересекается с Cache Storage, который Workbox использует
// для runtime-кэша HTTP-ответов.
export const idb = localforage.createInstance({
  name: 'pwa-test',
  storeName: 'pinia',
  description: 'Pinia persisted state (IndexedDB)',
});

/**
 * Группы persisted-ключей для предзагрузки из IDB на старте приложения.
 * Должны совпадать с `persist.key` соответствующих стораджей.
 *
 * - `infrastructure`: низкоуровневые технические сторы
 * - `resources`: прикладные ресурсные сторы (например, todos)
 */
export const PERSISTED_KEYS = {
  infrastructure: ['sync-queue'],
  resources: ['todos'],
} as const;

export const cache = new Map<string, string | null>();

/**
 * Sync-адаптер под StorageLike pinia-plugin-persistedstate:
 * - read: мгновенно из in-memory кэша (наполненного preloadPersistedState)
 * - write: в кэш + асинхронно в IndexedDB (fire-and-forget)
 */
export const idbStorage = {
  getItem: (key: string): string | null => cache.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    cache.set(key, value);
    void idb.setItem(key, value);
  },
  removeItem: (key: string): void => {
    cache.delete(key);
    void idb.removeItem(key);
  },
};
