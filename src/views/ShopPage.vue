<!--  src/views/ShopPage.vue -->

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import ProductCard from '@/components/shop/ProductCard.vue'
import ProductEditorModal from '@/components/shop/ProductEditorModal.vue'
import FloatingActions from '@/components/shop/FloatingActions.vue'
import AuthModal from '@/components/auth/AuthModal.vue'

const authStore = useAuthStore()
const { user, loading: authLoading } = storeToRefs(authStore)

const productsStore = useProductsStore()
const { products, loading: productsLoading, error } = storeToRefs(productsStore)

const isEditorOpen = ref(false)
const isAuthModalOpen = ref(false)
const productToEdit = ref(null)

// 监听用户登录状态
watch(user, (newUser) => {
  if (newUser) {
    isAuthModalOpen.value = false // 登录成功后关闭登录框
    productsStore.fetchProducts()
  } else {
    products.value = [] // 注销后清空商品
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

async function handleDeleteProduct(product) {
  // 使用更友好的确认框，未来可以替换为自定义模态框
  if (window.confirm(`确定要删除商品 "${product.name}" 吗？此操作不可逆。`)) {
    await productsStore.deleteProduct(product.id, product.image_url)
    // 可在此处添加 Toast 通知
  }
}

function handleShareProduct(product) {
    if (navigator.share) {
        navigator.share({
            title: product.name,
            text: product.description,
            url: window.location.href, // 或者一个专门的商品详情页URL
        }).catch(err => console.error('Share failed:', err));
    } else {
        alert('您的浏览器不支持分享功能。');
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
        <!-- 优化后的副标题 -->
        <p v-if="user" class="fade-in">欢迎回来, <strong>{{ user.email }}</strong></p>
        <p v-else class="fade-in">创建、管理和分享您的专属数字产品</p>
      </header>

      <!-- ✨ 全新美化版：未登录提示 ✨ -->
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

      <!-- 主内容区 -->
      <div v-else class="shop-content">
        <!-- 加载状态 -->
        <div v-if="productsLoading" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载商品...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <div class="prompt-icon error">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2>加载出错了</h2>
          <p>无法连接到服务器。请检查您的网络连接或稍后重试。</p>
          <p class="error-details">错误信息: {{ error }}</p>
        </div>

        <!-- ✨ 全新美化版：空状态 ✨ -->
        <div v-else-if="products.length === 0" class="empty-state">
          <div class="prompt-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <h2>您的商店空空如也</h2>
          <p>看起来您还没有添加任何商品。点击右下角的 '+' 按钮开始创作吧！</p>
        </div>

        <!-- 商品网格 -->
        <div v-else class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            @edit="handleEditProduct"
            @delete="handleDeleteProduct"
            @share="handleShareProduct"
          />
        </div>
      </div>
    </div>

    <!-- 悬浮按钮 -->
    <FloatingActions v-if="user" @add="handleAddProduct" />

    <!-- 商品编辑器模态框 -->
    <ProductEditorModal
      v-model:active="isEditorOpen"
      :product="productToEdit"
      @close="isEditorOpen = false"
    />

    <!-- 认证模态框 -->
    <AuthModal v-model:active="isAuthModalOpen" @loggedIn="onLoggedIn" />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// --- Animation Keyframes ---
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

// --- Page & Header Styles ---
.shop-page {
  padding: 4rem 0 6rem; // More bottom padding
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
  margin-bottom: 5rem; // Increased margin
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

// --- ✨ NEW Unauthenticated Prompt Styles ✨ ---
.unauthenticated-prompt {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 4rem auto;
  padding: 3rem 2.5rem;
  max-width: 550px;

  // Glassmorphism effect
  background: rgba(30, 41, 59, 0.5); // A slate-blueish background
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);

  // Neon glow border
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 16px;
  box-shadow:
    0 0 20px rgba(56, 189, 248, 0.1),
    0 0 40px rgba(56, 189, 248, 0.08),
    inset 0 0 15px rgba(30, 41, 59, 0.5);

  animation: fadeIn 0.8s ease-out 0.2s forwards; // Add a slight delay
  opacity: 0; // Start hidden for animation

  .prompt-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(56, 189, 248, 0.1);
    border-radius: 50%;
    margin-bottom: 1.5rem;
    color: var(--color-primary);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
  }

  h2 {
    font-size: 2.25rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 1rem;
    text-align: center;
  }

  p {
    color: var(--color-text-dark);
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 400px;
    text-align: center;
    margin-bottom: 2rem;
  }

  .cta-button {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    background: var(--color-primary);
    color: #1a1a1a;
    border: none;
    border-radius: 8px;
    cursor: pointer;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  text-align: center;
  color: var(--color-text-dark);
  animation: fadeIn 0.5s ease-out;

  .prompt-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--color-text-rgb), 0.05);
    border-radius: 50%;
    margin-bottom: 1.5rem;
    color: var(--color-text-dark);

    &.error {
        background: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
    }
  }

  h2 { font-size: 2rem; color: var(--color-heading); margin-bottom: 0.75rem; }
  p { font-size: 1.1rem; max-width: 450px; line-height: 1.6; }

  .error-details {
      font-size: 0.875rem;
      color: #8b949e;
      margin-top: 1rem;
      max-width: 500px;
      word-break: break-all;
  }
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
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
