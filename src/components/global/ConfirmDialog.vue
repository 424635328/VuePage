<!-- src/components/global/ConfirmDialog.vue -->
<template>
  <transition name="confirm-fade" @after-leave="onAfterLeave">
    <div
      v-if="isShowing"
      class="confirm-overlay"
      @click.self="handleCancel"
      @keydown="handleKeydown"
      tabindex="-1"
      ref="overlayEl"
    >
      <div
        class="confirm-dialog"
        :class="{ 'is-danger': type === 'danger' }"
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div class="confirm-header">
          <div class="icon-wrapper">
            <!-- 动态图标 -->
            <component :is="iconComponent" aria-hidden="true" />
          </div>
          <h3 id="confirm-title">{{ title }}</h3>
        </div>
        <div class="confirm-body">
          <!-- 使用 v-html 以支持消息中的简单 HTML 标签 -->
          <p id="confirm-message" v-html="message"></p>
        </div>
        <div class="confirm-footer">
          <button @click="handleCancel" class="btn btn-secondary" ref="cancelButton">
            {{ cancelText }}
          </button>
          <button @click="handleConfirm" class="btn btn-primary" ref="confirmButton">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { nextTick, ref, watch, computed } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

// --- Icon components (for dynamic rendering) ---
const ExclamationTriangleIcon = {
  name: 'ExclamationTriangleIcon',
  template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`
}
const InformationCircleIcon = {
  name: 'InformationCircleIcon',
  template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.02c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.02zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`
}

// --- State and Refs ---
const { isShowing, title, message, confirmText, cancelText, type, handleConfirm, handleCancel, onAfterLeave } = useConfirm()
const overlayEl = ref(null)
const dialogEl = ref(null)
const confirmButton = ref(null)
const lastActiveElement = ref(null)

// --- Dynamic Icon (FIXED) ---
const iconComponent = computed(() => {
  switch (type.value) {
    case 'danger':
      // 直接返回组件对象，不要用 ref 包裹
      return ExclamationTriangleIcon
    case 'info':
    default:
      // 直接返回组件对象，不要用 ref 包裹
      return InformationCircleIcon
  }
})

// --- Focus Trap Logic ---
const focusTrap = (event) => {
  if (event.key !== 'Tab' || !dialogEl.value) return

  const focusableElements = dialogEl.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) { // Shift + Tab
    if (document.activeElement === firstElement) {
      lastElement.focus()
      event.preventDefault()
    }
  } else { // Tab
    if (document.activeElement === lastElement) {
      firstElement.focus()
      event.preventDefault()
    }
  }
}

// --- Keyboard Handler ---
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    handleCancel()
  }
  focusTrap(event)
}

// --- Lifecycle & Watchers ---
watch(isShowing, (newValue) => {
  if (newValue) {
    lastActiveElement.value = document.activeElement
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      overlayEl.value?.focus()
      confirmButton.value?.focus()
    })
  } else {
    document.body.style.overflow = ''
    lastActiveElement.value?.focus()
  }
})
</script>

<style scoped lang="scss">
/* 样式已根据你的截图进行微调，并修复了主题化逻辑 */
.confirm-overlay {
  --confirm-bg: #ffffff;
  --confirm-overlay-bg: rgba(10, 10, 10, 0.4);
  --confirm-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --confirm-text-primary: #111827;
  --confirm-text-secondary: #4b5563;
  --confirm-border-radius: 1rem; // 16px
  --confirm-transition-duration: 0.3s;

  /* 默认/信息 类型的主题色 */
  --icon-bg-color: #e0e7ff;
  --icon-fg-color: #6366f1; /* 紫色 */
  --btn-primary-bg: #6366f1; /* 紫色 */
  --btn-primary-hover-bg: #4f46e5;
  --btn-primary-focus-ring: rgba(99, 102, 241, 0.6);

  position: fixed;
  inset: 0;
  background-color: var(--confirm-overlay-bg);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
  outline: none;
}

/* 危险 类型的样式覆盖 */
.confirm-dialog.is-danger {
  --icon-bg-color: #fee2e2;
  --icon-fg-color: #ef4444; /* 红色 */
  --btn-primary-bg: #ef4444; /* 红色 */
  --btn-primary-hover-bg: #dc2626;
  --btn-primary-focus-ring: rgba(220, 38, 38, 0.6);
}

.confirm-dialog {
  background: var(--confirm-bg);
  border-radius: var(--confirm-border-radius);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--confirm-shadow);
  display: flex;
  flex-direction: column;
  text-align: center;
  overflow: hidden;
}

.confirm-header {
  padding: 1.75rem 1.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  .icon-wrapper {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: var(--icon-bg-color);

    svg {
      width: 32px;
      height: 32px;
      color: var(--icon-fg-color);
    }
  }

  h3 {
    margin: 0;
    font-size: 1.5rem; // 24px
    font-weight: 700;
    color: var(--confirm-text-primary);
  }
}

.confirm-body {
  padding: 0.5rem 1.75rem 1.75rem;
  p {
    margin: 0;
    font-size: 1rem; // 16px
    line-height: 1.6;
    color: var(--confirm-text-secondary);
  }
}

.confirm-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem; // 12px
  padding: 0 1.5rem 1.5rem;
}

.btn {
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.5rem; // 8px
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--btn-primary-focus-ring);
    outline-offset: 2px;
  }
}

.btn-secondary {
  background-color: #ffffff;
  color: #374151;
  border-color: #d1d5db;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

  &:hover {
    background-color: #f9fafb;
  }
}

.btn-primary {
  background-color: var(--btn-primary-bg);
  color: #fff;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

  &:hover {
    background-color: var(--btn-primary-hover-bg);
  }
}

// Transitions
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity var(--confirm-transition-duration) ease-in-out;
}
.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: all var(--confirm-transition-duration) cubic-bezier(0.4, 0, 0.2, 1);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
</style>
