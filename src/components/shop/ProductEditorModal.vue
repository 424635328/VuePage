<!-- src/components/shop/ProductEditorModal.vue -->

<script setup>
import { ref, watch, computed } from 'vue';
import { useProductsStore } from '@/stores/products';

const props = defineProps({
  active: Boolean,
  product: {
    type: Object,
    default: null
  }
});
const emit = defineEmits(['update:active', 'close']);

const productsStore = useProductsStore();

const form = ref({
  id: null,
  name: '',
  description: '',
  image_url: null,
});
const imageFile = ref(null);
const imagePreview = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');

const isEditing = computed(() => !!props.product);

watch(() => props.active, (isActive) => {
  if (isActive) {
    errorMessage.value = '';
    if (props.product) {
      form.value = { ...props.product };
      imagePreview.value = props.product.image_url;
    } else {
      resetForm();
    }
  }
});

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function resetForm() {
  form.value = { id: null, name: '', description: '', image_url: null };
  imageFile.value = null;
  imagePreview.value = null;
}

async function handleSubmit() {
  if (!form.value.name) {
    errorMessage.value = '商品名称不能为空。';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const formData = { name: form.value.name, description: form.value.description, image_url: form.value.image_url };
    let result;
    if (isEditing.value) {
      result = await productsStore.updateProduct(props.product.id, formData, imageFile.value);
    } else {
      result = await productsStore.addProduct(formData, imageFile.value);
    }

    if (result) {
      closeModal();
    } else {
      throw new Error(productsStore.error || '操作失败，请重试。');
    }
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function closeModal() {
  emit('update:active', false);
  emit('close');
  resetForm();
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="active" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-container">
        <header class="modal-header">
          <h2>{{ isEditing ? '编辑商品' : '新增商品' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </header>
        <main class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="name">商品名称 *</label>
              <input type="text" id="name" v-model="form.name" required />
            </div>
            <div class="form-group">
              <label for="description">商品描述</label>
              <textarea id="description" v-model="form.description" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label for="image">商品图片</label>
              <input type="file" id="image" @change="handleFileChange" accept="image/*" />
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="图片预览" />
              </div>
            </div>
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          </form>
        </main>
        <footer class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">取消</button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>{{ isEditing ? '保存更新' : '确认添加' }}</span>
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-container {
  background-color: #1e1e1e;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header, .modal-footer {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header {
  border-bottom: 1px solid var(--color-border);
  h2 { font-size: 1.5rem; color: var(--color-heading); }
}
.modal-footer {
  border-top: 1px solid var(--color-border);
  gap: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text);
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.5rem;
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text-dark);
  }
  input[type="text"], textarea {
    width: 100%;
    padding: 0.75rem;
    background-color: #2a2a2a;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text);
    font-size: 1rem;
  }
  input[type="file"] {
      color: var(--color-text);
  }
}

.image-preview {
  margin-top: 1rem;
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
  }
}

.error-message {
  color: #e53e3e;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  &.btn-primary {
    background-color: var(--color-primary);
    color: #1a1a1a;
  }
  &.btn-secondary {
    background-color: #3a3a3a;
    color: var(--color-text);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .spinner {
      display: inline-block;
      width: 1em; height: 1em;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
