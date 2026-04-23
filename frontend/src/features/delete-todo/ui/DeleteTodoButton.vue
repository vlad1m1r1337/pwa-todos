<script setup lang="ts">
import { useTodosStore } from '@/entities/todo';

const props = defineProps<{ id: number | string }>();
const store = useTodosStore();

function onClick() {
  store.removeItem(props.id);
}
</script>

<template>
  <button type="button" class="btn danger" @click="onClick">Удалить</button>
</template>

<style scoped>
.btn {
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
  font-size: 0.8125rem;
  background: var(--surface-2);
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.btn.danger {
  border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
  color: var(--danger);
  background: transparent;
}

.btn.danger:hover:not(:disabled) {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}
</style>
