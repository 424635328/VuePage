<!-- src/components/editor/panels/HistoryPanel.vue -->

<template>
  <div class="panel">
    <h3 class="panel-title">历史记录</h3>
    <div class="panel-content">
      <ul class="history-list">
        <li v-for="(step, index) in store.history" :key="step.id"
            :class="{ active: index === store.historyIndex }"
            @click="goToHistory(index)"
            :title="step.name">
          {{ step.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useImageEditorStore } from '../../../stores/imageEditor';

const store = useImageEditorStore();

const goToHistory = (index) => {
  if (store.historyIndex > index) {
      while(store.historyIndex > index) store.undo();
  } else if (store.historyIndex < index) {
      while(store.historyIndex < index) store.redo();
  }
}
</script>

<style scoped>
/* 在 <style scoped> 内部 */
.panel {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    overflow: hidden;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}
.panel-title {
    font-size: var(--font-size-normal);
    font-weight: 600;
    padding: 8px var(--panel-padding);
    background-color: rgba(255, 255, 255, 0.05);
    margin: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.panel-content { padding: 0; flex-grow: 1; overflow-y: auto; }
.history-list { list-style: none; margin: 0; padding: 0; }
.history-list li {
  padding: 8px 12px;
  font-size: var(--font-size-small);
  cursor: pointer;
  border-bottom: 1px solid var(--bg-color-deeper);
  color: var(--text-color-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
  /* ✨ 增加文本溢出处理 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-list li:hover { background-color: var(--bg-color-light); }
.history-list li.active { background-color: var(--accent-color); color: white; }
</style>
