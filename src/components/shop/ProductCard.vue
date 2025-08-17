<!-- src/components/ProductCard.vue -->
<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useProductsStore } from '@/stores/products';

//  1. Props 升级：增加 loading 状态，并使 product 可选，以支持骨架屏
const props = defineProps({
  product: {
    type: Object,
    default: null, // 默认值为 null，以便在加载时传递
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const productsStore = useProductsStore();

function prepareForNavigation() {
  if (props.product) {
    productsStore.selectProductForDetailPage(props.product);
  }
}

//  2. 日期计算升级：使用 Intl.RelativeTimeFormat 提供更友好的相对时间
const lastActivity = computed(() => {
  if (props.loading || !props.product) return { text: '', isRecent: false };

  // 优先使用更新时间，否则使用创建时间
  const date = new Date(props.product.updated_at || props.product.created_at);
  const now = new Date();
  const diffSeconds = Math.round((now - date) / 1000);
  const diffDays = diffSeconds / (60 * 60 * 24);

  // 如果在3天内有活动，标记为 "近期"，用于显示徽章
  const isRecent = diffDays < 3;

  // 使用国际化 API 生成 "X天前", "Y小时前" 等文本
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

  if (diffDays >= 7) {
    // 超过一周，直接显示具体日期，更清晰
    return {
      text: date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
      isRecent: false,
    };
  }
  if (diffDays >= 1) {
    return { text: rtf.format(-Math.floor(diffDays), 'day'), isRecent };
  }
  if (diffSeconds >= 3600) {
    return { text: rtf.format(-Math.floor(diffSeconds / 3600), 'hour'), isRecent };
  }
  if (diffSeconds >= 60) {
    return { text: rtf.format(-Math.floor(diffSeconds / 60), 'minute'), isRecent };
  }
  return { text: '刚刚', isRecent: true };
});

// 计算是“更新于”还是“添加于”，使文本更精确
const activityPrefix = computed(() => {
    if(props.loading || !props.product) return '';
    return props.product.updated_at ? '更新于' : '添加于';
});
</script>

<template>
  <!--  3. 骨架屏加载状态 -->
  <div v-if="loading" class="product-card-wrapper is-loading">
    <div class="skeleton skeleton-image"></div>
    <div class="card-content">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-date"></div>
    </div>
    <div class="card-actions">
      <div class="skeleton skeleton-actions"></div>
    </div>
  </div>

  <!-- 真实数据显示状态 -->
  <div v-else class="product-card-wrapper">
    <router-link
      :to="{ name: 'product-details', params: { public_id: product.public_id } }"
      class="card-link"
      @click="prepareForNavigation"
    >
      <div class="card-image-wrapper">
        <img
          :src="product.thumbnail_url || '/placeholder.svg'"
          :alt="product.name || '商品图片'"
          class="product-image"
          loading="lazy"
          @error.once="(e) => (e.target.src = '/placeholder.svg')"
        />
        <!--  4. 动态状态徽章，仅在近期活动时显示 -->
        <span v-if="lastActivity.isRecent" class="status-badge">
          {{ product.updated_at ? '最新更新' : '新品' }}
        </span>
      </div>
      <div class="card-content">
        <h3 class="product-title">{{ product.name || '无标题商品' }}</h3>
        <!--  5. 优雅处理空描述，避免渲染空 p 标签 -->
        <p v-if="product.description" class="product-description">{{ product.description }}</p>
        <div class="card-footer">
          <div class="product-date">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>{{ activityPrefix }} {{ lastActivity.text }}</span>
          </div>
        </div>
      </div>
    </router-link>

    <div class="card-actions">
      <slot name="actions">
        <div class="card-actions-visual">
          <span>查看详情 &rarr;</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.product-card-wrapper {
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  //  6. 优化过渡效果，增加边框颜色过渡
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    border-color: var(--color-primary); //  悬停时边框高亮
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
  position: relative; // 为徽章定位
  width: 100%;
  height: 200px;
  background-color: var(--color-background-mute);
  overflow: hidden;
}

// 7. 状态徽章样式
.status-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.3rem 0.8rem;
    background-color: rgba(var(--color-primary-rgb), 0.8);
    backdrop-filter: blur(5px);
    color: #1a1a1a;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 20px;
    animation: fadeInBadge 0.5s ease;
}

@keyframes fadeInBadge {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
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
  // 优化长标题显示
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-description {
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
  flex-grow: 1; // 确保描述区域能填满剩余空间
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(1.6em * 3); // 保证至少有3行的高度
}

.card-footer {
  // 将日期推到底部
  margin-top: 1.5rem;
}

.product-date {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    flex-shrink: 0;
  }
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

// 8. 骨架屏样式
@keyframes shimmer {
  100% { transform: translateX(100%); }
}

.is-loading {
  .skeleton {
    background: var(--color-background-mute);
    position: relative;
    overflow: hidden;
    border-radius: 4px;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
      transform: translateX(-100%);
      animation: shimmer 1.5s infinite;
    }
  }
  .skeleton-image { height: 200px; border-radius: 0; }
  .skeleton-title { width: 70%; height: 1.5rem; margin-bottom: 1rem; }
  .skeleton-text { width: 100%; height: 1rem; margin-bottom: 0.5rem; }
  .skeleton-date { width: 40%; height: 1rem; margin-top: auto; } // 确保日期在底部
  .card-content { flex-grow: 1; display: flex; flex-direction: column; }
  .card-actions { border-top-color: transparent; }
  .skeleton-actions { width: 100%; height: 50px; border-radius: 0; }
}
</style>
