<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useProductsStore } from '@/stores/products';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const productsStore = useProductsStore();

// This function is called just before the router navigates away.
// It stores the complete product object in our Pinia store.
// The details page will then read from this store for an instant load.
function prepareForNavigation() {
  productsStore.selectProductForDetailPage(props.product);
}

// Computes a user-friendly date format
const formattedDate = computed(() => {
  if (!props.product?.created_at) return '';
  return new Date(props.product.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="product-card-wrapper">
    <!-- The main content area of the card is a router-link to the details page. -->
    <!-- The @click handler prepares the Pinia store for an instant page load. -->
    <router-link
      :to="{ name: 'product-details', params: { public_id: product.public_id } }"
      class="card-link"
      @click="prepareForNavigation"
    >
      <div class="card-image-wrapper">
        <!--
          ✨ 最终修复:
          将 :src 的绑定从 product.image_url 更改为 product.thumbnail_url。
          这与我们诊断日志中确认的数据字段完全匹配。
        -->
        <img
          :src="product.thumbnail_url || '/placeholder.svg'"
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

    <!-- The actions bar at the bottom of the card. -->
    <div class="card-actions">
      <!-- This slot will be filled by the parent component (e.g., ShopPage.vue) -->
      <!-- with buttons like "Edit", "Copy Link", and "Delete". -->
      <slot name="actions">
        <!-- Fallback content: If no actions are provided, show a default visual cue. -->
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

// --- Clickable Link Area ---
.card-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
    transform: scale(1.05); // Subtle zoom effect on hover
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
  flex-grow: 1; // This pushes the date to the bottom

  // Clamp text to 3 lines with an ellipsis for a clean grid layout
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
  // The :slotted() pseudo-element allows styling content passed from a parent
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
