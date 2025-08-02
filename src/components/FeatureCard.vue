<!-- src/components/FeatureCard.vue -->

<template>
  <div class="feature-card">
    <div class="card-icon">
      <!-- 定义一个插槽，让父组件可以传入 SVG 图标 -->
      <slot name="icon"></slot>
    </div>
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-description">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.feature-card {
  background-color: var(--color-background-soft);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
  text-align: center; /* 让内容居中 */

  &:hover {
    transform: translateY(-8px);
    border-color: var(--color-primary);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
}

.card-icon {
  margin: 0 auto 1.5rem; /* 图标居中并与标题拉开距离 */
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--color-primary-rgb), 0.1);
  border-radius: 50%;
  color: var(--color-primary);
}

/* 设定图标SVG的颜色 */
.card-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.card-title {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
}

.card-description {
  color: var(--color-text);
  line-height: 1.7;
}
</style>
