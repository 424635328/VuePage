<template>
  <div class="image-editor-page"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop">

    <TopMenuBar @open-file="triggerFileInput" />

    <main class="editor-main-content">
      <EditorToolbar />
      <CanvasArea ref="canvasAreaRef" />
      <RightPanels />
    </main>

    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-overlay-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <span>拖拽到此处以上传图片</span>
      </div>
    </div>
    <input ref="fileInputRef" type="file" @change="handleFileSelect" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" style="display: none;" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import TopMenuBar from '../components/editor/TopMenuBar.vue';
import EditorToolbar from '../components/editor/EditorToolbar.vue';
import CanvasArea from '../components/editor/CanvasArea.vue';
import RightPanels from '../components/editor/RightPanels.vue';
import { useImageEditorStore } from '../stores/imageEditor';

const store = useImageEditorStore();
const fileInputRef = ref(null);
const canvasAreaRef = ref(null);
const isDragging = ref(false);

const triggerFileInput = () => { fileInputRef.value?.click(); };
const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) loadImageFromFile(file);
};
const handleDragOver = () => { isDragging.value = true; };
const handleDragLeave = () => { isDragging.value = false; };
const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files?.[0];
  if (file && file.type.startsWith('image/')) loadImageFromFile(file);
};
const loadImageFromFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => { store.loadImage(img); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const handleKeyDown = (event) => {
  const target = event.target;
  // 核心修复：如果事件的目标是输入框或文本区域，则不处理全局快捷键
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    if (event.key === 'z') { event.preventDefault(); store.undo(); }
    if (event.key === 'y') { event.preventDefault(); store.redo(); }
  }
  if (event.code === 'Space' && !event.repeat) { event.preventDefault(); canvasAreaRef.value?.startPanning(); }
};
const handleKeyUp = (event) => {
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }
  if (event.code === 'Space') canvasAreaRef.value?.stopPanning();
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style>
:root {
  --bg-color-deepest: #202020;
  --bg-color-deeper: #252526;
  --bg-color-deep: #2d2d30;
  --bg-color-normal: #333333;
  --bg-color-light: #3c3c3c;
  --bg-color-lightest: #4a4a4a;
  --border-color: #454545;
  --border-color-light: #5a5a5a;
  --text-color-primary: #cccccc;
  --text-color-secondary: #999999;
  --text-color-disabled: #666666;
  --accent-color: #007acc;
  --accent-color-hover: #0095ff;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-small: 0.8rem;
  --font-size-normal: 0.9rem;
  --panel-padding: 12px;
  --control-height: 28px;
}
.image-editor-page, .image-editor-page * { box-sizing: border-box; }
.image-editor-page {
  background-color: transparent;
  color: var(--text-color-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  font-family: var(--font-family);
  font-size: var(--font-size-normal);
  overflow: hidden;
  user-select: none;
}
.editor-main-content {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 52px 1fr 280px;
  background-color: transparent;
  min-height: 0;
  min-width: 0;
}
.drag-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 122, 255, 0.2);
  border: 3px dashed rgba(0, 122, 255, 0.8);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; pointer-events: none;
}
.drag-overlay-content {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; font-size: 1.2rem; font-weight: 500;
  color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
</style>
