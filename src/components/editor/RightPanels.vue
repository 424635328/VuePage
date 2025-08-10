<!-- src/components/editor/RightPanels.vue -->

<template>
  <div class="right-panels-container">
    <div v-if="store.isImageLoaded" class="right-panels">
        <AdjustmentsPanel />
        <LayersPanel />
        <HistoryPanel />
    </div>
    <div v-else class="right-panels-placeholder">
        <p>请先打开一张图片</p>
    </div>
  </div>
</template>

<script setup>
import AdjustmentsPanel from './panels/AdjustmentsPanel.vue';
import LayersPanel from './panels/LayersPanel.vue';
import HistoryPanel from './panels/HistoryPanel.vue';
import { useImageEditorStore } from '../../stores/imageEditor';

const store = useImageEditorStore();
</script>

<style scoped>
.right-panels-container {
    /* ✨ 修改点: 使用半透明背景色和毛玻璃效果 */
    background-color: rgba(30, 30, 30, 0.6);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);

    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}
.right-panels {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 10px;
  gap: 10px;
}
.right-panels-placeholder {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
}
</style>
