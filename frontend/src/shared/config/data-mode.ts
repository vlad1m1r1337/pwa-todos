export type DataMode = 'offline' | 'online';

const rawMode = import.meta.env.VITE_DATA_MODE;

export const DATA_MODE: DataMode = rawMode === 'online' ? 'online' : 'offline';

export const isOfflineMode = DATA_MODE === 'offline';
