import { createApp } from 'vue';
import App from './App.vue';
import { createAppPinia } from '@/app/providers/pinia';
import '@/app/styles/index.css';
import { preloadPersistedState } from '@/shared/lib/storage/preloadPersistedState';
import { useSyncQueueStore } from '@/shared/lib/offline';
// Импорты сторов ресурсов нужны, чтобы сработала регистрация их адаптеров
// в реестре sync-queue до вызова init().
import '@/entities/todo';

async function bootstrap() {
  // Сначала достаём persisted state из IndexedDB в sync-кэш,
  // чтобы pinia-plugin-persistedstate увидел его при гидрации.
  await preloadPersistedState();

  const app = createApp(App);
  app.use(createAppPinia());
  app.mount('#app');

  // Единая точка запуска offline-first инфраструктуры:
  // подписки на online/offline, flush очереди и рефетч всех ресурсов.
  useSyncQueueStore().init();
}

void bootstrap();
