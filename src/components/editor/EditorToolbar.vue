<!-- src/components/editor/EditorToolbar.vue -->

<template>
  <aside class="toolbar">
    <div v-for="tool in tools" :key="tool.id"
      class="tool-button"
      :class="{ active: store.activeTool === tool.id }"
      :title="`${tool.name} (${tool.shortcut})`"
      @click="store.setActiveTool(tool.id)"
      v-html="tool.icon">
    </div>
  </aside>
</template>

<script setup>
import { useImageEditorStore } from '../../stores/imageEditor';
const store = useImageEditorStore();

const tools = [
  { id: 'select', name: '移动工具', shortcut: 'V', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>` },
  { id: 'crop', name: '裁剪工具', shortcut: 'C', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>` },
  { id: 'brush', name: '画笔工具', shortcut: 'B', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>` },
  { id: 'text', name: '文字工具', shortcut: 'T', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>` },
];
</script>

<style scoped>
.toolbar {
  /* ✨ 修改点: 使用半透明背景色和毛玻璃效果 */
  background-color: rgba(30, 30, 30, 0.6);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);

  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 4px;
  align-items: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}
.tool-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-color-primary);
  transition: background-color 0.15s ease, color 0.15s ease;
}
.tool-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.tool-button.active {
  background-color: var(--accent-color);
  color: white;
}
</style>
