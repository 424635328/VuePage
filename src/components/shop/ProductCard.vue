<!-- src/components/ProductCard.vue -->
<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

// 详情页必须能够根据路由参数自给自足。

const formattedDate = computed(() => {
  if (!props.product?.created_at) return '';
  // 这个计算属性是高效的，可以保留
  return new Date(props.product.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="product-card-wrapper">
    <router-link
      :to="{ name: 'product-details', params: { public_id: product.public_id } }"
      class="card-link"
    >
      <div class="card-image-wrapper">
        <img
          v-lazy-load="product.thumbnail_url || '/placeholder.svg'"
          :alt="product.name"
          class="product-image"
          @error.once="e => e.target.src = '/placeholder.svg'"
        />
      </div>
      <div class="card-content">
        <h3 class="product-title">{{ product.name }}</h3>
        <p class="product-description">{{ product.description }}</p>
        <p class="product-date">添加于: {{ formattedDate }}</p>
      </div>
    </router-link>

    <div class="card-actions">
      <slot name="actions">
        <!-- 默认插槽内容保持不变 -->
        <div class="card-actions-visual">
          <span>查看详情 &rarr;</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<!-- 样式部分保持完全不变 -->
<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.product-card-wrapper {
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4);
  }
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

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
    transform: scale(1.05);
  }
}

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
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.6em * 3);
}

.product-date {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  margin: 0;
}

.card-actions {
  display: flex;
  border-top: 1px solid var(--color-border);
  background-color: rgba(0, 0, 0, 0.2);

  .card-actions-visual {
    width: 100%;
    padding: 1rem;
    text-align: center;
    font-weight: 500;
    color: var(--color-primary);
  }

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
