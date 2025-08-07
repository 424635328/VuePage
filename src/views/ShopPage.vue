<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useProductsStore } from '@/stores/products';
import { useToastStore } from '@/stores/toast';

// ✨ 1. 引入 DynamicScroller, 这是实现高性能网格的关键
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

import ProductCard from '@/components/shop/ProductCard.vue';
import FloatingActions from '@/components/shop/FloatingActions.vue';
import AuthModal from '@/components/auth/AuthModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

// --- Stores and Router ---
const authStore = useAuthStore();
const { user, loading: authLoading } = storeToRefs(authStore);

// ✨ 2. 确保你的 productsStore 已经实现了分页加载
//    (即包含 hasMore, loadingMore, resetAndFetchProducts, fetchProducts 等)
const productsStore = useProductsStore();
const { products, loading: productsLoading, loadingMore, hasMore, error } = storeToRefs(productsStore);

const toastStore = useToastStore();
const router = useRouter();

// --- Component State ---
const isAuthModalOpen = ref(false);
const isConfirmModalOpen = ref(false);
const productToDelete = ref(null);

// --- Infinite Scroll Logic ---
const loadMoreTrigger = ref(null);
let observer = null;

watch(user, (newUser, oldUser) => {
  if (newUser && !oldUser) {
    isAuthModalOpen.value = false;
    // ✨ 3. 调用分页优化的 action
    productsStore.resetAndFetchProducts();
  } else if (!newUser && oldUser) {
    productsStore.clearProducts();
  }
});

function onLoggedIn() {
  if (user.value) {
    productsStore.resetAndFetchProducts();
  }
}

function setupIntersectionObserver() {
  // 我们将观察器附加到页面的根元素(视口)
  const options = { root: null, threshold: 0.1 };
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting && hasMore.value && !productsLoading.value && !loadingMore.value) {
      // 加载更多商品
      productsStore.fetchProducts();
    }
  }, options);

  nextTick(() => {
    if (loadMoreTrigger.value) {
      observer.observe(loadMoreTrigger.value);
    }
  });
}

