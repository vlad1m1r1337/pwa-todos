<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTodosStore } from '@/entities/todo';

const store = useTodosStore();
const draft = ref('');
const canAdd = computed(() => draft.value.trim().length > 0);

function onAdd() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = '';
  store.addItem({ text, is_completed: false });
}
</script>

<template>
  <form class="add" @submit.prevent="onAdd">
    <input
      v-model="draft"
      class="input"
      type="text"
      autocomplete="off"
      placeholder="Новое дело…"
      aria-label="Текст новой задачи"
    />
    <button type="submit" class="btn primary" :disabled="!canAdd">
      Добавить
    </button>
  </form>
</template>

<style scoped>
.add {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
  background: var(--surface);
  color: inherit;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

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

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.btn.primary:hover:not(:disabled) {
  filter: brightness(1.05);
}
</style>
