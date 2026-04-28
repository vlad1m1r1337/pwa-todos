import type { ResourceId } from './types';

export const isTempId = (id: ResourceId): id is string =>
  typeof id === 'string' && id.startsWith('tmp-');

export const makeTempId = (): string => `tmp-${crypto.randomUUID()}`;

export function isIdExists<T extends { id: ResourceId }>(
  id: ResourceId,
  items: T[],
): boolean {
  return items.some((item) => item.id === id);
}
