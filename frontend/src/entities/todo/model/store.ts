import { createResourceStore } from '@/shared/lib/offline';
import { todosApi } from '../api/todos.api';
import type { LocalTodo, TodoCreate, TodoUpdate } from './types';

/**
 * Стор todos — тонкая обёртка над фабрикой ресурса. Отвечает только за
 * локальные элементы и их маппинг в оптимистичные записи. Всю логику
 * offline/online синхронизации предоставляет `shared/lib/offline`.
 */
export const useTodosStore = createResourceStore<
  LocalTodo,
  TodoCreate,
  TodoUpdate
>({
  name: 'todos',
  api: todosApi,
  makeOptimistic: (payload, tempId) => ({ id: tempId, ...payload }),
});
