<!-- src/components/common/ConfirmModal.vue -->

<script setup>
defineProps({
  show: Boolean,
  title: {
    type: String,
    default: '请确认操作',
  },
  message: {
    type: String,
    default: '此操作不可逆，您确定要继续吗？',
  },
  confirmText: {
    type: String,
    default: '确认',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
});

// ✨ FIX: Kept 'emit' and created explicit handlers to use it, satisfying ESLint.
const emit = defineEmits(['close', 'confirm']);

function handleClose() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<template>
  <transition name="modal-fade">
    <!-- ✨ UPDATED: The @click.self now calls the new handler function -->
    <div v-if="show" class="modal-backdrop" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <!-- ✨ UPDATED: Buttons now call the new handler functions -->
          <button @click="handleClose" class="btn btn-secondary">{{ cancelText }}</button>
          <button @click="handleConfirm" class="btn btn-danger">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
/* All styles remain the same. The change is purely in the script logic. */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-backdrop {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex; justify-content: center; align-items: center;
  z-index: 3000;
}
.modal-container {
  background-color: #1e1e1e;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 90%; max-width: 450px;
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  margin-bottom: 1rem;
}
.modal-title {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin: 0 0 0.75rem;
}
.modal-message {
  color: var(--color-text-dark);
  line-height: 1.6;
  margin: 0 0 2rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
}
.btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &.btn-secondary {
    background-color: #3a3a3a;
    color: var(--color-text);
    &:hover { background-color: #4a4a4a; }
  }
  &.btn-danger {
    background-color: #ef4444;
    color: #ffffff;
    &:hover { background-color: #dc2626; }
  }
}
</style>
