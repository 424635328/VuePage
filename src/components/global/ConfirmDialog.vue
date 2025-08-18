<!-- src/components/global/ConfirmDialog.vue -->

<template>
  <transition name="confirm-fade">
    <div
      v-if="isShowing"
      class="confirm-overlay"
      @click.self="handleCancel"
      @keydown.escape.prevent="handleCancel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div class="confirm-dialog" ref="dialogEl">
        <div class="confirm-header">
          <!-- 添加一个视觉图标，增强提示性 -->
          <div class="icon-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 id="confirm-title">{{ title }}</h3>
        </div>
        <div class="confirm-body">
          <p id="confirm-message">{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button @click="handleCancel" class="btn btn-secondary">
            {{ cancelText }}
          </button>
          <button @click="handleConfirm" class="btn btn-danger" ref="confirmButton">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

// 从 composable 获取数据和方法
const {
  isShowing,
  title,
  message,
  confirmText,
  cancelText,
  handleConfirm,
  handleCancel
} = useConfirm()

const dialogEl = ref(null)
const confirmButton = ref(null)

// 监听 isShowing 变化
watch(isShowing, (newValue) => {
  if (newValue) {
    // 当对话框显示时，将焦点设置到确认按钮上，提升键盘操作体验
    nextTick(() => {
      confirmButton.value?.focus()
    })
  }
})

// 添加键盘事件监听，允许按 Esc 关闭
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isShowing.value) {
    handleCancel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
// 使用 CSS 变量来管理设计系统，方便维护和主题切换
:root {
  --confirm-bg: #2c2c34;
  --confirm-overlay-bg: rgba(18, 18, 22, 0.8);
  --confirm-border-color: rgba(255, 255, 255, 0.1);
  --confirm-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  --confirm-text-primary: #f0f0f0;
  --confirm-text-secondary: #a0a0b0;
  --confirm-icon-bg: rgba(220, 38, 38, 0.1);
  --confirm-icon-color: #ef4444;
  --confirm-danger-bg: #e53935;
  --confirm-danger-hover-bg: #c62828;
  --confirm-danger-shadow: 0 4px 14px 0 rgba(229, 57, 53, 0.38);
  --confirm-secondary-bg: #4f4f5a;
  --confirm-secondary-hover-bg: #666672;
  --confirm-border-radius: 12px;
  --confirm-transition-duration: 0.3s;
}

.confirm-overlay {
  position: fixed;
  inset: 0; // 等价于 top, right, bottom, left = 0
  background-color: var(--confirm-overlay-bg);
  backdrop-filter: blur(4px); // 添加毛玻璃效果，更具现代感
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
}

.confirm-dialog {
  background: var(--confirm-bg);
  border-radius: var(--confirm-border-radius);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--confirm-shadow);
  display: flex;
  flex-direction: column;
  text-align: center; // 内容居中，更符合弹窗的视觉焦点
  overflow: hidden; // 确保子元素不会超出圆角
}

.confirm-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  .icon-wrapper {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--confirm-icon-bg);

    svg {
      width: 24px;
      height: 24px;
      color: var(--confirm-icon-color);
    }
  }

  h3 {
    margin: 0;
    font-size: 1.375rem; // 稍微增大字号
    font-weight: 700; // 加粗
    color: var(--confirm-text-primary);
  }
}

.confirm-body {
  padding: 1rem 1.75rem 1.5rem;
  p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--confirm-text-secondary);
  }
}

.confirm-footer {
  display: grid; // 使用 grid 布局，轻松实现等宽按钮
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--confirm-transition-duration) cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none; // 移除默认 outline

  // 添加 focus 状态，提升键盘操作的可见性
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.6);
  }
}

.btn-secondary {
  background-color: var(--confirm-secondary-bg);
  color: #fff;

  &:hover {
    background-color: var(--confirm-secondary-hover-bg);
    transform: translateY(-2px); // 添加轻微的上浮效果
  }
}

.btn-danger {
  background-color: var(--confirm-danger-bg);
  color: #fff;

  &:hover {
    background-color: var(--confirm-danger-hover-bg);
    transform: translateY(-2px);
    box-shadow: var(--confirm-danger-shadow);
  }
}

// 优化后的过渡动画
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity var(--confirm-transition-duration) ease;
}
.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  // 同时应用 transform 和 opacity 动画
  transition: all var(--confirm-transition-duration) cubic-bezier(0.25, 0.8, 0.25, 1);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  // 结合 scale 和 translateY，动画效果更生动
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
