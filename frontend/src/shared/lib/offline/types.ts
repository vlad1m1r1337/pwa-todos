/**
 * Общие типы для offline-first синхронизации.
 * Живут в shared, чтобы ими могли пользоваться все ресурсы (todos, users, …).
 */

export type ResourceId = number | string

/**
 * Запись в очереди отложенных операций. Одна общая очередь на все ресурсы —
 * поле `resource` маршрутизирует операцию в нужный адаптер при flush.
 */
export type PendingOp<P = unknown> =
  | {
      id: string
      resource: string
      kind: 'create'
      tempId: string
      payload: P
    }
  | {
      id: string
      resource: string
      kind: 'update'
      targetId: ResourceId
      payload: P
    }
  | {
      id: string
      resource: string
      kind: 'delete'
      targetId: ResourceId
    }

/** Событие, которое sync-queue шлёт обратно в ресурс после ответа сервера. */
export type SyncEvent<T> =
  | { kind: 'create'; tempId: string; item: T }
  | { kind: 'update'; targetId: ResourceId; item: T }
  | { kind: 'delete'; targetId: ResourceId }

/**
 * HTTP-клиент конкретного ресурса. Единственный контракт, который нужен
 * sync-queue, чтобы отправить операцию на сервер.
 */
export interface ResourceApi<T, C, U> {
  list: () => Promise<T[]>
  create: (payload: C) => Promise<T>
  update: (id: ResourceId, payload: U) => Promise<T>
  remove: (id: ResourceId) => Promise<void>
}

/**
 * Адаптер ресурса для sync-queue. Создаётся фабрикой `defineResourceStore`
 * и автоматически регистрируется в реестре при импорте стора.
 */
export interface ResourceAdapter<T = unknown, C = unknown, U = unknown> {
  name: string
  api: ResourceApi<T, C, U>
  onSynced?: (event: SyncEvent<T>) => void
  onRollback?: (op: PendingOp) => void
  refetch?: () => Promise<void>
  /**
   * Стратегия объединения двух update-payload'ов при схлопывании
   * последовательных update'ов по одному `targetId`. По умолчанию —
   * shallow-merge (`{ ...existing, ...incoming }`), что соответствует
   * семантике PATCH. Переопределяется, если у ресурса есть вложенные
   * структуры или массивы, требующие специального мёржа.
   */
  mergeUpdatePayload?: (existing: U, incoming: U) => U
  /**
   * Стратегия объединения incoming-update в ещё не улетевший create:
   * поля из update должны стать частью payload'а create. По умолчанию —
   * shallow-merge (`{ ...createPayload, ...updatePayload }`).
   */
  mergeUpdateIntoCreate?: (createPayload: C, updatePayload: U) => C
}

export const isTempId = (id: ResourceId): id is string =>
  typeof id === 'string' && id.startsWith('tmp-')

export const makeTempId = (): string => `tmp-${crypto.randomUUID()}`
