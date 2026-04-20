<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import PWABadge from './components/PWABadge.vue'
import { useTodosStore } from './stores/todos'

const store = useTodosStore()
const { items, loading, error, isOnline, pendingCount } = storeToRefs(store)

const draft = ref('')
const editingId = ref<number | string | null>(null)
const editText = ref('')

const canAdd = computed(() => draft.value.trim().length > 0)

function onAdd() {
  if (!canAdd.value) return
  const text = draft.value
  draft.value = ''
  store.addTodo(text)
}

function startEdit(todo: { id: number | string; text: string }) {
  editingId.value = todo.id
  editText.value = todo.text
}

function cancelEdit() {
  editingId.value = null
  editText.value = ''
}

function saveEdit() {
  if (editingId.value === null) return
  const text = editText.value.trim()
  if (!text) return
  const id = editingId.value
  editingId.value = null
  store.updateTodo(id, { text })
}

function onEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    saveEdit()
  }
  if (e.key === 'Escape') cancelEdit()
}

function toggleCompleted(id: number | string, value: boolean) {
  store.updateTodo(id, { is_completed: value })
}

function remove(id: number | string) {
  if (editingId.value === id) cancelEdit()
  store.removeTodo(id)
}

</script>

<template>
  <div class="app">
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

    <form class="add" @submit.prevent="onAdd">
      <input
        v-model="draft"
        class="input"
        type="text"
        autocomplete="off"
        placeholder="Новое дело…"
        aria-label="Текст новой задачи"
      />
      <button type="submit" class="btn primary" :disabled="!canAdd">Добавить</button>
    </form>

    <p v-if="error" class="error" role="alert">
      {{ error }}
      <button type="button" class="btn ghost error-close" @click="store.clearError()">×</button>
    </p>

    <ul class="list" aria-label="Список задач">
      <li v-for="todo in items" :key="todo.id" class="row">
        <template v-if="editingId === todo.id">
          <input
            v-model="editText"
            class="input grow"
            type="text"
            aria-label="Редактирование задачи"
            @keydown="onEditKeydown"
          />
          <input
            class="checkbox"
            type="checkbox"
            :checked="todo.is_completed"
            @change="toggleCompleted(todo.id, ($event.target as HTMLInputElement).checked)"
            aria-label="Выполнено"
          />
          <div class="actions">
            <button type="button" class="btn" @click="saveEdit">Сохранить</button>
            <button type="button" class="btn ghost" @click="cancelEdit">Отмена</button>
          </div>
        </template>
        <template v-else>
          <span class="text" :class="{ done: todo.is_completed }">{{ todo.text }}</span>
          <input
            class="checkbox"
            type="checkbox"
            :checked="todo.is_completed"
            @change="toggleCompleted(todo.id, ($event.target as HTMLInputElement).checked)"
            aria-label="Выполнено"
          />
          <div class="actions">
            <button type="button" class="btn" @click="startEdit(todo)">Изменить</button>
            <button type="button" class="btn danger" @click="remove(todo.id)">Удалить</button>
          </div>
        </template>
      </li>
    </ul>

    <p v-if="!loading && items.length === 0" class="empty">Пока нет задач</p>
    <p v-else-if="loading && items.length === 0" class="empty">Загрузка…</p>

    <PWABadge />
  </div>
</template>

<style scoped>
.app {
  width: min(100%, 28rem);
  margin: 0 auto;
  text-align: left;
}

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

.input.grow {
  flex: 1;
}

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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
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

.btn.danger {
  border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
  color: var(--danger);
  background: transparent;
}

.btn.danger:hover:not(:disabled) {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}

.btn.ghost {
  background: transparent;
}

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

.text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  font-size: 0.9375rem;
  line-height: 1.4;
}

.text.done {
  text-decoration: line-through;
  opacity: 0.55;
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

.error-close {
  margin-left: auto;
  padding: 0 0.4rem;
  font-size: 1rem;
  line-height: 1;
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
