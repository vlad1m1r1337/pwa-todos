import localforage from 'localforage';

// Отдельный инстанс IndexedDB для состояния Pinia.
// Не пересекается с Cache Storage, который Workbox использует
// для runtime-кэша HTTP-ответов.
const idb = localforage.createInstance({
  name: 'pwa-test',
  storeName: 'pinia',
  description: 'Pinia persisted state (IndexedDB)',
});

/**
 * Список ключей, которые мы предзагружаем из IDB на старте приложения.
 * Должен совпадать с `persist.key` каждого стора.
 *
 * При добавлении нового ресурса через `defineResourceStore` достаточно
 * дописать сюда его `name` и ключ очереди синхронизации оставить как есть.
 */
export const PERSISTED_KEYS = ['sync-queue', 'todos'] as const;

const cache = new Map<string, string | null>();

/**
 * Заранее читает все persisted-ключи из IDB в синхронный кэш.
 * Должен быть вызван до createApp().mount(), чтобы плагин persistedstate
 * (у которого синхронный getItem) увидел значения и гидрировал стор.
 */
export async function preloadPersistedState() {
  await Promise.all(
    PERSISTED_KEYS.map(async (key) => {
      const raw = await idb.getItem<string>(key);
      cache.set(key, raw ?? null);
    }),
  );
}

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
