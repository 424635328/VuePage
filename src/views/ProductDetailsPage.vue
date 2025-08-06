<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/auth';
import { useProductsStore } from '@/stores/products';
import { useToastStore } from '@/stores/toast';
import ProductEditorModal from '@/components/shop/ProductEditorModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const product = ref(null);
const loading = ref(true);
const error = ref(null);

const router = useRouter();
const authStore = useAuthStore();
const productsStore = useProductsStore();
const toastStore = useToastStore();

const { user } = storeToRefs(authStore);

// State for modals
const isEditorOpen = ref(false);
const isConfirmModalOpen = ref(false);

// Computed property to check if the current user is the owner
const isOwner = computed(() => {
  return user.value && product.value && user.value.id === product.value.user_id;
});

// Advanced Content Parsing Algorithm
const contentBlocks = computed(() => {
  if (!product.value?.description) {
    return [];
  }
  const rawText = product.value.description;
  const parts = rawText.split(/\n### /);

  const blocks = [];

  if (parts[0] && !parts[0].startsWith('### ')) {
      const mainDesc = parts.shift().trim();
      if(mainDesc) {
        blocks.push({
            title: null,
            content: mainDesc.replace(/^- /gm, '• ').replace(/\n/g, '<br />')
        });
      }
  }

  parts.forEach(part => {
    const lines = part.split('\n');
    const title = lines.shift()?.trim();
    const content = lines.join('\n').trim()
                         .replace(/^- /gm, '• ')
                         .replace(/\n/g, '<br />');
    if (title && content) {
        blocks.push({ title, content });
    }
  });

  return blocks;
});

async function fetchProductDetails() {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: fetchError } = await supabase
      .from('products').select('*').eq('id', props.id).single();
    if (fetchError) {
      // Handle case where product is not found gracefully
      if (fetchError.code === 'PGRST116') {
        product.value = null;
        throw new Error('商品未找到。');
      }
      throw fetchError;
    }
    product.value = data;
  } catch (e) {
    error.value = e.message;
    console.error('Error fetching product details:', e.message);
  } finally {
    loading.value = false;
  }
}

// Function called by the editor modal's 'product-updated' event
function onProductUpdated() {
  fetchProductDetails();
}

// Handlers for the owner's toolbar
function handleEdit() {
  isEditorOpen.value = true;
}

function handleDelete() {
  isConfirmModalOpen.value = true;
}

async function confirmDeletion() {
  if (product.value) {
    await productsStore.deleteProduct(product.value.id, product.value.image_url);
    router.push('/shop'); // Navigate away after deletion
  }
  isConfirmModalOpen.value = false;
}

async function shareProduct() {
  const shareData = {
    title: product.value.name,
    text: product.value.description.split(/\n### /)[0], // Share only the main description
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toastStore.showToast({ msg: '链接已复制到剪贴板' });
    }
  } catch (err) {
    if (err.name !== 'AbortError') { // Ignore user cancellation of the share dialog
      console.error('Share failed:', err);
      toastStore.showToast({ msg: '分享失败', toastType: 'error' });
    }
  }
}

onMounted(fetchProductDetails);

// Helper functions for formatting dates
const formattedDate = (d) => d ? new Date(d).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A';
const lastUpdated = computed(() => product.value ? formattedDate(product.value.updated_at || product.value.created_at) : '');
</script>

