<!-- src/views/ProductDetailsPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useProductsStore } from '@/stores/products';
import { useToastStore } from '@/stores/toast';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { supabase } from '@/lib/supabaseClient';

const props = defineProps({
  public_id: {
    type: String,
    required: true,
  },
});

const product = ref(null);
const images = ref([]);
const currentImage = ref('');
const loading = ref(true);
const error = ref(null);

const router = useRouter();
const authStore = useAuthStore();
const productsStore = useProductsStore();
const toastStore = useToastStore();
const { user } = storeToRefs(authStore);

const isConfirmModalOpen = ref(false);
const isOwner = computed(() => user.value && product.value && user.value.id === product.value.user_id);

const contentBlocks = computed(() => {
  if (!product.value?.description) return [];
  const rawText = product.value.description;
  const parts = rawText.split(/\n### /);
  const blocks = [];
  if (parts[0] && !parts[0].startsWith('### ')) {
      const mainDesc = parts.shift().trim();
      if(mainDesc) blocks.push({ title: null, content: mainDesc.replace(/^- /gm, '• ').replace(/\n/g, '<br />') });
  }
  parts.forEach(part => {
    const lines = part.split('\n');
    const title = lines.shift()?.trim();
    const content = lines.join('\n').trim().replace(/^- /gm, '• ').replace(/\n/g, '<br />');
    if (title && content) blocks.push({ title, content });
  });
  return blocks;
});

function updateMetaTags(productData, firstImage) {
  document.title = `${productData.name} | MHStudio`;
  const updateOrCreateMeta = (property, content) => {
    let el = document.querySelector(`meta[property='${property}']`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content || '');
  };
  const descriptionText = productData.description.split(/\n### /)[0].substring(0, 150) + '...';
  const imageUrl = firstImage || productData.thumbnail_url || `${window.location.origin}/LOGO.jpeg`;
  updateOrCreateMeta('og:title', productData.name);
  updateOrCreateMeta('og:description', descriptionText);
  updateOrCreateMeta('og:image', imageUrl);
  updateOrCreateMeta('og:url', window.location.href);
  updateOrCreateMeta('og:type', 'website');
}

async function loadProductData() {
  loading.value = true;
  error.value = null;
  try {
    // ✨ 优化点 1: 在前端直接调用 Edge Function，而不是通过 fetch API
    // 这样代码更简洁，并且能更好地处理错误
    const { data, error: functionError } = await supabase.functions.invoke('get-product-details', {
      body: { public_id: props.public_id },
    });

    // 如果 Edge Function 调用本身出错（比如网络问题或服务器5xx错误）
    if (functionError) {
      throw functionError;
    }

    // Edge Function 内部可能返回业务错误（比如404）
    if (data.error) {
      // 创建一个和 Supabase 错误结构类似的对象，方便统一处理
      throw { message: data.error, code: 'CUSTOM_404' };
    }

    // ✨ 核心优化：直接使用 Edge Function 返回的完整数据
    // data 现在包含了 product 的所有字段以及一个 images 数组
    product.value = data;
    images.value = data.images || []; // 如果没有图片，确保 images 是个空数组
    currentImage.value = images.value.length > 0 ? images.value[0].image_url : (data.thumbnail_url || '');

    updateMetaTags(data, currentImage.value);

  } catch (e) {
    // 统一处理所有错误
    error.value = e.message;
    toastStore.showToast({ msg: `获取商品详情失败: ${e.message}`, toastType: 'error' });
    console.error('获取商品详情失败:', e); // 打印完整的错误对象以供调试
  } finally {
    loading.value = false;
  }
}
function selectImage(url) {
  currentImage.value = url;
}

function handleEdit() {
  router.push({ name: 'product-edit', params: { public_id: product.value.public_id } });
}

function handleDelete() {
  isConfirmModalOpen.value = true;
}

async function confirmDeletion() {
  if (product.value) {
    const success = await productsStore.deleteProduct(product.value.id);
    if (success) router.push('/shop');
  }
  isConfirmModalOpen.value = false;
}

async function shareProduct() {
  const shareData = {
    title: product.value.name,
    text: product.value.description.split(/\n### /)[0],
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
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err);
      toastStore.showToast({ msg: '分享失败', toastType: 'error' });
    }
  }
}

onMounted(loadProductData);

onUnmounted(() => {
  productsStore.selectProductForDetailPage(null);
});

const formattedDate = (d) => d ? new Date(d).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A';
const lastUpdated = computed(() => product.value ? formattedDate(product.value.updated_at || product.value.created_at) : '');

</script>

<template>
  <div class="details-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载商品详情...</p>
    </div>

    <div v-else-if="error || !product" class="error-state">
      <h2>无法找到商品</h2>
      <p>{{ error }}</p>
      <router-link to="/shop" class="cta-button">返回商店</router-link>
    </div>

    <div v-else class="container">
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

      <div class="details-layout">
        <aside v-if="images.length > 0" class="gallery-column fade-in-item">
          <div class="main-image-wrapper">
            <img :src="currentImage" :alt="product.name" class="main-image" />
          </div>
          <div v-if="images.length > 1" class="thumbnail-grid">
            <img v-for="img in images" :key="img.id" :src="img.image_url"
                 :alt="`${product.name} thumbnail ${img.id}`"
                 class="thumbnail-image"
                 :class="{ active: currentImage === img.image_url }"
                 @click="selectImage(img.image_url)" />
          </div>
        </aside>

        <article class="content-column">
          <header class="article-header fade-in-item">
            <h1 class="product-title">{{ product.name }}</h1>
            <div class="meta-info">
              <p><strong>创建时间:</strong> {{ formattedDate(product.created_at) }}</p>
              <p><strong>最后更新:</strong> {{ lastUpdated }}</p>
            </div>
          </header>

          <div class="article-body">
            <div v-for="(block, index) in contentBlocks" :key="index"
                 class="content-block fade-in-item"
                 :style="{ 'transition-delay': `${(index + 2) * 0.1}s` }">
              <h3 v-if="block.title" class="block-title">{{ block.title }}</h3>
              <div class="block-content" v-html="block.content"></div>
            </div>
          </div>

          <footer class="article-footer fade-in-item" :style="{ 'transition-delay': `${(contentBlocks.length + 2) * 0.1}s` }">
            <button @click="shareProduct" class="cta-button share-button">分享商品</button>
          </footer>
        </article>
      </div>
    </div>

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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in-item {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
}

.details-page {
  padding: 2rem 0 6rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.details-layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 3rem;
}

.gallery-column {
  flex: 0 0 40%;
  max-width: 500px;
  position: sticky;
  top: calc($header-height + 2rem);
}

.main-image-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  margin-bottom: 1rem;
}

