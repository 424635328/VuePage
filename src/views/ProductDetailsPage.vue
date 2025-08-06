<!-- src/views/ProductDetailsPage.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import { useToastStore } from '@/stores/toast';

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
const toastStore = useToastStore();

async function fetchProductDetails() {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', props.id)
      .single();

    if (fetchError) throw fetchError;
    product.value = data;
  } catch (e) {
    error.value = e.message;
    console.error('Error fetching product details:', e);
  } finally {
    loading.value = false;
  }
}

const formattedDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const lastUpdated = computed(() => {
  return formattedDate(product.value.updated_at || product.value.created_at);
});

async function shareProduct() {
  const shareData = {
    title: product.value.name,
    text: product.value.description,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      toastStore.showToast({ msg: '感谢分享！' });
    } else {
      // Fallback for desktop or non-supported browsers
      await navigator.clipboard.writeText(window.location.href);
      toastStore.showToast({ msg: '链接已复制到剪贴板' });
    }
  } catch (err) {
    console.error('Share failed:', err);
    toastStore.showToast({ msg: '分享失败', toastType: 'error' });
  }
}

onMounted(fetchProductDetails);
</script>

<template>
  <div class="details-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载商品详情...</p>
    </div>

    <div v-else-if="error || !product" class="error-state">
      <h2>无法找到商品</h2>
      <p>您要查找的商品不存在或已删除。</p>
      <router-link to="/shop" class="cta-button">返回商店</router-link>
    </div>

    <div v-else class="container">
      <div class="back-button-wrapper">
         <button @click="router.push('/shop')" class="back-button">&larr; 返回商店</button>
      </div>
      <div class="details-grid">
        <div class="image-column">
          <img :src="product.image_url || '/placeholder.svg'" :alt="product.name" class="product-image" @error.once="e => e.target.src = '/placeholder.svg'" />
        </div>
        <div class="info-column">
          <h1 class="product-title">{{ product.name }}</h1>
          <p class="product-description">{{ product.description }}</p>
          <div class="meta-info">
            <p><strong>创建时间:</strong> {{ formattedDate(product.created_at) }}</p>
            <p><strong>最后更新:</strong> {{ lastUpdated }}</p>
          </div>
          <div class="actions">
            <button @click="shareProduct" class="cta-button share-button">分享</button>
            <!-- Add other actions like 'Edit' here if needed -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.details-page {
  padding: 4rem 0;
  animation: fadeIn 0.5s ease-out;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
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
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}
.image-column .product-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
.info-column {
    .product-title {
        font-size: 3rem;
        font-weight: 700;
        color: var(--color-heading);
        margin-bottom: 1.5rem;
    }
    .product-description {
        font-size: 1.2rem;
        line-height: 1.8;
        color: var(--color-text-dark);
        margin-bottom: 2rem;
    }
}
.meta-info {
    padding: 1.5rem;
    background: var(--color-background-soft);
    border-radius: 8px;
    margin-bottom: 2rem;
    font-size: 0.9rem;
    color: var(--color-text-dark);
    p { margin: 0 0 0.5rem; }
}
.actions .cta-button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
}
@media (max-width: 992px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
// Keyframes and common states (loading/error)
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.loading-state, .error-state {
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; min-height: 60vh; text-align: center;
  h2 { font-size: 1.8rem; color: var(--color-heading); margin-bottom: 1rem; }
  p { font-size: 1.1rem; color: var(--color-text-dark); }
  .spinner {
    width: 50px; height: 50px; border: 4px solid var(--color-border);
    border-top-color: var(--color-primary); border-radius: 50%;
    animation: spin 1s linear infinite; margin-bottom: 1.5rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cta-button { margin-top: 1.5rem; }
}
</style>
