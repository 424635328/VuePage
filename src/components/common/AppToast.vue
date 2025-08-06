<!-- src/components/common/AppToast.vue -->
<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const { message, type, visible } = storeToRefs(toastStore)
</script>

<template>
  <transition name="toast-fade">
    <div v-if="visible" class="toast-wrapper" :class="[type]">
      <div class="toast-icon">
        <!-- Success Icon -->
        <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <!-- Error Icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      </div>
      <p class="toast-message">{{ message }}</p>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.toast-wrapper {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  color: #ffffff;
  font-weight: 500;

  &.success {
    background-color: #2e7d32; // Green
  }
  &.error {
    background-color: #d32f2f; // Red
  }
}

.toast-icon {
  width: 20px;
  height: 20px;
  margin-right: 0.75rem;

  svg {
    width: 100%;
    height: 100%;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
