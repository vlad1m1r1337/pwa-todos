<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTodosStore, TodoCard } from '@/entities/todo'
import { ToggleTodoCheckbox } from '@/features/toggle-todo'
import { DeleteTodoButton } from '@/features/delete-todo'
import { EditTodoForm } from '@/features/edit-todo'

const store = useTodosStore()
const { items, loading } = storeToRefs(store)

const editingId = ref<number | string | null>(null)

function startEdit(id: number | string) {
  editingId.value = id
}

function stopEdit() {
  editingId.value = null
}
</script>

<template>
  <ul class="list" aria-label="Список задач">
    <li v-for="todo in items" :key="todo.id" class="row">
      <template v-if="editingId === todo.id">
        <EditTodoForm :todo="todo" @done="stopEdit" />
        <ToggleTodoCheckbox :todo="todo" />
      </template>
      <template v-else>
        <TodoCard :todo="todo" />
        <ToggleTodoCheckbox :todo="todo" />
        <div class="actions">
          <button type="button" class="btn" @click="startEdit(todo.id)">
            Изменить
          </button>
          <DeleteTodoButton :id="todo.id" />
        </div>
      </template>
    </li>
  </ul>

  <p v-if="!loading && items.length === 0" class="empty">Пока нет задач</p>
  <p v-else-if="loading && items.length === 0" class="empty">Загрузка…</p>
</template>

<style scoped>
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.6rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.empty {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  opacity: 0.55;
  text-align: center;
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
</style>
