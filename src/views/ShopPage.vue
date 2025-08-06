<!-- src/views/ShopPage.vue -->

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast' // ✨ 1. Import the toast store
import ProductCard from '@/components/shop/ProductCard.vue'
import ProductEditorModal from '@/components/shop/ProductEditorModal.vue'
import FloatingActions from '@/components/shop/FloatingActions.vue'
import AuthModal from '@/components/auth/AuthModal.vue'

const authStore = useAuthStore()
const { user, loading: authLoading } = storeToRefs(authStore)

const productsStore = useProductsStore()
const { products, loading: productsLoading, error } = storeToRefs(productsStore)

const toastStore = useToastStore() // ✨ 2. Instantiate the toast store

const isEditorOpen = ref(false)
const isAuthModalOpen = ref(false)
const productToEdit = ref(null)

// 监听用户登录状态
watch(user, (newUser) => {
  if (newUser) {
    isAuthModalOpen.value = false
    productsStore.fetchProducts()
  } else {
    products.value = []
  }
}, { immediate: true })

function handleAddProduct() {
  productToEdit.value = null
  isEditorOpen.value = true
}

function handleEditProduct(product) {
  productToEdit.value = product
  isEditorOpen.value = true
}

// ✨ 3. UPDATED: handleDeleteProduct now uses the toast system implicitly
async function handleDeleteProduct(product) {
  // The blocking `window.confirm` is GONE.
  // In a real-world app, you might replace this with a beautiful custom confirmation modal.
  // For now, we proceed directly, and the feedback is handled by the toast in the store.
  await productsStore.deleteProduct(product.id, product.image_url)
}

// ✨ 4. UPDATED: handleShareProduct now uses the toast system
async function handleShareProduct(product) {
  const productUrl = `${window.location.origin}/details/${product.id}`;
  const shareData = {
    title: product.name,
    text: product.description,
    url: productUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      // No toast needed here, the native share UI provides feedback.
    } else {
      // Fallback for desktop/unsupported browsers
      await navigator.clipboard.writeText(productUrl);
      toastStore.showToast({ msg: '商品链接已复制到剪贴板' });
    }
  } catch (err) {
    console.error('Share/Copy failed:', err);
    toastStore.showToast({ msg: '操作失败', toastType: 'error' });
  }
}

// 登录成功后刷新商品
function onLoggedIn() {
  productsStore.fetchProducts();
}
</script>

<template>
  <div class="shop-page">
    <div class="container">
      <header class="shop-header">
        <h1>我的商店</h1>
        <p v-if="user" class="fade-in">欢迎回来, <strong>{{ user.email }}</strong></p>
        <p v-else class="fade-in">创建、管理和分享您的专属数字产品</p>
      </header>

      <!-- 未登录提示 (Unchanged) -->
      <div v-if="!user && !authLoading" class="unauthenticated-prompt">
        <!-- ... -->
      </div>

      <!-- 主内容区 -->
      <div v-else class="shop-content">
        <!-- 加载状态 (Unchanged) -->
        <div v-if="productsLoading" class="loading-state">
          <!-- ... -->
        </div>

        <!-- 错误状态 (Unchanged) -->
        <div v-else-if="error" class="error-state">
          <!-- ... -->
        </div>

        <!-- 空状态 (Unchanged) -->
        <div v-else-if="products.length === 0" class="empty-state">
          <!-- ... -->
        </div>

        <!-- ✨ 5. UPDATED: Products Grid with slotted actions -->
        <div v-else class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          >
            <!-- Pass action buttons into the 'actions' slot of each card -->
            <template #actions>
              <button @click.stop.prevent="handleEditProduct(product)" class="action-btn">编辑</button>
              <button @click.stop.prevent="handleShareProduct(product)" class="action-btn">分享</button>
              <button @click.stop.prevent="handleDeleteProduct(product)" class="action-btn delete-btn">删除</button>
            </template>
          </ProductCard>
        </div>
      </div>
    </div>

    <!-- Other components (Unchanged) -->
    <FloatingActions v-if="user" @add="handleAddProduct" />
    <ProductEditorModal
      v-model:active="isEditorOpen"
      :product="productToEdit"
      @close="isEditorOpen = false"
    />
    <AuthModal v-model:active="isAuthModalOpen" @loggedIn="onLoggedIn" />
  </div>
</template>

<style lang="scss" scoped>
/* All styles remain the same as the previously beautified version. */
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
