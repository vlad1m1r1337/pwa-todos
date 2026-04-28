import axios from 'axios';

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
