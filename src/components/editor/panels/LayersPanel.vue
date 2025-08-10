<template>
  <div class="layers-panel-container">
    <div class="panel-content">
      <ul class="layer-list">
        <li v-for="layer in reversedLayers" :key="layer.id"
            :class="{ active: layer.id === store.activeLayerId, locked: layer.isLocked }"
            @click="store.setActiveLayerId(layer.id)">

          <span class="layer-icon layer-visibility" @click.stop="toggleVisibility(layer)">
             <svg v-if="layer.isVisible" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          </span>

          <span class="layer-name" :title="layer.name">{{ layer.name }}</span>

          <span class="layer-icon layer-lock" @click.stop="toggleLock(layer)">
            <svg v-if="layer.isLocked" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-lock"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-unlock unlocked-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
          </span>
        </li>
      </ul>
    </div>
    <div class="layer-actions">
        <button title="新图层" disabled>➕</button>
        <button title="复制图层" disabled>📋</button>
        <button title="删除图层" disabled>🗑️</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useImageEditorStore } from '../../../stores/imageEditor';

const store = useImageEditorStore();
const reversedLayers = computed(() => [...store.layers].reverse());

const toggleVisibility = (layer) => {
  store.setActiveLayerId(layer.id);
  // 如果图层已锁定，则不允许改变可见性
  if (store.activeLayer.isLocked) return;

  store.updateActiveLayerAndRecordHistory(
    `${layer.isVisible ? '隐藏' : '显示'}图层`,
    (activeLayer) => {
        activeLayer.isVisible = !activeLayer.isVisible;
    }
  );
}

const toggleLock = (layer) => {
    store.setActiveLayerId(layer.id);

    store.updateActiveLayerAndRecordHistory(
        `${layer.isLocked ? '解锁' : '锁定'}图层`,
        (activeLayer) => {
            activeLayer.isLocked = !activeLayer.isLocked;
        }
    );
}
</script>

<style scoped>
.layers-panel-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}
.panel-content {
    padding: 10px;
    flex-grow: 1;
    overflow-y: auto;
}
.panel-content::-webkit-scrollbar {
    width: 8px;
}
.panel-content::-webkit-scrollbar-track {
    background: transparent;
}
.panel-content::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
}
.panel-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
}

.layer-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.layer-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: var(--font-size-normal);
  transition: background-color 0.15s ease, opacity 0.15s ease;
}
.layer-list li:hover {
    background-color: rgba(255, 255, 255, 0.1);
}
.layer-list li.active {
    background-color: var(--accent-color);
    color: white;
}
.layer-list li.locked {
    opacity: 0.7;
}

.layer-icon {
    color: var(--text-color-secondary);
    line-height: 1;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}
.layer-icon:hover {
    background-color: rgba(255, 255, 255, 0.15);
}
li.active .layer-icon {
    color: white;
}
li.active .layer-icon:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.unlocked-icon {
    opacity: 0;
    transition: opacity 0.15s ease;
}
li:not(.locked):hover .unlocked-icon {
    opacity: 1;
}

.layer-name {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.layer-actions {
    display: flex;
    justify-content: space-around;
    padding: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}
.layer-actions button {
    background: none;
    border: none;
    color: var(--text-color-secondary);
    font-size: 1.2rem;
    cursor: pointer;
}
.layer-actions button:hover:not(:disabled) {
    color: var(--text-color-primary);
}
.layer-actions button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}
</style>
