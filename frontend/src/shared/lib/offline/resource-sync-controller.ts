import { registerResource, useSyncQueueStore } from './sync-queue';
import { isIdExists, isTempId, makeTempId } from './utils';
import type { LocalResourceStore } from './local-resource-store';
import type {
  ResourceAdapter,
  ResourceApi,
  ResourceId,
  SyncEvent,
} from './types';

interface ControllerOptions<T extends { id: ResourceId }, C, U> {
  /** Имя ресурса. Совпадает с ключом в реестре адаптеров и в очереди. */
  name: string;
  api: ResourceApi<T, C, U>;
  /** Конструирует оптимистичную запись по payload'у create. */
  makeOptimistic: (payload: C, tempId: string) => T;
  /**
   * Доступ к локальному стору. Передаётся как thunk, чтобы Pinia мог
   * быть ещё не установлен на момент создания контроллера.
   */
  getLocalStore: () => LocalResourceStore<T>;
}

/**
 * Класс, отвечающий за «удалённую» половину ресурса:
 * перевод пользовательских действий в операции `sync-queue`,
 * мердж серверного списка с локальными оптимистичными записями
 * и применение событий синхронизации к локальному стору.
 *
 * Ничего не знает про конкретную реализацию локального хранилища,
 * кроме контракта `LocalResourceStore<T>`. Это разрывает связность
 * между ресурсным стором и `useSyncQueueStore`.
 */
export class ResourceSyncController<T extends { id: ResourceId }, C, U> {
  readonly adapter: ResourceAdapter<T, C, U>;
  private readonly options: ControllerOptions<T, C, U>;

  constructor(options: ControllerOptions<T, C, U>) {
    this.options = options;
    this.adapter = {
      name: options.name,
      api: options.api,
      onSynced: (event) => this.applySynced(event),
      onRollback: (op) => {
        if (op.kind === 'create') {
          this.local.removeById(op.tempId);
        }
      },
      refetch: () => this.fetchAll(),
    };
  }

  /** Регистрирует адаптер в едином реестре `sync-queue`. */
  register(): void {
    registerResource(this.adapter as unknown as ResourceAdapter);
  }

  async fetchAll(): Promise<void> {
    const local = this.local;
    local.setLoading(true);
    try {
      const data = await this.options.api.list();
      const pending = local.items.filter((t) => isTempId(t.id));
      local.setAll([...data, ...pending]);
    } catch (e) {
      this.queue.reportError(e);
    } finally {
      local.setLoading(false);
    }
  }

  addItem(payload: C): void {
    const tempId = makeTempId();
    this.local.append(this.options.makeOptimistic(payload, tempId));
    this.queue.enqueue({
      id: crypto.randomUUID(),
      resource: this.options.name,
      kind: 'create',
      tempId,
      payload,
    });
  }

  updateItem(id: ResourceId, patch: U): void {
    if (!isIdExists(id, this.local.items)) return;
    this.local.patchById(id, patch as unknown as Partial<T>);
    this.queue.enqueue({
      id: crypto.randomUUID(),
      resource: this.options.name,
      kind: 'update',
      targetId: id,
      payload: patch,
    });
  }

  removeItem(id: ResourceId): void {
    if (!isIdExists(id, this.local.items)) return;
    this.local.removeById(id);
    this.queue.enqueue({
      id: crypto.randomUUID(),
      resource: this.options.name,
      kind: 'delete',
      targetId: id,
    });
  }

  private applySynced(event: SyncEvent<T>): void {
    if (event.kind === 'create') {
      this.local.replaceById(event.tempId, event.item);
    } else if (event.kind === 'update') {
      this.local.replaceById(event.targetId, event.item);
    }
  }

  private get local(): LocalResourceStore<T> {
    return this.options.getLocalStore();
  }

  private get queue() {
    return useSyncQueueStore();
  }
}
