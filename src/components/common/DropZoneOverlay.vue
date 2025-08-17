<!-- src/components/common/DropZoneOverlay.vue -->

<script setup>
import { ref } from 'vue';

defineProps({
  isUploading: {
    type: Boolean,
    default: false,
  },
  uploadCount: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  // ✨ 新增：允许自定义标题
  title: {
    type: String,
    default: '将图片拖到此处',
  },
  // ✨ 新增：允许自定义提示语
  prompt: {
    type: String,
    default: '松开鼠标即可自动创建新商品并上传',
  },
});

const emit = defineEmits(['files-dropped', 'close']);

const isDragOver = ref(false);

function onDragLeave(event) {
  if (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight) {
    isDragOver.value = false;
    emit('close');
  }
}

function onDrop(event) {
  isDragOver.value = false;
  const files = event.dataTransfer.files;
  if (files && files.length > 0) {
    emit('files-dropped', [...files]);
  } else {
    emit('close');
  }
}
</script>

<template>
  <div
    class="drop-zone-overlay"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent="isDragOver = true"
    @drop.prevent="onDrop"
  >
    <div class="drop-zone-content" :class="{ 'is-drag-over': isDragOver }">
      <div v-if="isUploading" class="uploading-state">
        <div class="spinner"></div>
        <h2>正在上传图片...</h2>
        <p>已完成 {{ uploadCount }} / {{ totalCount }}</p>
        <div class="progress-bar">
            <div class="progress" :style="{ width: `${totalCount > 0 ? (uploadCount / totalCount) * 100 : 0}%` }"></div>
        </div>
      </div>
      <div v-else class="prompt-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <!-- ✨ 使用 props 动态显示文本 -->
        <h2>{{ title }}</h2>
        <p>{{ prompt }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 样式无需改动，保持原样 */
.drop-zone-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(10, 20, 30, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
}

.drop-zone-content {
  border: 3px dashed var(--color-border-hover);
  border-radius: 24px;
  width: 95%;
  height: 95%;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background-color 0.3s ease, border-color 0.3s ease;

  &.is-drag-over {
    background-color: rgba(56, 189, 248, 0.1);
    border-color: var(--color-primary);
  }
}

.prompt-state, .uploading-state {
    text-align: center;
    h2 {
        font-size: 2.5rem;
        margin: 1.5rem 0 0.5rem;
        color: var(--color-heading);
    }
    p {
        font-size: 1.2rem;
        color: var(--color-text-dark);
    }
}

.spinner {
  width: 60px; height: 60px; border: 5px solid var(--color-border);
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin 1s linear infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

.progress-bar {
    width: 300px;
    height: 10px;
    background-color: var(--color-border);
    border-radius: 5px;
    margin-top: 1.5rem;
    overflow: hidden;
    .progress {
        height: 100%;
        background-color: var(--color-primary);
        border-radius: 5px;
        transition: width 0.3s ease;
    }
}
</style>
