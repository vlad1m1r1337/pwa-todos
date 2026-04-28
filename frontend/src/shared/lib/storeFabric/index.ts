import { storeToRefs } from 'pinia';
import { type ComputedRef, type Ref } from 'vue';
import { createLocalResourceStore } from './local-resource-store';
import { ResourceSyncController } from './resource-sync-controller';
import type { ResourceApi, ResourceId } from './types';

interface CreateResourceStoreOptions<T extends { id: ResourceId }, C, U> {
  /** Имя ресурса. Используется как Pinia store id и persist key. */
  name: string;
  api: ResourceApi<T, C, U>;
  /**
   * Собираем оптимистичное представление элемента из payload'а create.
   * Сюда вплетается временный id — сервер его заменит после ответа.
   */
  makeOptimistic: (payload: C, tempId: string) => T;
}

/**
 * Публичный интерфейс ресурсного стора, видимый компонентам.
 * Состояние отдаётся как реактивные refs, действия — как обычные методы.
 */
export interface ResourceStore<T extends { id: ResourceId }, C, U> {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  count: ComputedRef<number>;
  fetchAll: () => Promise<void>;
  addItem: (payload: C) => void;
  updateItem: (id: ResourceId, patch: U) => void;
  removeItem: (id: ResourceId) => void;
}

/**
 * Фабрика ресурсных сторов.
 *
 * Склеивает две независимые половинки:
 *  — `createLocalResourceStore` — чистый Pinia-стор с локальным состоянием
 *    и нейтральными мутаторами;
 *  — `ResourceSyncController` — класс, владеющий очередью синхронизации
 *    и адаптером для `sync-queue`.
 *
 * Адаптер регистрируется сразу при импорте модуля, чтобы `flush()` на
 * старте приложения мог обработать persisted-операции до первого
 * обращения к стору из компонента.
 *
 * Пример:
 * ```ts
 * export const useTodosStore = createResourceStore<LocalTodo, TodoCreate, TodoUpdate>({
 *   name: 'todos',
 *   api: todosApi,
 *   makeOptimistic: (p, id) => ({ id, ...p }),
 * })
 * ```
 */
export function createResourceStore<T extends { id: ResourceId }, C, U>(
  options: CreateResourceStoreOptions<T, C, U>,
): () => ResourceStore<T, C, U> {
  const useLocalStore = createLocalResourceStore<T>(options.name);

  const controller = new ResourceSyncController<T, C, U>({
    name: options.name,
    api: options.api,
    makeOptimistic: options.makeOptimistic,
    getLocalStore: () => useLocalStore(),
  });
  controller.register();

  return function useResourceStore(): ResourceStore<T, C, U> {
    const local = useLocalStore();
    const { items, loading, count } = storeToRefs(local);

    return {
      items: items as Ref<T[]>,
      loading,
      count,
      fetchAll: () => controller.fetchAll(),
      addItem: (payload) => controller.addItem(payload),
      updateItem: (id, patch) => controller.updateItem(id, patch),
      removeItem: (id) => controller.removeItem(id),
    };
  };
}

export const defineResourceStore = createResourceStore;

export {
  useSyncQueueStore,
  registerResource,
} from '../apiSyncQueue/sync-queue';
export { isTempId, makeTempId } from './utils';
export {
  type ResourceId,
  type ResourceApi,
  type ResourceAdapter,
  type PendingOp,
  type SyncEvent,
} from './types';
