import axios from 'axios';
import type { ResourceId } from './types';

/** Отсутствие ответа от сервера трактуем как "нет сети / сервер недоступен". */
export function isNetworkError(e: unknown): boolean {
  return axios.isAxiosError(e) && !e.response;
}

export function formatError(
  e: unknown,
  fallback = 'Не удалось выполнить запрос',
): string {
  if (axios.isAxiosError(e) && e.response) {
    return `Ошибка ${e.response.status}: ${e.response.statusText}`;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export const isTempId = (id: ResourceId): id is string =>
  typeof id === 'string' && id.startsWith('tmp-');

export const makeTempId = (): string => `tmp-${crypto.randomUUID()}`;

export function isIdExists<T extends { id: ResourceId }>(
  id: ResourceId,
  items: T[],
): boolean {
  return items.some((item) => item.id === id);
}
