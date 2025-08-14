<!-- src/views/ProductDetailsPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useProductsStore } from '@/stores/products';
import { useToastStore } from '@/stores/toast';
import { supabase } from '@/lib/supabaseClient';

// 导入新组件和 composable
import ProductDetailSkeleton from '@/components/common/ProductDetailSkeleton.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { useLightbox } from '@/composables/useLightbox.js';

const props = defineProps({
  public_id: { type: String, required: true },
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

// --- 使用 useLightbox Composable ---
const {
  isLightboxOpen,
  activeIndex,
  currentImage: currentLightboxImage,
  lightboxRef,
  open: openLightbox,
  close: closeLightbox,
  next: nextImage,
  prev: prevImage
} = useLightbox(images);

// --- 操作反馈状态 ---
const downloadStatus = ref('idle'); // idle, loading, success, error
const copyStatus = ref('idle'); // idle, success

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
    const { data, error: functionError } = await supabase.functions.invoke('get-product-details', {
      body: { public_id: props.public_id },
    });
    if (functionError) throw functionError;
    if (data.error) throw { message: data.error, code: 'CUSTOM_404' };

    product.value = data;
    images.value = data.images || [];
    currentImage.value = images.value.length > 0 ? images.value[0].image_url : (data.thumbnail_url || '');

    updateMetaTags(data, currentImage.value);
  } catch (e) {
    error.value = e.message;
    toastStore.showToast({ msg: `获取商品详情失败: ${e.message}`, toastType: 'error' });
  } finally {
    // 增加一个短暂延迟，让骨架屏动画更自然
    setTimeout(() => {
      loading.value = false;
    }, 300);
  }
}

function selectImage(url) {
  currentImage.value = url;
}

async function handleDownloadImage() {
  if (!currentImage.value || downloadStatus.value === 'loading') return;
  downloadStatus.value = 'loading';
  try {
    const response = await fetch(currentImage.value);
    if (!response.ok) throw new Error(`图片请求失败: ${response.statusText}`);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileExtension = blob.type.split('/')[1] || 'jpg';
    const mainImageIndex = images.value.findIndex(img => img.image_url === currentImage.value);
    link.download = `${product.value.name}_${mainImageIndex + 1}.${fileExtension}`;
    link.click();
    URL.revokeObjectURL(link.href);
    downloadStatus.value = 'success';
    toastStore.showToast({ msg: '图片已开始下载！' });
  } catch (err) {
    downloadStatus.value = 'error';
    toastStore.showToast({ msg: `下载失败: ${err.message}`, toastType: 'error' });
  } finally {
    setTimeout(() => downloadStatus.value = 'idle', 2000);
  }
}

async function handleCopyImageUrl() {
  if (!currentImage.value) return;
  try {
    await navigator.clipboard.writeText(currentImage.value);
    copyStatus.value = 'success';
    toastStore.showToast({ msg: '图片链接已复制' });
  } catch (err) {
    toastStore.showToast({ msg: `复制失败: ${err.message}`, toastType: 'error' });
  } finally {
    setTimeout(() => copyStatus.value = 'idle', 2000);
  }
}

function handleOpenLightbox() {
  const index = images.value.findIndex(img => img.image_url === currentImage.value);
  if (index !== -1) {
    openLightbox(index);
  }
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
  document.body.style.overflow = '';
});

const formattedDate = (d) => d ? new Date(d).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A';
const lastUpdated = computed(() => product.value ? formattedDate(product.value.updated_at || product.value.created_at) : '');

</script>

