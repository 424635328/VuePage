<!-- src/views/ProductEditPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import imageCompression from 'browser-image-compression';
import draggable from 'vuedraggable';

import DropZoneOverlay from '@/components/common/DropZoneOverlay.vue';
import { useProductsStore } from '@/stores/products';
import { useToastStore } from '@/stores/toast';
import { supabase } from '@/lib/supabaseClient';

const route = useRoute();
const router = useRouter();
const productsStore = useProductsStore();
const toastStore = useToastStore();

const form = ref({ id: null, public_id: null, name: '', description: '' });
const images = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const isDragOver = ref(false);
const fileInput = ref(null);

const isDropZoneVisible = ref(false);
// NEW: 添加一个状态来跟踪 vuedraggable 是否正在拖拽
const isReordering = ref(false);

const publicId = computed(() => route.params.public_id);
const isEditing = computed(() => !!publicId.value);
const pageTitle = computed(() => isEditing.value ? '编辑商品' : '创建新商品');

onMounted(async () => {
  if (isEditing.value) {
    await loadProductForEdit(publicId.value);
  } else {
    loading.value = false;
  }
  // MODIFIED: 添加 'dragleave' 事件监听
  window.addEventListener('dragenter', handleDragEnter);
  window.addEventListener('dragleave', handleDragLeave);
});

onUnmounted(() => {
  // MODIFIED: 移除 'dragleave' 事件监听
  window.removeEventListener('dragenter', handleDragEnter);
  window.removeEventListener('dragleave', handleDragLeave);
});

async function loadProductForEdit(pid) {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: functionError } = await supabase.functions.invoke('get-product-details', {
      body: { public_id: pid },
    });
    if (functionError) throw functionError;
    if (data.error) throw new Error(data.error);
    form.value = {
      id: data.id,
      public_id: data.public_id,
      name: data.name,
      description: data.description,
    };
    images.value = data.images || [];
  } catch (e) {
    error.value = "无法加载商品数据。";
    console.error("加载编辑数据失败:", e);
    toastStore.showToast({ msg: e.message, toastType: 'error' });
  } finally {
    loading.value = false;
  }
}

// MODIFIED: 增强 handleDragEnter 以区分文件拖拽和元素拖拽
function handleDragEnter(event) {
  // EXPLANATION:
  // 1. 如果正在保存或正在进行内部排序，则不显示浮层。
  // 2. event.dataTransfer.types.includes('Files') 是关键检查。
  //    只有从操作系统拖入文件时，该类型才会存在。
  //    vuedraggable 的内部拖拽不包含 'Files' 类型。
  if (saving.value || isReordering.value) return;

  if (event.dataTransfer.types.includes('Files')) {
    isDropZoneVisible.value = true;
  }
}

// NEW: 添加 handleDragLeave 用于在拖拽离开窗口时隐藏浮层
function handleDragLeave(event) {
  // EXPLANATION:
  // 当鼠标离开浏览器窗口时，dragleave 事件的 relatedTarget 为 null。
  // 这个检查可以防止在窗口内部元素之间移动时错误地隐藏浮层。
  if (event.relatedTarget === null) {
    isDropZoneVisible.value = false;
  }
}

async function handleFilesDropped(files) {
  isDropZoneVisible.value = false;
  await processFiles(files);
}

function triggerFileInput() {
  fileInput.value.click();
}

async function processFiles(files) {
  if (!files || files.length === 0) return;
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    toastStore.showToast({ msg: '没有有效的图片文件', toastType: 'warning' });
    return;
  }

  const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
  toastStore.showToast({ msg: `正在处理 ${imageFiles.length} 张图片...`, toastType: 'info' });
  try {
    const compressionPromises = imageFiles.map(file => imageCompression(file, options));
    const compressedFiles = await Promise.all(compressionPromises);
    compressedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        images.value.push({
          id: `new-${Date.now()}-${Math.random()}`,
          image_url: e.target.result,
          _file: file,
        });
      };
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error('Image processing failed:', err);
    toastStore.showToast({ msg: '图片处理失败', toastType: 'error' });
  } finally {
    if (fileInput.value) fileInput.value.value = '';
  }
}

async function handleFileChange(event) { await processFiles(event.target.files); }
async function handleDrop(event) { isDragOver.value = false; await processFiles(event.dataTransfer.files); }
function removeImage(index) { images.value.splice(index, 1); }

