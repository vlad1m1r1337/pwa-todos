import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import { idbStorage } from '@/shared/lib/storage'
import { registerResource, useSyncQueueStore } from './sync-queue'
import {
  isTempId,
  makeTempId,
  type ResourceAdapter,
  type ResourceApi,
  type ResourceId,
} from './types'

export interface ResourceStoreOptions<
  T extends { id: ResourceId },
  C,
  U,
> {
  /** Имя стора и ключа в реестре/persist. Должно быть уникальным. */
  name: string
  api: ResourceApi<T, C, U>
  /**
   * Собираем оптимистичное представление элемента из payload'а create.
   * Сюда вплетается временный id — сервер его заменит после ответа.
   */
  makeOptimistic: (payload: C, tempId: string) => T
  /**
   * Переопределение стратегии схлопывания двух последовательных update'ов.
   * По умолчанию применяется shallow-merge, что соответствует PATCH-семантике.
   */
  mergeUpdatePayload?: (existing: U, incoming: U) => U
  /**
   * Переопределение стратегии схлопывания update'а в ещё не улетевший create.
   * По умолчанию — shallow-merge в payload create'а.
   */
  mergeUpdateIntoCreate?: (createPayload: C, updatePayload: U) => C
}

/**
 * Фабрика сторов ресурсов поверх единой sync-инфраструктуры.
 *
 * Ресурсный стор отвечает только за:
 *  — локальные `items` (плюс loading),
 *  — их persist в IndexedDB,
 *  — трансляцию пользовательских действий в очередь `sync-queue`.
 *
 * Всё про сеть/очередь/online/offline живёт в `useSyncQueueStore`.
 *
 * Пример:
 * ```ts
 * export const useTodosStore = defineResourceStore<LocalTodo, TodoCreate, TodoUpdate>({
 *   name: 'todos',
 *   api: todosApi,
 *   makeOptimistic: (p, id) => ({ id, ...p }),
 * })
 * ```
 */
export function defineResourceStore<
  T extends { id: ResourceId },
  C,
  U,
>(options: ResourceStoreOptions<T, C, U>) {
  const { name, api, makeOptimistic, mergeUpdatePayload, mergeUpdateIntoCreate } =
    options

  const useStore = defineStore(
    name,
    () => {
      const items = ref<T[]>([]) as Ref<T[]>
      const loading = ref(false)
      const count = computed(() => items.value.length)

      const queue = useSyncQueueStore()

      async function fetchAll(): Promise<void> {
        loading.value = true
        try {
          const data = await api.list()
          // Сохраняем оптимистичные элементы, которые ещё не долетели до сервера.
          const pending = items.value.filter((t) => isTempId(t.id))
          items.value = [...data, ...pending]
        } catch (e) {
          queue.reportError(e)
        } finally {
          loading.value = false
        }
      }

      function addItem(payload: C): void {
        const tempId = makeTempId()
        items.value.push(makeOptimistic(payload, tempId))
        queue.enqueue({
          id: crypto.randomUUID(),
          resource: name,
          kind: 'create',
          tempId,
          payload,
        })
      }

      function updateItem(id: ResourceId, patch: U): void {
        const item = items.value.find((t) => t.id === id)
        if (!item) return
        Object.assign(item, patch)
        queue.enqueue({
          id: crypto.randomUUID(),
          resource: name,
          kind: 'update',
          targetId: id,
          payload: patch,
        })
      }

      function removeItem(id: ResourceId): void {
        const i = items.value.findIndex((t) => t.id === id)
        if (i === -1) return
        items.value.splice(i, 1)
        queue.enqueue({
          id: crypto.randomUUID(),
          resource: name,
          kind: 'delete',
          targetId: id,
        })
      }

      return {
        items,
        loading,
        count,
        fetchAll,
        addItem,
        updateItem,
        removeItem,
      }
    },
    {
      persist: {
        key: name,
        storage: idbStorage,
        pick: ['items'],
      },
    },
  )

  // Регистрируем адаптер сразу при импорте модуля. Сам стор инстанцируется
  // лениво внутри колбэков — к моменту их вызова Pinia уже установлена.
  const adapter: ResourceAdapter<T, C, U> = {
    name,
    api,
    onSynced(event) {
      const store = useStore()
      if (event.kind === 'create') {
        const idx = store.items.findIndex((t) => t.id === event.tempId)
        if (idx !== -1) store.items[idx] = event.item
      } else if (event.kind === 'update') {
        const idx = store.items.findIndex((t) => t.id === event.targetId)
        if (idx !== -1) store.items[idx] = event.item
      }
    },
    onRollback(op) {
      if (op.kind === 'create') {
        const store = useStore()
        const idx = store.items.findIndex((t) => t.id === op.tempId)
        if (idx !== -1) store.items.splice(idx, 1)
      }
    },
    refetch: () => useStore().fetchAll(),
    mergeUpdatePayload,
    mergeUpdateIntoCreate,
  }
  registerResource(adapter as unknown as ResourceAdapter)

  return useStore
}
