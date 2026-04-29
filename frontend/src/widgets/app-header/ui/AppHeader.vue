<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSyncQueueStore } from '@/shared/lib/apiSyncQueue/sync-queue';

const sync = useSyncQueueStore();
const { isOnline, pendingCount } = storeToRefs(sync);
</script>

<template>
  <header class="head">
    <h1 class="title">Задачи</h1>
    <p class="sub">Добавляйте, редактируйте и удаляйте дела</p>
    <div class="status">
      <span class="dot" :class="{ online: isOnline, offline: !isOnline }" />
      <span class="status-text">
        {{ isOnline ? 'Онлайн' : 'Оффлайн' }}
      </span>
      <span v-if="pendingCount > 0" class="pending">
        · в очереди: {{ pendingCount }}
      </span>
    </div>
  </header>
</template>

<style scoped>
.head {
  margin-bottom: 1.25rem;
}

.title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  opacity: 0.65;
}

.status {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  opacity: 0.75;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--border);
}

.dot.online {
  background: #22c55e;
}

.dot.offline {
  background: var(--danger);
}

.pending {
  opacity: 0.8;
}
</style>
