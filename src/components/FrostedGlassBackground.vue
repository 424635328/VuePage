<!-- src/components/FrostedGlassBackground.vue -->

<script setup>
import { computed } from 'vue';

// ============================================================================
// 1. Props 定义：提供丰富的可配置项
// ============================================================================
const props = defineProps({
  /**
   * 控制背景模糊的像素值
   */
  blurAmount: {
    type: Number,
    default: 16,
  },
  /**
   * 玻璃的背景色和透明度
   */
  tintColor: {
    type: String,
    default: 'rgba(255, 255, 255, 0.08)',
  },
  /**
   * 边框的圆角半径
   */
  borderRadius: {
    type: String,
    default: '1.5rem', // e.g., '16px', '1rem', '50%'
  },
  /**
   * 内部内容的 padding 值
   */
  padding: {
    type: String,
    default: '2rem',
  },
  /**
   * 是否启用微妙的噪点纹理以增加真实感
   */
  enableNoise: {
    type: Boolean,
    default: true,
  },
  /**
   * 是否启用左上角的光泽效果
   */
  enableShine: {
    type: Boolean,
    default: true,
  },
});

// ============================================================================
// 2. 计算属性：将 Props 转化为 CSS 变量
// ============================================================================
// 这是将 props 动态传递给 <style> 块的最佳实践，性能高且代码清晰
const glassStyle = computed(() => ({
  '--blur-amount': `${props.blurAmount}px`,
  '--tint-color': props.tintColor,
  '--border-radius': props.borderRadius,
  '--padding': props.padding,
}));
</script>

<template>
  <!-- 根元素应用动画和动态样式 -->
  <div class="frosted-glass-card" :style="glassStyle">

    <!-- 视觉效果层：这些元素仅用于装饰，不影响内容 -->
    <div v-if="enableNoise" class="noise-overlay" />
    <div v-if="enableShine" class="shine-effect" />

    <!-- 内容包裹器：确保内容在效果层之上并应用正确的 padding -->
    <div class="content-wrapper">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.frosted-glass-card {
  position: relative;
  overflow: hidden; // 关键：确保子元素不会溢出圆角
  isolation: isolate; // 创建新的堆叠上下文，确保 z-index 按预期工作

  // 从 CSS 变量中获取动态样式
  border-radius: var(--border-radius);
  background-color: var(--tint-color);

  // 核心的毛玻璃效果，会模糊此元素背后的所有内容
  backdrop-filter: blur(var(--blur-amount));

  // 定义一个微妙的边框来增强立体感
  border: 1px solid rgba(255, 255, 255, 0.15);

  // 添加阴影以脱离背景
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  // 入场动画
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  // 平滑过渡效果，当 props 动态变化时
  transition: background-color 0.3s, backdrop-filter 0.3s;
}

// 噪点纹理层
.noise-overlay {
  position: absolute;
  inset: 0;
  z-index: -2; // 在内容之下，背景之上
  pointer-events: none; // 确保它不会干扰鼠标事件
  opacity: 0.05;
  // 使用内联 SVG 实现无文件依赖的噪点纹理
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

// 左上角光泽效果层
.shine-effect {
  position: absolute;
  inset: 0;
  z-index: -1; // 在内容之下
  pointer-events: none;
  border-radius: inherit; // 继承父元素的圆角
  // 使用线性渐变模拟光泽
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0) 60%
  );
}

// 内容包裹器
.content-wrapper {
  // position: relative 和 z-index 确保内容在所有效果层之上
  position: relative;
  z-index: 1;
  padding: var(--padding);
  height: 100%;
  width: 100%;
}
</style>
