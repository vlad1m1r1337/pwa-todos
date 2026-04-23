import { PERSISTED_KEYS, idb, cache } from '.';

/**
 * Заранее читает все persisted-ключи из IDB в синхронный кэш.
 * Должен быть вызван до createApp().mount(), чтобы плагин persistedstate
 * (у которого синхронный getItem) увидел значения и гидрировал стор.
 */

export async function preloadPersistedState() {
  const keysToPreload = Object.values(PERSISTED_KEYS).flat();

  await Promise.all(
    keysToPreload.map(async (key) => {
      const raw = await idb.getItem<string>(key);
      cache.set(key, raw ?? null);
    }),
  );
}
