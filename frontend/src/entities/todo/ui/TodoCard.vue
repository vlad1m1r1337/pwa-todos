<script setup lang="ts">
import type { LocalTodo } from '../model/types';

defineProps<{ todo: LocalTodo }>();
</script>

<template>
  <span class="text" :class="{ done: todo.is_completed }">{{ todo.text }}</span>
</template>

<style scoped>
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
</style>
