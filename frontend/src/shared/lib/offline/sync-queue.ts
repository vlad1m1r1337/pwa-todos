import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { idbStorage } from '@/shared/lib/storage'
import { formatError, isNetworkError } from './network'
import type { PendingOp, ResourceAdapter, ResourceId } from './types'

/**
 * Глобальный реестр ресурсов. Ключ — имя ресурса (совпадает с `resource`
 * в `PendingOp`). Адаптер регистрируется один раз при импорте соответствующего
 * стора (см. `defineResourceStore`).
 */
const adapters = new Map<string, ResourceAdapter>()

export function registerResource(adapter: ResourceAdapter): void {
  adapters.set(adapter.name, adapter)
}

/**
 * Единый стор синхронизации: одна FIFO-очередь на все ресурсы,
 * общий статус online/offline и единый канал пользовательских ошибок.
 *
 * Добавление нового ресурса не требует ничего менять здесь —
 * достаточно зарегистрировать адаптер через `defineResourceStore`.
 */
export const useSyncQueueStore = defineStore(
  'sync-queue',
  () => {
    const queue = ref<PendingOp[]>([])
    const syncing = ref(false)
    const isOnline = ref(
      typeof navigator !== 'undefined' ? navigator.onLine : true,
    )
    const error = ref<string | null>(null)
    const pendingCount = computed(() => queue.value.length)

    function clearError() {
      error.value = null
    }

    function reportError(e: unknown) {
      if (isNetworkError(e)) return
      error.value = formatError(e)
    }

    function enqueue(op: PendingOp) {
      if (tryCoalesce(op)) {
        void flush()
        return
      }
      queue.value.push(op)
      void flush()
    }

    const shallowMerge = (a: unknown, b: unknown): unknown => ({
      ...(a as object),
      ...(b as object),
    })

    /**
     * Схлопывает новый `update` с последней совместимой операцией по тому же
     * `targetId` в очереди, чтобы уменьшить количество PATCH-ов:
     *   - в ожидающий `update` → объединяем payload'ы,
     *   - в ожидающий `create` → вливаем поля update'а прямо в payload create'а
     *     (тогда серверу уедет один POST со всеми полями, а не POST + PATCH).
     *
     * В обоих случаях новая операция в очередь не попадает и возвращаем `true`.
     *
     * Важно: операцию в голове очереди (index 0) не трогаем, если сейчас идёт
     * `flush` — её payload уже мог быть передан в `axios` и может сериализоваться
     * в любой момент. Мёрж туда создал бы race condition.
     */
    function tryCoalesce(op: PendingOp): boolean {
      if (op.kind !== 'update') return false
      const start = syncing.value ? 1 : 0
      const adapter = adapters.get(op.resource)
      const mergeUpdate = adapter?.mergeUpdatePayload ?? shallowMerge
      const mergeIntoCreate = adapter?.mergeUpdateIntoCreate ?? shallowMerge

      for (let i = queue.value.length - 1; i >= start; i--) {
        const prev = queue.value[i]!
        if (prev.resource !== op.resource) continue

        if (prev.kind === 'create' && prev.tempId === op.targetId) {
          prev.payload = (mergeIntoCreate as (a: unknown, b: unknown) => unknown)(
            prev.payload,
            op.payload,
          )
          return true
        }
        if (prev.kind === 'update' && prev.targetId === op.targetId) {
          prev.payload = (mergeUpdate as (a: unknown, b: unknown) => unknown)(
            prev.payload,
            op.payload,
          )
          return true
        }
        if ('targetId' in prev && prev.targetId === op.targetId) {
          // Упёрлись в delete того же элемента — сливать некуда и не во что.
          return false
        }
      }
      return false
    }

    /** Перепривязываем tempId → real id в ожидающих операциях того же ресурса. */
    function remapId(
      resource: string,
      tempId: string,
      realId: ResourceId,
    ): void {
      for (const op of queue.value) {
        if (op.resource !== resource) continue
        if ('targetId' in op && op.targetId === tempId) {
          op.targetId = realId
        }
      }
    }

    /**
     * Отменяем зависимые операции, если create провалился с прикладной ошибкой:
     * без реального id мы их всё равно не отправим. Адаптер может
     * откатить оптимистичные изменения через `onRollback`.
     */
    function dropDependentOps(resource: string, tempId: string): void {
      const dependent: PendingOp[] = []
      queue.value = queue.value.filter((op) => {
        if (
          op.resource === resource &&
          'targetId' in op &&
          op.targetId === tempId
        ) {
          dependent.push(op)
          return false
        }
        return true
      })
      const adapter = adapters.get(resource)
      dependent.forEach((op) => adapter?.onRollback?.(op))
    }

    /**
     * Последовательно отправляет операции. При сетевой ошибке — останавливается
     * и ждёт события `online`. При прикладной ошибке — выкидывает операцию
     * и показывает сообщение пользователю.
     */
    async function flush(): Promise<void> {
      if (syncing.value || !isOnline.value || queue.value.length === 0) return

      syncing.value = true
      try {
        while (queue.value.length > 0) {
          const op = queue.value[0]!
          const adapter = adapters.get(op.resource)
          if (!adapter) {
            queue.value.shift()
            continue
          }

          try {
            if (op.kind === 'create') {
              const item = await adapter.api.create(op.payload)
              const realId = (item as { id: ResourceId }).id
              remapId(op.resource, op.tempId, realId)
              adapter.onSynced?.({ kind: 'create', tempId: op.tempId, item })
            } else if (op.kind === 'update') {
              if (typeof op.targetId !== 'number') break
              const item = await adapter.api.update(op.targetId, op.payload)
              adapter.onSynced?.({
                kind: 'update',
                targetId: op.targetId,
                item,
              })
            } else {
              if (typeof op.targetId === 'number') {
                await adapter.api.remove(op.targetId)
              }
              adapter.onSynced?.({ kind: 'delete', targetId: op.targetId })
            }
            queue.value.shift()
          } catch (e) {
            if (isNetworkError(e)) {
              isOnline.value = false
              break
            }
            const failed = queue.value.shift()!
            adapter.onRollback?.(failed)
            if (failed.kind === 'create') {
              dropDependentOps(failed.resource, failed.tempId)
            }
            error.value = formatError(e)
          }
        }
      } finally {
        syncing.value = false
      }
    }

    async function refetchAll(): Promise<void> {
      await Promise.all(
        Array.from(adapters.values()).map((a) => a.refetch?.()),
      )
    }

    /**
     * Подписываем стор на online/offline события и пытаемся догнать сервер
     * на старте. Вызывать один раз из `app/main.ts`.
     */
    function init(): void {
      if (typeof window === 'undefined') return
      window.addEventListener('online', async () => {
        isOnline.value = true
        clearError()
        await flush()
        await refetchAll()
      })
      window.addEventListener('offline', () => {
        isOnline.value = false
      })
      void (async () => {
        await flush()
        await refetchAll()
      })()
    }

    return {
      queue,
      syncing,
      isOnline,
      error,
      pendingCount,
      enqueue,
      flush,
      init,
      clearError,
      reportError,
    }
  },
  {
    persist: {
      key: 'sync-queue',
      storage: idbStorage,
      pick: ['queue'],
    },
  },
)
