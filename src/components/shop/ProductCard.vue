<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

// 格式化日期
const formattedDate = computed(() => {
  return new Date(props.product.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="product-card">
    <div class="card-image-wrapper">
      <img :src="product.image_url || '/placeholder.svg'" alt="商品图片" class="product-image" @error.once="e => e.target.src = '/placeholder.svg'" />
    </div>
    <div class="card-content">
      <h3 class="product-title">{{ product.name }}</h3>
      <p class="product-description">{{ product.description }}</p>
      <p class="product-date">添加于: {{ formattedDate }}</p>
    </div>
    <div class="card-actions">
      <button @click="$emit('edit', product)" class="action-btn edit-btn">编辑</button>
      <button @click="$emit('share', product)" class="action-btn share-btn">分享</button>
      <button @click="$emit('delete', product)" class="action-btn delete-btn">删除</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.product-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.4);
  }
}

.card-image-wrapper {
  width: 100%;
  height: 200px;
  background-color: #2a2a2a;
}
.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 1.5rem;
  flex-grow: 1;
}

.product-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
}

.product-description {
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.6em * 3); /* 保证至少3行的高度 */
}

.product-date {
  font-size: 0.875rem;
  color: var(--color-text-dark);
}

.card-actions {
  display: flex;
  border-top: 1px solid var(--color-border);
}

.action-btn {
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
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-heading);
  }

  &.delete-btn:hover {
    background-color: #e53e3e;
    color: #fff;
  }
}
</style>
