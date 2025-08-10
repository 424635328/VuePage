<!-- src/components/editor/panels/LayersPanel.vue -->

<template>
  <div class="panel">
    <h3 class="panel-title">图层</h3>
    <div class="panel-content">
      <ul class="layer-list">
        <li v-for="layer in reversedLayers" :key="layer.id"
            :class="{ active: layer.id === store.activeLayerId }"
            @click="store.setActiveLayerId(layer.id)">
          <span class="layer-visibility" @click.stop="toggleVisibility(layer)">
            {{ layer.isVisible ? '👁️' : '➖' }}
          </span>
          <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
          <span class="layer-lock" @click.stop="toggleLock(layer)">
            {{ layer.isLocked ? '🔒' : '' }}
          </span>
        </li>
      </ul>
      <div class="layer-actions">
        <button title="新图层" disabled>➕</button>
        <button title="复制图层" disabled>📋</button>
        <button title="删除图层" disabled>🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useImageEditorStore } from '../../../stores/imageEditor';

const store = useImageEditorStore();

const reversedLayers = computed(() => [...store.layers].reverse());

const toggleVisibility = (layer) => {
  if (layer.isLocked) return;
  store.updateActiveLayerAndRecordHistory(
    `${layer.isVisible ? '隐藏' : '显示'}图层`,
    (activeLayer) => {
      activeLayer.isVisible = !activeLayer.isVisible;
    }
  );
}

const toggleLock = (layer) => {
  if (layer.id === store.activeLayerId) return;
  store.updateActiveLayerAndRecordHistory(
    `${layer.isLocked ? '解锁' : '锁定'}图层`,
    (activeLayer) => {
      activeLayer.isLocked = !activeLayer.isLocked;
    }
  );
}

</script>

<style scoped>
/* 在 <style scoped> 内部 */
.panel {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
}
.panel-title {
    font-size: var(--font-size-normal);
    font-weight: 600;
    padding: 8px var(--panel-padding);
    background-color: rgba(255, 255, 255, 0.05);
    margin: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.panel-content { padding: 0; }
.layer-list li:hover { background-color: rgba(255, 255, 255, 0.1); }
.layer-list li.active {
    /* ✨ 修改点: 激活状态也使用半透明颜色 */
    background-color: rgba(0, 122, 204, 0.7); /* var(--accent-color) with alpha */
    color: white;
}
.layer-list li:hover { background-color: var(--bg-color-light); }
.layer-list li.active { background-color: var(--accent-color); color: white; }
.layer-visibility, .layer-lock { padding: 0 8px; opacity: 0.8; }
.layer-name {
  flex-grow: 1;
  /* ✨ 增加文本溢出处理 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px; /* Give some space before the lock icon */
}
.layer-actions { display: flex; justify-content: space-around; padding: 8px; border-top: 1px solid var(--border-color); }
.layer-actions button { background: none; border: none; color: var(--text-color-secondary); font-size: 1.2rem; cursor: pointer; }
.layer-actions button:hover:not(:disabled) { color: var(--text-color-primary); }
.layer-actions button:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
