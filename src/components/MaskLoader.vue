<!-- src/components/MaskLoader.vue -->

<script setup>
import { ref, computed, watch } from 'vue';
import { useMouse, useRafFn } from '@vueuse/core';

// ============================================================================
// 1. Props & Emits 定义
// ============================================================================
const props = defineProps({
  /**
   * 控制蒙版的显示/隐藏状态，支持 v-model:active
   */
  active: {
    type: Boolean,
    default: true,
  },
  /**
   * 中间的提示文本
   */
  enterText: {
    type: String,
    default: '进入探索',
  },
  /**
   * 背景层的透明度 (0 到 1 之间)
   * 0: 完全透明
   * 1: 完全不透明
   */
  backgroundOpacity: {
    type: Number,
    default: 1,
    validator: (value) => value >= 0 && value <= 1,
  },
});

const emit = defineEmits(['update:active']);

// ============================================================================
// 2. 内部响应式状态
// ============================================================================
// 控制用户点击后的“揭示”动画状态
const isDismissed = ref(false);

// 使用 ref 存储鼠标坐标，以便在 useRafFn 中平滑更新
const mouseX = ref(0);
const mouseY = ref(0);

// ============================================================================
// 3. 鼠标跟踪与平滑动画
// ============================================================================
// 仅当蒙版激活且未被揭示时，才跟踪鼠标位置，优化性能
const { x, y } = useMouse({
  type: 'client',
  when: () => props.active && !isDismissed.value,
});

// 使用 useRafFn (请求动画帧) 来实现高性能、平滑的鼠标跟随动画 (线性插值)
// 这可以确保动画在每个渲染帧上更新，避免卡顿
useRafFn(() => {
  mouseX.value += (x.value - mouseX.value) * 0.1; // 这里的 0.1 是插值系数，值越小，跟随越平滑但延迟越高
  mouseY.value += (y.value - mouseY.value) * 0.1;
});

// ============================================================================
// 4. 计算属性，用于动态绑定样式
// ============================================================================
const loaderStyle = computed(() => ({
  // 将 JS 中的值转化为 CSS 自定义属性，传递给 <style> 块
  '--mouse-x': `${mouseX.value}px`,
  '--mouse-y': `${mouseY.value}px`,
  '--mask-bg-opacity': props.backgroundOpacity,
}));

// ============================================================================
// 5. 事件处理与逻辑
// ============================================================================
/**
 * 当用户点击蒙版时，触发揭示动画
 */
const dismiss = () => {
  if (isDismissed.value) return; // 防止重复点击
  isDismissed.value = true;
};

// 监听 isDismissed 状态。当它变为 true 时，
// 等待 CSS 动画播放完毕后，通过 emit 通知父组件彻底移除蒙版。
watch(isDismissed, (newValue) => {
  if (newValue) {
    // 动画时长为 1200ms，在此之后更新 v-model
    setTimeout(() => {
      emit('update:active', false);
    }, 1200);
  }
});
</script>

<template>
  <!-- 使用 Vue 的 <Transition> 组件来控制蒙版整体的淡入淡出 -->
  <Transition name="mask-fade">
    <div
      v-if="active"
      class="mask-loader-container"
      :class="{ 'is-dismissed': isDismissed }"
      :style="loaderStyle"
      @click="dismiss"
      aria-hidden="true"
    >
      <!-- 背景遮罩层，负责颜色、透明度和圆形揭示动画 -->
      <div class="mask-overlay"></div>

      <!-- 中间的提示文字 -->
      <div class="enter-prompt">
        <div class="prompt-text">{{ enterText }}</div>
        <div class="prompt-instruction">Click anywhere to continue</div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
// 定义可复用的动画参数
:root {
  --transition-duration: 1.2s;
  --timing-function: cubic-bezier(0.8, 0, 0.2, 1);
}

.mask-loader-container {
  position: fixed;
  inset: 0;
  z-index: 100; // 确保在最顶层
  cursor: pointer;
  overflow: hidden;

  // 聚光灯效果: 通过伪元素和 CSS 变量实现，性能极高
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    // 使用 CSS 变量接收来自 <script> 的鼠标坐标
    background: radial-gradient(
      circle 300px at var(--mouse-x) var(--mouse-y),
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }

  // 当鼠标悬停在容器上时，平滑地显示聚光灯
  &:hover::before {
    opacity: 1;
  }
}

.mask-overlay {
  position: absolute;
  inset: 0;
  // 核心：使用 rgba 和 CSS 变量来设置动态透明度的背景
  // #06040f 的 rgb 值为 6, 4, 15
  background-color: rgba(6, 4, 15, var(--mask-bg-opacity, 1));

  // 核心动画：圆形揭示 (Iris Wipe)。动画的目标是 clip-path 属性
  clip-path: circle(0% at 50% 50%);
  transition: clip-path var(--transition-duration, 1.2s) var(--timing-function, cubic-bezier(0.8, 0, 0.2, 1));
}

.enter-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
  opacity: 0;
  user-select: none; // 禁止选中文本
  pointer-events: none; // 防止文字层捕获点击事件
  transition: opacity 0.8s ease-out;
}

.prompt-text {
  font-size: 2.5rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 0 15px rgba(106, 199, 241, 0.5);
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
}

.prompt-instruction {
  margin-top: 1rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}


/* ============================================================================
 * 动画状态控制
 * ============================================================================ */

/* 1. <Transition> 组件的淡入淡出效果 */
.mask-fade-enter-active {
  transition: opacity 0.5s ease;
}
.mask-fade-leave-active {
  // 快速消失，因为它只是在 DOM 中移除的最后一步
  transition: opacity 0.3s ease;
}
.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}

/* 2. 组件激活后的初始动画 (蒙版展开，文字淡入) */
.mask-loader-container:not(.is-dismissed) {
  .mask-overlay {
    // 将圆形从 0% 扩展到足以覆盖整个屏幕的大小
    clip-path: circle(150% at 50% 50%);
  }
  .enter-prompt {
    // 在蒙版动画播放一段时间后，再显示文字，更有层次感
    transition-delay: var(--transition-duration, 1.2s);
    opacity: 1;
  }
}

/* 3. 用户点击后 (is-dismissed 类被添加) 的退出动画 */
.mask-loader-container.is-dismissed {
  .mask-overlay {
    // 将圆形收缩回 0%
    clip-path: circle(0% at 50% 50%);
  }
  .enter-prompt {
    // 文字立即消失
    opacity: 0;
    transition: opacity 0.3s ease-in;
    transition-delay: 0s; // 覆盖掉之前的延迟
  }
  &::before {
    // 点击后立即隐藏聚光灯
    opacity: 0 !important;
  }
}
</style>
