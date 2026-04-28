<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSyncQueueStore } from '@/shared/lib/storeFabric';

const sync = useSyncQueueStore();
const { error } = storeToRefs(sync);
</script>

<template>
  <p v-if="error" class="error" role="alert">
    {{ error }}
    <button
      type="button"
      class="btn ghost error-close"
      @click="sync.clearError()"
    >
      ×
    </button>
  </p>
</template>

<style scoped>
.error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--danger) 45%, var(--border));
  border-radius: 6px;
  font-size: 0.8125rem;
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}

.btn {
  padding: 0.5rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font: inherit;
  font-size: 0.8125rem;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.btn.ghost {
  background: transparent;
}

.error-close {
  margin-left: auto;
  padding: 0 0.4rem;
  font-size: 1rem;
  line-height: 1;
}
</style>
