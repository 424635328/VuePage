<!-- src/components/global/ConfirmDialog.vue -->

<template>
  <transition name="confirm-fade">
    <div v-if="isShowing" class="confirm-overlay" @click.self="handleCancel">
      <div class="confirm-dialog">
        <div class="confirm-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="confirm-body">
          <p>{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button @click="handleCancel" class="btn btn-secondary">
            {{ cancelText }}
          </button>
          <button @click="handleConfirm" class="btn btn-danger">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useConfirm } from '@/composables/useConfirm'

// 从 composable 获取所有需要的数据和方法
const {
  isShowing,
  title,
  message,
  confirmText,
  cancelText,
  handleConfirm,
  handleCancel
} = useConfirm()
</script>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #2a2a2e;
  border: 1px solid #444;
  border-radius: 8px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.confirm-header {
  padding: 1.25rem;
  border-bottom: 1px solid #444;
  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #e0e0e0;
  }
}

.confirm-body {
  padding: 1.5rem 1.25rem;
  p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    color: #c0c0c0;
  }
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  background-color: #202023;
  border-top: 1px solid #444;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: #4f4f5a;
  color: #fff;
  &:hover {
    background-color: #666672;
  }
}

.btn-danger {
  background-color: #e53935;
  color: #fff;
  &:hover {
    background-color: #f44336;
    box-shadow: 0 0 10px rgba(229, 57, 53, 0.5);
  }
}

// Transition Animations
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.3s ease;
}
.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  transform: scale(0.9);
}
</style>
