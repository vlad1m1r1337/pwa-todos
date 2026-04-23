import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

/**
 * Фабрика Pinia с подключённым плагином persistedstate.
 * Сам storage-адаптер (IndexedDB) указывается в каждом сторе отдельно.
 */
export function createAppPinia() {
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  return pinia;
}
