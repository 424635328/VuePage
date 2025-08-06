<!-- src/components/shop/ProductCard.vue -->

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

// 计算一个用户友好的日期格式
const formattedDate = computed(() => {
  if (!props.product || !props.product.created_at) return '';
  return new Date(props.product.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="product-card-wrapper">
    <!-- 将卡片的核心内容区域作为导航链接 -->
    <router-link :to="{ name: 'product-details', params: { id: product.id } }" class="card-link">
      <div class="card-image-wrapper">
        <img
          :src="product.image_url || '/placeholder.svg'"
          :alt="product.name"
          class="product-image"
          loading="lazy"
          @error.once="e => e.target.src = '/placeholder.svg'"
        />
      </div>
      <div class="card-content">
        <h3 class="product-title">{{ product.name }}</h3>
        <p class="product-description">{{ product.description }}</p>
        <p class="product-date">添加于: {{ formattedDate }}</p>
      </div>
    </router-link>

    <!-- 卡片底部的操作区域 -->
    <div class="card-actions">
      <!-- 使用插槽(slot)来接收来自父组件的操作按钮 -->
      <slot name="actions">
        <!-- Fallback content: 如果父组件没有提供操作按钮，显示一个默认的 "查看详情" 提示 -->
        <div class="card-actions-visual">
          <span>查看详情 &rarr;</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// --- Main Wrapper ---
.product-card-wrapper {
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.5); // Using slate color for depth
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  // Hover effect for the entire wrapper
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4);
  }
}

// --- Clickable Link Area ---
.card-link {
  text-decoration: none; // Remove default link underline
  color: inherit;      // Inherit text color from parent
  display: flex;
  flex-direction: column;
  flex-grow: 1; // Allow this part to grow and fill available space
}

// --- Image Section ---
.card-image-wrapper {
  width: 100%;
  height: 200px;
  background-color: #2a2a2a;
  overflow: hidden;
}
.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  .product-card-wrapper:hover & {
    transform: scale(1.05); // Zoom effect on hover
  }
}

// --- Content Section ---
.card-content {
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.75rem;
}

.product-description {
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.6;
  margin: 0 0 1rem;
  flex-grow: 1; // Push date to the bottom

  // Clamp text to 3 lines with an ellipsis
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.6em * 3); /* Ensure consistent height for at least 3 lines */
}

.product-date {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  margin: 0;
}

// --- Actions Section ---
.card-actions {
  display: flex;
  border-top: 1px solid var(--color-border);
  background-color: rgba(0, 0, 0, 0.2); // Slightly different background for the bar

  // Default visual cue if no slot content is provided
  .card-actions-visual {
    width: 100%;
    padding: 1rem;
    text-align: center;
    font-weight: 500;
    color: var(--color-primary);
  }

  // --- Styles for slotted buttons (from parent) ---
  // The :slotted pseudo-element allows styling content passed from a parent
  :slotted(.action-btn) {
    flex: 1;
    background: transparent;
    border: none;
    padding: 1rem;
    color: var(--color-text);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:not(:last-child) {
      border-right: 1px solid var(--color-border);
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--color-heading);
    }

    &.delete-btn:hover {
      background-color: #e53e3e;
      color: #fff;
    }
  }
}
</style>
