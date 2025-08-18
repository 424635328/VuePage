<!-- src/components/GlobalRedirectingTip.vue -->

<template>
  <transition name="tip-slide-fade">
    <div v-if="uiStore.isRedirecting" class="redirect-tip-container">
      <div class="tip-box" :class="statusClass">

        <!-- 使用带 mode="out-in" 的 transition 来实现图标的平滑切换 -->
        <transition name="icon-swap" mode="out-in">
          <div class="icon-wrapper" :key="uiStore.redirectStatus">
            <!-- 加载中状态 -->
            <div v-if="uiStore.redirectStatus === 'loading'" class="spinner"></div>
            <!-- 成功状态 -->
            <svg v-else-if="uiStore.redirectStatus === 'success'" class="icon success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <!-- 失败状态 -->
            <svg v-else-if="uiStore.redirectStatus === 'error'" class="icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </div>
        </transition>

        <p class="message">{{ uiStore.redirectMessage }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';

const uiStore = useUiStore();

// 根据状态返回不同的 CSS 类，用于添加状态辉光效果
const statusClass = computed(() => {
  return {
    'is-success': uiStore.redirectStatus === 'success',
    'is-error': uiStore.redirectStatus === 'error',
  };
});
</script>

<style scoped>
/*
 * 容器负责定位在屏幕顶部中央。
 * 我们使用 left: 50% 和 transform: translateX(-50%) 的经典组合来实现水平居中。
*/
.redirect-tip-container {
  position: fixed;
  top: 20px; /* 与顶部的距离 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  /* 确保即使内容换行，也不会影响居中 */
  display: flex;
  justify-content: center;
}

.tip-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.75rem;
  border-radius: 12px;

  /* 赛博朋克风格核心：半透明背景、辉光边框和阴影 */
  background: rgba(30, 30, 45, 0.7);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  border: 1px solid rgba(122, 122, 200, 0.4);
  box-shadow:
    0 0 25px rgba(0, 200, 255, 0.1),
    0 4px 15px rgba(0, 0, 0, 0.3);

  color: #e0e0e0;
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}

/* 成功状态的辉光效果 */
.tip-box.is-success {
  border-color: rgba(0, 255, 155, 0.6);
  box-shadow:
    0 0 25px rgba(0, 255, 155, 0.3),
    0 4px 15px rgba(0, 0, 0, 0.3);
}

/* 失败状态的辉光效果 */
.tip-box.is-error {
  border-color: rgba(255, 59, 95, 0.6);
  box-shadow:
    0 0 25px rgba(255, 59, 95, 0.3),
    0 4px 15px rgba(0, 0, 0, 0.3);
}

.message {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap; /* 防止消息过长时换行 */
}

/* 图标容器，固定尺寸以防止切换时布局跳动 */
.icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 24px;
  height: 24px;
}
.icon.success {
  fill: #00ff9b;
}
.icon.error {
  fill: #ff3b5f;
}

/* 加载动画 */
.spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(0, 255, 255, 0.3);
  border-top-color: #00ffff; /* 使用项目主色调 */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/*
 * 主要动画：整个提示框从顶部滑入并淡入
 * 注意 transform 中同时保留了 translateX(-50%) 以维持居中
*/
.tip-slide-fade-enter-active,
.tip-slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.tip-slide-fade-enter-from,
.tip-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%) translateX(-50%);
}

/*
 * 次要动画：图标状态切换时的淡入淡出和缩放效果
*/
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: all 0.2s ease-in-out;
}
.icon-swap-enter-from,
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
