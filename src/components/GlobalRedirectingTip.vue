<!-- src/components/GlobalRedirectingTip.vue -->

<template>
  <transition name="tip-slide-fade">
    <div v-if="uiStore.isRedirecting" class="redirect-tip-container">
      <!--
        使用 :key 来强制 Vue 在状态改变时重新渲染整个 .tip-box 元素。
        这使得我们可以通过 CSS 的 animation 轻松触发一个状态变更时的微动效。
      -->
      <div class="tip-box" :key="uiStore.redirectStatus" :style="glowStyle">
        <!-- 背景纹理层 -->
        <div class="tip-texture"></div>

        <!-- 流光边框层 - 现在包含两层流光 -->
        <div class="tip-border"></div>

        <!-- 内容层 -->
        <div class="tip-content">
          <transition name="icon-swap" mode="out-in">
            <div class="icon-wrapper" :key="uiStore.redirectStatus">
              <div v-if="uiStore.redirectStatus === 'loading'" class="spinner"></div>
              <svg v-else-if="uiStore.redirectStatus === 'success'" class="icon success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              <svg v-else-if="uiStore.redirectStatus === 'error'" class="icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </div>
          </transition>
          <p class="message">{{ uiStore.redirectMessage }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';

const uiStore = useUiStore();

const glowStyle = computed(() => {
  let colorRgb;
  switch (uiStore.redirectStatus) {
    case 'success':
      colorRgb = '70, 255, 155'; // 亮绿色
      break;
    case 'error':
      colorRgb = '255, 75, 95'; // 亮红色
      break;
    default: // 'loading'
      colorRgb = '0, 225, 255'; // 青色
      break;
  }
  return {
    '--glow-color-rgb': colorRgb,
    '--glow-color': `rgb(${colorRgb})`
  };
});
</script>

<style scoped>
/*
  为父容器设置 perspective，为子元素的 3D transform 动画提供透视效果。
  这是实现高级入场动画的基础。
*/
.redirect-tip-container {
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 9999;
  perspective: 800px;
}

.tip-box {
  position: relative;
  min-width: 280px;
  transform: translateX(-50%); /* 从父容器继承并完成水平居中 */

  /*
    性能优化: will-change 提示浏览器该元素的 transform 和 opacity 属性会频繁变动。
    浏览器会为此元素创建一个独立的合成层，交由 GPU 处理动画，从而极大提升性能。
  */
  will-change: transform, opacity;

  filter: drop-shadow(0 10px 25px rgba(var(--glow-color-rgb), 0.3));
  transition: filter 0.5s ease-in-out;

  clip-path: polygon(
    0% 15px, 15px 0%,
    calc(100% - 30px) 0%, 100% 100%,
    15px 100%, 0% calc(100% - 15px)
  );

  /* 当状态变更时触发的微动效 */
  animation: status-pulse 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes status-pulse {
  0% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.03); }
  100% { transform: translateX(-50%) scale(1); }
}

.tip-texture {
  position: absolute;
  inset: 1px;
  z-index: 1;
  background-color: rgba(20, 22, 38, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 100% 3px;
  clip-path: inherit;
}

.tip-border {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 15px; /* conic-gradient 需要 radius 才能平滑 */
  overflow: hidden; /* 隐藏伪元素的溢出部分 */

  /* 第一层流光: 旋转的锥形渐变 */
  background: conic-gradient(
    from 180deg at 50% 50%,
    transparent 0deg,
    var(--glow-color) 60deg,
    transparent 120deg
  );
  animation: border-spin 3s linear infinite;
}

/* 第二层流光: 移动的线性渐变，创造视差效果 */
.tip-border::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--glow-color-rgb), 0.5) 50%,
    transparent 100%
  );
  /* 初始位置在左侧外部 */
  background-size: 200% 100%;
  background-position: 200% 0;
  animation: border-scan 3s ease-in-out infinite;
  animation-delay: -1.5s; /* 让动画一开始就在中间 */
}

@keyframes border-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes border-scan {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.tip-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.75rem;
  color: #e8e8e8;
}

.message {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

.icon-wrapper, .spinner {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 8px var(--glow-color));
  transition: filter 0.5s ease;
  fill: var(--glow-color);
}

.spinner {
  border: 3px solid rgba(var(--glow-color-rgb), 0.2);
  border-top-color: var(--glow-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  transition: border-color 0.5s ease;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* 更精致的入场/离场动画 */
.tip-slide-fade-enter-active,
.tip-slide-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.tip-slide-fade-enter-from,
.tip-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px) rotateX(-30deg) scale(0.95);
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.icon-swap-enter-from,
.icon-swap-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.8);
}

/*
  企业级标准: 可访问性。
  为在系统中开启“减弱动态效果”的用户提供更简洁的体验。
*/
@media (prefers-reduced-motion: reduce) {
  .tip-box, .tip-border, .tip-border::before, .spinner,
  .tip-slide-fade-enter-active, .tip-slide-fade-leave-active,
  .icon-swap-enter-active, .icon-swap-leave-active {
    animation: none !important;
    transition: none !important;
  }
}
</style>
