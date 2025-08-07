<!-- src/views/ShopPage.vue -->

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useProductsStore } from '@/stores/products';
import { useToastStore } from '@/stores/toast';
import ProductCard from '@/components/shop/ProductCard.vue';
import FloatingActions from '@/components/shop/FloatingActions.vue';
import AuthModal from '@/components/auth/AuthModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const authStore = useAuthStore();
const { user, loading: authLoading } = storeToRefs(authStore);

const productsStore = useProductsStore();
const { products, loading: productsLoading, error } = storeToRefs(productsStore);

const toastStore = useToastStore();
const router = useRouter();

// State for modals
const isAuthModalOpen = ref(false);
const isConfirmModalOpen = ref(false);

// State for data being acted upon
const productToDelete = ref(null);

// ✨ 修复：这个 watcher 现在是响应UI变化的主要驱动力
watch(user, (newUser, oldUser) => {
  // 当 user 从 null 变为有值时，说明登录成功
  if (newUser && !oldUser) {
    console.log('User state changed to logged in, fetching products...');
    isAuthModalOpen.value = false; // 确保模态框关闭
    productsStore.fetchProducts();
  } else if (!newUser && oldUser) {
    // 当 user 从有值变为 null 时，说明登出
    console.log('User state changed to logged out, clearing products...');
    productsStore.clearProducts();
  }
});

onMounted(() => {
  // onMounted 逻辑保持不变，处理页面刷新后的情况
  if (user.value) {
    productsStore.fetchProducts();
  }
});

function onLoggedIn() {
  console.log('AuthModal emitted loggedIn event.');
  if(user.value) {
    productsStore.fetchProducts();
  }
}

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

// ✨ FIX: The call to deleteProduct now only passes the product's ID.
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

      <!-- Unauthenticated Prompt -->
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
        <!-- Loading State -->
        <div v-if="productsLoading" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载商品...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="prompt-icon error">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2>加载出错了</h2>
          <p>无法连接到服务器。请检查您的网络连接或稍后重试。</p>
          <p class="error-details">错误信息: {{ error }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!productsLoading && products.length === 0" class="empty-state">
          <div class="prompt-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <h2>您的商店空空如也</h2>
          <p>看起来您还没有添加任何商品。点击右下角的 '+' 按钮开始创作吧！</p>
        </div>

        <!-- Products Grid -->
        <div v-else class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          >
            <template #actions>
              <button @click.stop.prevent="handleEditProduct(product)" class="action-btn">编辑</button>
              <button @click.stop.prevent="handleCopyLink(product)" class="action-btn">复制链接</button>
              <button @click.stop.prevent="handleDeleteProduct(product)" class="action-btn delete-btn">删除</button>
            </template>
          </ProductCard>
        </div>
      </div>
    </div>

    <!-- Floating Actions & Modals -->
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
/* All styles remain the same and do not need to be changed. */
@use '@/assets/styles/index.scss' as *;
// --- Animation Keyframes ---
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.5s ease-out forwards; }

// --- Page & Header Styles ---
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
  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.75rem;
    letter-spacing: -1px;
  }
  p {
    font-size: 1.25rem;
    color: var(--color-text-dark);
    max-width: 600px;
    margin: 0 auto;
  }
}

// --- Unauthenticated Prompt Styles ---
.unauthenticated-prompt {
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; margin: 4rem auto; padding: 3rem 2.5rem;
  max-width: 550px;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.1), 0 0 40px rgba(56, 189, 248, 0.08), inset 0 0 15px rgba(30, 41, 59, 0.5);
  animation: fadeIn 0.8s ease-out 0.2s forwards;
  opacity: 0;
  .prompt-icon {
    width: 64px; height: 64px; display: flex; align-items: center;
    justify-content: center; background: rgba(56, 189, 248, 0.1);
    border-radius: 50%; margin-bottom: 1.5rem; color: var(--color-primary);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
  }
  h2 {
    font-size: 2.25rem; font-weight: 600; color: var(--color-heading);
    margin-bottom: 1rem; text-align: center;
  }
  p {
    color: var(--color-text-dark); font-size: 1.1rem; line-height: 1.6;
    max-width: 400px; text-align: center; margin-bottom: 2rem;
  }
  .cta-button {
    padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600;
    background: var(--color-primary); color: #1a1a1a;
    border: none; border-radius: 8px; cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px -5px rgba(56, 189, 248, 0.4);
    &:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 8px 30px -8px rgba(56, 189, 248, 0.6);
    }
  }
}

// --- Common styles for Loading, Error, and Empty states ---
.loading-state, .error-state, .empty-state {
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; min-height: 50vh; text-align: center;
  color: var(--color-text-dark); animation: fadeIn 0.5s ease-out;
  .prompt-icon {
    width: 64px; height: 64px; display: flex; align-items: center;
    justify-content: center; background: rgba(var(--color-text-rgb), 0.05);
    border-radius: 50%; margin-bottom: 1.5rem; color: var(--color-text-dark);
    &.error {
        background: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
    }
  }
  h2 { font-size: 2rem; color: var(--color-heading); margin-bottom: 0.75rem; }
  p { font-size: 1.1rem; max-width: 450px; line-height: 1.6; }
  .error-details {
      font-size: 0.875rem; color: #8b949e; margin-top: 1rem;
      max-width: 500px; word-break: break-all;
  }
}
.spinner {
  width: 50px; height: 50px; border: 4px solid var(--color-border);
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin 1s linear infinite; margin-bottom: 1.5rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

// --- Products Grid Styles ---
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  animation: fadeIn 0.8s ease-out 0.2s forwards;
  opacity: 0;
}

// --- Responsive Adjustments ---
@media (max-width: $breakpoint-md) {
  .container { padding: 0 1rem; }
  .shop-header h1 { font-size: 2.8rem; }
  .shop-header p { font-size: 1.1rem; }
  .unauthenticated-prompt { padding: 2.5rem 1.5rem; }
  .unauthenticated-prompt h2, .empty-state h2, .error-state h2 { font-size: 1.8rem; }
  .products-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
