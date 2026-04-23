<script setup lang="ts">
import { ref } from 'vue';
import { useTodosStore, type LocalTodo } from '@/entities/todo';

const props = defineProps<{ todo: LocalTodo }>();
const emit = defineEmits<{ done: [] }>();

const store = useTodosStore();
const text = ref(props.todo.text);

function save() {
  const trimmed = text.value.trim();
  if (!trimmed) return;
  store.updateItem(props.todo.id, { text: trimmed });
  emit('done');
}

function cancel() {
  emit('done');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    save();
  }
  if (e.key === 'Escape') cancel();
}
</script>

<template>
  <input
    v-model="text"
    class="input grow"
    type="text"
    aria-label="Редактирование задачи"
    @keydown="onKeydown"
  />
  <div class="actions">
    <button type="button" class="btn" @click="save">Сохранить</button>
    <button type="button" class="btn ghost" @click="cancel">Отмена</button>
  </div>
</template>

<style scoped>
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

.input.grow {
  flex: 1;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

.actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
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

.btn:hover:not(:disabled) {
  border-color: var(--accent);
}

.btn.ghost {
  background: transparent;
}
</style>
