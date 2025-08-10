<template>
  <div class="history-panel-container">
    <div class="panel-content">
      <ul class="history-list">
        <li v-for="(step) in reversedHistory" :key="step.id"
            :class="{ active: store.historyIndex === step.originalIndex }"
            @click="goToHistory(step.originalIndex)">
          {{ step.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useImageEditorStore } from '../../../stores/imageEditor';

const store = useImageEditorStore();

// 创建一个反向的、且包含原始索引的历史记录数组，便于渲染和点击
const reversedHistory = computed(() =>
    [...store.history].map((step, index) => ({ ...step, originalIndex: index })).reverse()
);

const goToHistory = (index) => {
  if (store.historyIndex > index) {
      while(store.historyIndex > index) store.undo();
  } else if (store.historyIndex < index) {
      while(store.historyIndex < index) store.redo();
  }
}
</script>

<style scoped>
.history-panel-container {
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

.history-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.history-list li {
  padding: 8px 12px;
  font-size: var(--font-size-small);
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 4px;
  margin-bottom: 2px;
}
.history-list li:hover {
    background-color: rgba(255, 255, 255, 0.1);
}
.history-list li.active {
    background-color: var(--accent-color);
    color: white;
    font-weight: 500;
}
</style>