// --- Lifecycle Hooks ---
onMounted(() => {
  if (user.value && products.value.length === 0) {
    productsStore.resetAndFetchProducts();
  }
  setupIntersectionObserver();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

// --- Product Actions (Unchanged) ---
function handleAddProduct() {
  router.push({ name: 'product-new' });
}
function handleEditProduct(product) {
  router.push({ name: 'product-edit', params: { public_id: product.public_id } });
}
function handleDeleteProduct(product) {
  productToDelete.value = product;
  isConfirmModalOpen.value = true;
}
async function confirmDeletion() {
  if (productToDelete.value) {
    await productsStore.deleteProduct(productToDelete.value.id);
  }
  isConfirmModalOpen.value = false;
  productToDelete.value = null;
}
async function handleCopyLink(product) {
  const productUrl = `${window.location.origin}/details/${product.public_id}`;
  try {
    await navigator.clipboard.writeText(productUrl);
    toastStore.showToast({ msg: '商品链接已复制到剪贴板' });
  } catch (err) {
    console.error('Copy link failed:', err);
    toastStore.showToast({ msg: '复制失败，请检查浏览器权限', toastType: 'error' });
  }
}
</script>

<template>
  <div class="shop-page">
    <div class="container">
      <header class="shop-header">
        <h1>On Sale</h1>
        <p v-if="user" class="fade-in">欢迎回来, <strong>{{ user.email }}</strong></p>
        <p v-else class="fade-in">创建、管理和分享您的专属数字产品</p>
      </header>

      <!-- Unauthenticated Prompt (Unchanged) -->
      <div v-if="!user && !authLoading" class="unauthenticated-prompt">
        <div class="prompt-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2>解锁您的个人空间</h2>
        <p>登录以访问您的私人仪表盘，在这里您可以轻松管理所有商品。</p>
        <button @click="isAuthModalOpen = true" class="cta-button">
          立即登录或注册
        </button>
      </div>

      <!-- Main Content Area -->
      <div v-else class="shop-content">
        <!-- Loading, Error, Empty States (Unchanged) -->
        <div v-if="productsLoading && products.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载商品...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <div class="prompt-icon error">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2>加载出错了</h2>
          <p>无法连接到服务器。请检查您的网络连接或稍后重试。</p>
          <p class="error-details">错误信息: {{ error }}</p>
        </div>
        <div v-else-if="!productsLoading && products.length === 0" class="empty-state">
          <div class="prompt-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <h2>您的商店空空如也</h2>
          <p>看起来您还没有添加任何商品。点击右下角的 '+' 按钮开始创作吧！</p>
        </div>

        <!-- ✨ 4. The Final Grid Implementation -->
        <div v-else>
          <!-- DynamicScroller will manage the items and their positions -->
          <DynamicScroller
            :items="products"
            :min-item-size="440"
            class="products-scroller"
          >
            <template #before>
              <!-- This slot is where we define the grid container skeleton -->
              <!-- Its only job is to provide the grid layout structure -->
              <div class="products-grid"></div>
            </template>

            <template v-slot="{ item, index, active }">
              <!-- DynamicScrollerItem reports its size to the scroller -->
              <DynamicScrollerItem
                :item="item"
                :active="active"
                :data-index="index"
                class="product-card-container"
              >
                <!-- Your original ProductCard, unchanged -->
                <ProductCard :product="item">
                  <template #actions>
                    <button @click.stop.prevent="handleEditProduct(item)" class="action-btn">编辑</button>
                    <button @click.stop.prevent="handleCopyLink(item)" class="action-btn">复制链接</button>
                    <button @click.stop.prevent="handleDeleteProduct(item)" class="action-btn delete-btn">删除</button>
                  </template>
                </ProductCard>
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>

          <div v-if="hasMore" ref="loadMoreTrigger" class="load-more-indicator">
            <div v-if="loadingMore" class="spinner-small"></div>
            <p v-if="loadingMore">正在加载更多商品...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Actions & Modals (Unchanged) -->
    <FloatingActions v-if="user" @add="handleAddProduct" />
    <AuthModal v-model:active="isAuthModalOpen" @loggedIn="onLoggedIn" />
    <ConfirmModal
      :show="isConfirmModalOpen"
      title="确认删除商品"
      :message="`您确定要永久删除 ‘${productToDelete?.name}’ 吗？此操作无法撤销。`"
      confirm-text="确认删除"
      @close="isConfirmModalOpen = false"
      @confirm="confirmDeletion"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// --- Animation Keyframes (Unchanged) ---
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.5s ease-out forwards; }

// --- Page & Header Styles (Unchanged) ---
.shop-page {
  padding: 4rem 0 6rem;
  color: var(--color-text);
  min-height: 100vh;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}
.shop-header {
  text-align: center;
  margin-bottom: 5rem;
  animation: fadeIn 0.5s ease-out;
  h1 { font-size: 3.5rem; font-weight: 700; color: var(--color-heading); margin-bottom: 0.75rem; letter-spacing: -1px; }
  p { font-size: 1.25rem; color: var(--color-text-dark); max-width: 600px; margin: 0 auto; }
}

// --- Unauthenticated Prompt Styles (Unchanged) ---
.unauthenticated-prompt {
  /* ... All original styles */
}

// --- Common styles for Loading, Error, and Empty states (Unchanged) ---
.loading-state, .error-state, .empty-state {
  /* ... All original styles */
}
.spinner {
  /* ... All original styles */
}

// --- ✨ 5. The Final Grid Scroller Styles ---

// The main scroller component. It will flow naturally with the page,
// and the main window scrollbar will be used.
.products-scroller {
  position: relative; // Required for the absolute positioning of items
}

// The :deep() selector is crucial here to style the internal elements
// of the DynamicScroller component.
.products-scroller :deep(.products-grid) {
  // This is the container from the #before slot.
  // We apply your original grid styles here to create the layout skeleton.
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.products-scroller :deep(.product-card-container) {
  // The DynamicScrollerItem will be positioned absolutely by the library.
  // This container ensures the card inside has the correct context.
  width: 100%;
}

// The load more indicator for infinite scrolling
.load-more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  height: 80px;
  color: var(--color-text-dark);

  .spinner-small {
    width: 24px;
    height: 24px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 1rem;
  }
}

// --- Responsive Adjustments ---
@media (max-width: $breakpoint-md) {
  .container { padding: 0 1rem; }
  .shop-header h1 { font-size: 2.8rem; }
  .shop-header p { font-size: 1.1rem; }
  .unauthenticated-prompt { padding: 2.5rem 1.5rem; }
  .unauthenticated-prompt h2, .empty-state h2, .error-state h2 { font-size: 1.8rem; }

  // Apply the responsive grid styles to the inner container
  .products-scroller :deep(.products-grid) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