<template>
  <div class="details-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载商品详情...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error || !product" class="error-state">
      <h2>无法找到商品</h2>
      <p>您要查找的商品不存在或已被删除。</p>
      <router-link to="/shop" class="cta-button">返回商店</router-link>
    </div>

    <!-- Main Content -->
    <div v-else class="container">
      <!-- Owner's Toolbar -->
      <div v-if="isOwner" class="owner-toolbar">
        <span class="toolbar-label">所有者工具</span>
        <div class="toolbar-actions">
          <button @click="handleEdit" class="toolbar-button" title="编辑商品">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>编辑</span>
          </button>
          <button @click="handleDelete" class="toolbar-button delete" title="删除商品">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            <span>删除</span>
          </button>
        </div>
      </div>

      <div class="back-button-wrapper fade-in-item">
         <button @click="router.push('/shop')" class="back-button">&larr; 返回商店</button>
      </div>

      <!-- Hybrid Content Layout -->
      <article class="content-article">
        <!-- 1. Hero Image (if it exists) -->
        <header v-if="product.image_url" class="article-header with-image fade-in-item">
          <img :src="product.image_url" :alt="product.name" class="hero-image" @error.once="e => e.target.style.display='none'" />
        </header>

        <!-- 2. Main Title & Meta -->
        <div class="article-header text-content fade-in-item" :class="{'no-image': !product.image_url}">
          <h1 class="product-title">{{ product.name }}</h1>
          <div class="meta-info">
            <p><strong>创建时间:</strong> {{ formattedDate(product.created_at) }}</p>
            <p><strong>最后更新:</strong> {{ lastUpdated }}</p>
          </div>
        </div>

        <!-- 3. Parsed Content Blocks -->
        <div class="article-body">
          <div v-for="(block, index) in contentBlocks" :key="index"
               class="content-block fade-in-item"
               :style="{ 'transition-delay': `${(index + 2) * 0.1}s` }">
            <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
            <div class="block-content" v-html="block.content"></div>
          </div>
        </div>

        <!-- 4. Final Actions -->
        <footer class="article-footer fade-in-item" :style="{ 'transition-delay': `${(contentBlocks.length + 2) * 0.1}s` }">
          <button @click="shareProduct" class="cta-button share-button">分享商品</button>
        </footer>
      </article>
    </div>

    <!-- Modals -->
    <ProductEditorModal
      v-if="product"
      v-model:active="isEditorOpen"
      :product="product"
      @close="isEditorOpen = false"
      @product-updated="onProductUpdated"
    />
    <ConfirmModal
      :show="isConfirmModalOpen"
      title="确认删除商品"
      :message="`您确定要永久删除 ‘${product?.name}’ 吗？此操作无法撤销。`"
      confirm-text="确认删除"
      @close="isConfirmModalOpen = false"
      @confirm="confirmDeletion"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// --- Animation ---
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.fade-in-item {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
}

// --- Base Page Styles ---
.details-page {
  padding: 2rem 0 6rem;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
}

// --- Owner Toolbar Styles ---
.owner-toolbar {
  position: sticky;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease-out;

  .toolbar-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-primary);
  }
  .toolbar-actions {
    display: flex;
    gap: 0.5rem;
  }
  .toolbar-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-background-soft);
      color: var(--color-heading);
    }
    &.delete:hover {
      background: rgba(229, 62, 62, 0.1);
      border-color: #e53e3e;
      color: #e53e3e;
    }
  }
}

.back-button-wrapper {
  margin-bottom: 2rem;
}
.back-button {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: var(--color-background-soft);
    color: var(--color-heading);
  }
}

// --- Hybrid Content Layout Styles ---
.content-article {
  width: 100%;
}

.article-header {
  &.with-image {
    margin-bottom: 3rem;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    .hero-image {
      width: 100%;
      display: block;
      aspect-ratio: 16 / 7;
      object-fit: cover;
      background-color: var(--color-background-soft);
    }
  }
  &.text-content {
    text-align: center;
    &.no-image {
      margin-bottom: 3rem;
    }
  }
}

.product-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--color-heading);
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.meta-info {
  font-size: 0.9rem;
  color: var(--color-text-dark);
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  p {
    margin: 0 0 0.25rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.article-body {
  margin-top: 4rem;
}

.content-block {
  margin-bottom: 3rem;

  .block-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 50px;
      height: 2px;
      background-color: var(--color-primary);
    }
  }

  .block-content {
    font-size: 1.15rem;
    line-height: 2;
    color: var(--color-text-dark);
    white-space: pre-wrap;
  }
}

.article-footer {
  text-align: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.cta-button {
  padding: 0.8rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--color-primary);
  color: #1a1a1a;
  &:hover {
    transform: translateY(-2px);
  }
}

// --- Responsive Adjustments ---
@media (max-width: 768px) {
  .container { padding: 0 1rem; }
  .product-title { font-size: 2.5rem; }
  .article-header.with-image { margin-bottom: 2rem; }
  .article-body { margin-top: 3rem; }
  .owner-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

// --- Loading/Error States ---
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
  h2 {
    font-size: 1.8rem;
    color: var(--color-heading);
    margin-bottom: 1rem;
  }
  p {
    font-size: 1.1rem;
    color: var(--color-text-dark);
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
  .cta-button {
    margin-top: 1.5rem;
  }
}
</style>
