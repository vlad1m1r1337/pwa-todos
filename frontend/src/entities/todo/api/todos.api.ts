import { api } from '@/shared/api';
import type { ResourceApi, ResourceId } from '@/shared/lib/storeFabric';
import type { Todo, TodoCreate, TodoUpdate } from '../model/types';

export const todosApi: ResourceApi<Todo, TodoCreate, TodoUpdate> = {
  list: () => api.get<Todo[]>('/todos/').then((r) => r.data),
  create: (payload) => api.post<Todo>('/todos/', payload).then((r) => r.data),
  update: (id: ResourceId, payload) =>
    api.patch<Todo>(`/todos/${id}/`, payload).then((r) => r.data),
  remove: (id: ResourceId) => api.delete(`/todos/${id}/`).then(() => undefined),
};