.main-image {
  width: 100%;
  display: block;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 0.75rem;
}

.thumbnail-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    border-color: var(--color-primary-light);
  }
  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.5);
  }
}

.content-column {
  flex: 1;
  min-width: 0;
}

.owner-toolbar {
  position: sticky;
  top: $header-height;
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
  .toolbar-label { font-size: 0.9rem; font-weight: 600; color: var(--color-primary); }
  .toolbar-actions { display: flex; gap: 0.5rem; }
  .toolbar-button {
    display: flex; align-items: center; gap: 0.5rem; background: transparent; border: 1px solid var(--color-border);
    color: var(--color-text); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;
    &:hover { background: var(--color-background-soft); color: var(--color-heading); }
    &.delete:hover { background: rgba(229, 62, 62, 0.1); border-color: #e53e3e; color: #e53e3e; }
  }
}

.back-button-wrapper {
  margin-bottom: 2rem;
}

.back-button {
  background: none; border: 1px solid var(--color-border); color: var(--color-text); padding: 0.5rem 1rem;
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
  &:hover { background: var(--color-background-soft); color: var(--color-heading); }
}

.article-header {
  margin-bottom: 3rem;
}

.product-title {
  font-size: 3rem; font-weight: 700; color: var(--color-heading);
  line-height: 1.2; margin-bottom: 1.5rem;
}

.meta-info {
  font-size: 0.9rem; color: var(--color-text-dark); display: inline-block;
  padding: 0.75rem 1.5rem; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  p { margin: 0 0 0.25rem; &:last-child { margin-bottom: 0; } }
}

.article-body { }

.content-block {
  margin-bottom: 3rem;
  .block-title {
    font-size: 1.8rem; font-weight: 600; color: var(--color-heading); margin-bottom: 1.5rem;
    padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border); position: relative;
    &::before { content: ''; position: absolute; bottom: -1px; left: 0; width: 50px; height: 2px; background-color: var(--color-primary); }
  }
  .block-content {
    font-size: 1.15rem;
    line-height: 2;
    color: var(--color-text-dark);
    white-space: pre-wrap;
  }
}

.article-footer {
  text-align: center; margin-top: 4rem; padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.cta-button {
  padding: 0.8rem 2rem; font-size: 1rem; font-weight: 600; border-radius: 8px; border: none;
  cursor: pointer; transition: all 0.2s ease; background-color: var(--color-primary); color: #1a1a1a;
  &:hover { transform: translateY(-2px); }
}

@media (max-width: 992px) {
  .details-layout {
    flex-direction: column;
    gap: 2.5rem;
  }
  .gallery-column {
    flex-basis: auto;
    width: 100%;
    max-width: 100%;
    position: static;
  }
}
@media (max-width: 768px) {
  .container { padding: 0 1rem; }
  .product-title { font-size: 2.5rem; }
  .owner-toolbar { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
}

.loading-state, .error-state {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-height: 60vh; text-align: center;
  h2 { font-size: 1.8rem; color: var(--color-heading); margin-bottom: 1rem; }
  p { font-size: 1.1rem; color: var(--color-text-dark); max-width: 450px; }
  .spinner {
    width: 50px; height: 50px; border: 4px solid var(--color-border); border-top-color: var(--color-primary);
    border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.5rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cta-button { margin-top: 1.5rem; }
}
</style>
