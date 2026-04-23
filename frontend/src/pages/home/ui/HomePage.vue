<script setup lang="ts">
import { AppHeader } from '@/widgets/app-header';
import { ErrorBanner } from '@/widgets/error-banner';
import { TodoList } from '@/widgets/todo-list';
import { PWABadge } from '@/widgets/pwa-badge';
import { CreateTodoForm } from '@/features/create-todo';
</script>

<template>
  <div class="app">
    <AppHeader />
    <CreateTodoForm />
    <ErrorBanner />
    <TodoList />
    <PWABadge />
  </div>
</template>

<style scoped>
.app {
  width: min(100%, 28rem);
  margin: 0 auto;
  text-align: left;
}
</style>