async function handleSubmit() {
  if (!form.value.name.trim()) {
    toastStore.showToast({ msg: '商品名称不能为空', toastType: 'error' });
    return;
  }
  saving.value = true;
  try {
    const newImageFilesToUpload = images.value.filter(img => img._file).map(img => img._file);
    const existingImagesForUpdate = images.value.filter(img => !img._file).map(img => ({ id: img.id, image_url: img.image_url, position: img.position }));
    let result;
    if (isEditing.value) {
      result = await productsStore.updateProduct(form.value.id, form.value, newImageFilesToUpload, existingImagesForUpdate);
    } else {
      result = await productsStore.addProduct(form.value, newImageFilesToUpload);
    }
    if (result) {
      toastStore.showToast({ msg: `商品 "${result.name}" 已保存!` });
      router.push({ name: 'product-details', params: { public_id: result.public_id } });
    }
  } catch (err) {
    console.error("Submit error:", err);
    toastStore.showToast({ msg: '保存失败，请稍后重试', toastType: 'error' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="edit-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="error-state">
      <h2>{{ error }}</h2>
      <router-link to="/shop" class="btn btn-primary">返回商店</router-link>
    </div>

    <div v-else class="container">
      <header class="page-header">
        <button @click="router.back()" class="back-button" title="返回上一页">&larr;</button>
        <h1>{{ pageTitle }}</h1>
      </header>

      <form @submit.prevent="handleSubmit" class="edit-form">
        <div class="form-group">
          <label for="name">商品名称 *</label>
          <input type="text" id="name" v-model.trim="form.name" required placeholder="例如：谷歌邮箱账号" />
        </div>

        <div class="form-group">
          <label for="description">商品描述 (支持 Markdown)</label>
          <textarea id="description" v-model="form.description" rows="12" placeholder="在这里详细描述您的商品..."></textarea>
        </div>

        <div class="form-group">
          <label>商品画廊 (拖拽第一张作为封面)</label>
          <input type="file" multiple ref="fileInput" @change="handleFileChange"
            accept="image/png, image/jpeg, image/webp" class="file-input-hidden" />

          <div class="gallery-container">
            <!-- MODIFIED: 添加 @start 和 @end 事件监听来控制 isReordering 状态 -->
            <draggable
              v-model="images"
              item-key="id"
              class="image-gallery-grid"
              ghost-class="ghost"
              @start="isReordering = true"
              @end="isReordering = false"
            >
              <template #item="{ element, index }">
                <div class="gallery-item">
                  <img :src="element.image_url" :alt="form.name" class="gallery-image" />
                  <button type="button" @click.prevent="removeImage(index)" class="delete-image-btn"
                    title="删除图片">&times;</button>
                  <div v-if="index === 0" class="thumbnail-badge">封面</div>
                </div>
              </template>
            </draggable>

            <div class="upload-placeholder" :class="{ 'dragover': isDragOver }" @click="triggerFileInput"
              @dragover.prevent @dragenter.prevent="isDragOver = true" @dragleave.prevent="isDragOver = false"
              @drop.prevent="handleDrop" role="button" aria-label="添加图片或拖拽图片到此区域">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>添加图片</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="router.push({ name: 'shop' })" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="saving || loading">
            <span v-if="saving" class="spinner-small"></span>
            <span v-else>保存商品</span>
          </button>
        </div>
      </form>
    </div>

    <!-- DropZoneOverlay 组件本身无需修改 -->
    <DropZoneOverlay
      v-if="isDropZoneVisible"
      title="添加图片"
      prompt="松开鼠标即可将图片添加到当前商品"
      @close="isDropZoneVisible = false"
      @files-dropped="handleFilesDropped"
    />

  </div>
</template>

<style lang="scss" scoped>
/* 样式无需修改 */
@use '@/assets/styles/index.scss' as *;

.edit-page {
  padding: 4rem 0;
  animation: fadeIn 0.5s ease-out;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    color: var(--color-heading);
    margin: 0;
  }
}

.back-button {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;

  &:hover {
    background: var(--color-primary);
    color: #1a1a1a;
  }
}

.edit-form {
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 2rem;

  label {
    display: block;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text);
  }

  input[type="text"],
  textarea {
    width: 100%;
    padding: 0.8rem 1rem;
    background-color: var(--color-background-input);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text);
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: var(--color-primary);
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
    }
  }

  textarea {
    resize: vertical;
    min-height: 150px;
    font-family: inherit;
  }
}

.file-input-hidden {
  display: none;
}

.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.image-gallery-grid {
  display: contents;
}

.gallery-item {
  position: relative;
  cursor: grab;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);

  &:active {
    cursor: grabbing;
  }

  .gallery-image {
    width: 100%;
    display: block;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }

  .delete-image-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    line-height: 1;
    padding: 0;

    &:hover {
      background-color: #ef4444;
    }
  }

  .thumbnail-badge {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(var(--color-primary-rgb), 0.8);
    color: #1a1a1a;
    padding: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
  }
}

.ghost {
  opacity: 0.5;
  background: #2c3e50;
}

.upload-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--color-text-dark);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background-color 0.2s;

  span {
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  &:hover,
  &.dragover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.btn-primary {
    background-color: var(--color-primary);
    color: #1a1a1a;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.2);
    }
  }

  &.btn-secondary {
    background-color: var(--color-background-mute);
    color: var(--color-text);

    &:hover:not(:disabled) {
      background-color: var(--color-border-hover);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.spinner,
.spinner-small {
  width: 1.2em;
  height: 1.2em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.loading-state {
  .spinner {
    width: 50px;
    height: 50px;
    border-width: 4px;
    margin-bottom: 1.5rem;
  }
}

.error-state {
  h2 {
    margin-bottom: 1.5rem;
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;

  h2 {
    font-size: 1.5rem;
    color: var(--color-heading);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