<template>
  <div class="details-page">
    <!-- 1. 使用骨架屏 -->
    <ProductDetailSkeleton v-if="loading" />

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
            <!-- 2. 即时反馈按钮 -->
            <div class="image-actions">
               <button @click.stop="handleDownloadImage" class="action-btn" :class="`status-${downloadStatus}`" :disabled="downloadStatus === 'loading'" title="下载图片">
                  <Transition name="feedback-icon" mode="out-in">
                    <svg v-if="downloadStatus === 'idle'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <svg v-else-if="downloadStatus === 'loading'" class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                    <svg v-else-if="downloadStatus === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <svg v-else-if="downloadStatus === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </Transition>
              </button>
               <button @click.stop="handleCopyImageUrl" class="action-btn" :class="`status-${copyStatus}`" title="复制图片链接">
                  <Transition name="feedback-icon" mode="out-in">
                    <svg v-if="copyStatus === 'idle'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <svg v-else-if="copyStatus === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </Transition>
              </button>
            </div>
            <img :src="currentImage" :alt="product.name" class="main-image" @click="handleOpenLightbox" />
          </div>

          <div v-if="images.length > 1" class="thumbnail-grid">
            <img v-for="img in images" :key="img.id" :src="img.image_url"
                 :alt="`${product.name} - 查看 ${img.position + 1}`"
                 class="thumbnail-image"
                 :class="{ active: currentImage === img.image_url }"
                 @click="selectImage(img.image_url)"
                 loading="lazy" /> <!-- 3. 缩略图懒加载 -->
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

    <!-- 4. A11y 优化的 Lightbox -->
    <Transition name="lightbox-fade">
      <div v-if="isLightboxOpen"
           class="lightbox-backdrop"
           @click="closeLightbox"
           ref="lightboxRef"
           role="dialog"
           aria-modal="true"
           :aria-label="`${product.name} - 图片浏览器`">

        <button @click.stop="closeLightbox" class="lightbox-close-btn" aria-label="关闭图片浏览器 (Esc)">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <button v-if="images.length > 1" @click.stop="prevImage" class="lightbox-nav-btn prev" aria-label="上一张图片 (左箭头)">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        <div class="lightbox-content" @click.stop>
          <Transition name="lightbox-image-fade" mode="out-in">
            <img v-if="currentLightboxImage" :key="currentLightboxImage.id" :src="currentLightboxImage.image_url" :alt="`${product.name} - 图片 ${activeIndex + 1}`" class="lightbox-image" />
          </Transition>
        </div>

        <button v-if="images.length > 1" @click.stop="nextImage" class="lightbox-nav-btn next" aria-label="下一张图片 (右箭头)">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <div v-if="images.length > 1" class="lightbox-counter" aria-live="polite" aria-atomic="true">
          {{ activeIndex + 1 }} / {{ images.length }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin { to { transform: rotate(360deg); } }

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

  .main-image-wrapper {
    position: relative; // 为绝对定位的按钮提供容器
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-background-soft);
    margin-bottom: 1rem;

    .main-image {
      width: 100%;
      display: block;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      cursor: zoom-in;
      transition: transform 0.3s ease;
    }

    &:hover {
      .image-actions {
        opacity: 1;
        transform: translateY(0);
      }
      .main-image {
        transform: scale(1.03);
      }
    }
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
    background-color: var(--color-background-soft); // 懒加载占位符背景

    &:hover {
      border-color: var(--color-primary-light);
    }
    &.active {
      border-color: var(--color-primary);
      box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.5);
    }
  }
}

.image-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 5;
  display: flex;
  gap: 0.75rem;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(10, 10, 10, 0.6);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }
    &:disabled {
      cursor: wait;
      opacity: 0.7;
    }
    .spinner-icon {
      animation: spin 1s linear infinite;
    }

    &.status-success {
      background-color: #28a745;
      border-color: #28a745;
    }
    &.status-error {
      background-color: #dc3545;
      border-color: #dc3545;
    }
  }
}

.feedback-icon-enter-active,
.feedback-icon-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.feedback-icon-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.feedback-icon-leave-to {
  opacity: 0;
  transform: scale(0.5);
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

.error-state {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-height: 60vh; text-align: center;
  h2 { font-size: 1.8rem; color: var(--color-heading); margin-bottom: 1rem; }
  p { font-size: 1.1rem; color: var(--color-text-dark); max-width: 450px; }
  .cta-button { margin-top: 1.5rem; }
}

.lightbox-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: zoom-out;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;

  .lightbox-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  }
}

.lightbox-close-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
  padding: 0;
  line-height: 0;

  &:hover {
    color: white;
    transform: scale(1.1) rotate(90deg);
  }
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.2);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.prev { left: 1.5rem; }
  &.next { right: 1.5rem; }

  &:hover {
    background: rgba(0, 0, 0, 0.5);
    color: white;
  }
}

.lightbox-counter {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  font-size: 1rem;
  user-select: none;
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

.lightbox-image-fade-enter-active,
.lightbox-image-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.lightbox-image-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.lightbox-image-fade-leave-to {
  opacity: 0;
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
  .lightbox-nav-btn {
    width: 48px;
    height: 48px;
    &.prev { left: 0.5rem; }
    &.next { right: 0.5rem; }
  }
  .lightbox-close-btn {
    top: 1rem;
    right: 1rem;
  }
}
</style>
