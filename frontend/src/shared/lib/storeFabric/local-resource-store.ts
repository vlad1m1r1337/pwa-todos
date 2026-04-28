import { defineStore } from 'pinia';
import { ref, computed, type Ref } from 'vue';
import { idbStorage } from '@/shared/lib/storage';
import type { ResourceId } from './types';

/**
 * Контракт чисто локального стора ресурса. Описан отдельно, чтобы
 * sync-контроллер мог зависеть только от мутаторов, а не от Pinia.
 */
export interface LocalResourceStore<T extends { id: ResourceId }> {
  items: T[];
  loading: boolean;
  count: number;
  setLoading: (value: boolean) => void;
  setAll: (next: T[]) => void;
  append: (item: T) => void;
  patchById: (id: ResourceId, patch: Partial<T>) => void;
  replaceById: (id: ResourceId, item: T) => void;
  removeById: (id: ResourceId) => void;
}

/**
 * Фабрика «локального» Pinia-стора ресурса.
 *
 * Хранит только `items`, `loading` и предоставляет нейтральные мутаторы
 * (никаких знаний про сеть, очередь синхронизации или оптимистичные id).
 * Persist в IndexedDB ограничен полем `items`.
 */
export function createLocalResourceStore<T extends { id: ResourceId }>(
  name: string,
) {
  return defineStore(
    name,
    () => {
      const items = ref<T[]>([]) as Ref<T[]>;
      const loading = ref(false);
      const count = computed(() => items.value.length);

      function setLoading(value: boolean): void {
        loading.value = value;
      }

      function setAll(next: T[]): void {
        items.value = next;
      }

      function append(item: T): void {
        items.value.push(item);
      }

      function patchById(id: ResourceId, patch: Partial<T>): void {
        const item = items.value.find((t) => t.id === id);
        if (item) Object.assign(item, patch);
      }

      function replaceById(id: ResourceId, item: T): void {
        const idx = items.value.findIndex((t) => t.id === id);
        if (idx !== -1) items.value[idx] = item;
      }

      function removeById(id: ResourceId): void {
        const idx = items.value.findIndex((t) => t.id === id);
        if (idx !== -1) items.value.splice(idx, 1);
      }

      return {
        items,
        loading,
        count,
        setLoading,
        setAll,
        append,
        patchById,
        replaceById,
        removeById,
      };
    },
    {
      persist: {
        key: name,
        storage: idbStorage,
        pick: ['items'],
      },
    },
  );
}
