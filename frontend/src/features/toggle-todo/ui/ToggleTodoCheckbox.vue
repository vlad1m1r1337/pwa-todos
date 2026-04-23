<script setup lang="ts">
import { useTodosStore, type LocalTodo } from '@/entities/todo';

const props = defineProps<{ todo: LocalTodo }>();
const store = useTodosStore();

function onChange(e: Event) {
  const value = (e.target as HTMLInputElement).checked;
  store.updateItem(props.todo.id, { is_completed: value });
}
</script>

<template>
  <input
    class="checkbox"
    type="checkbox"
    :checked="todo.is_completed"
    aria-label="Выполнено"
    @change="onChange"
  />
</template>

<style scoped>
.checkbox {
  flex: 0 0 auto;
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  cursor: pointer;
  vertical-align: middle;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface);
  accent-color: var(--accent);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.checkbox:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
}

.checkbox:focus {
  outline: none;
}

.checkbox:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}
</style>
