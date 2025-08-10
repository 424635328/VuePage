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

// ✨ 使用统一、专业的 Feather Icons 图标集
const tools = [
  { id: 'select', name: '移动工具', shortcut: 'V', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-move"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>` },
  { id: 'crop', name: '裁剪工具', shortcut: 'C', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-crop"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>` },
  { id: 'brush', name: '画笔工具', shortcut: 'B', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-3"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>` },
  { id: 'text', name: '文字工具', shortcut: 'T', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-type"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>` },
];
</script>

<style scoped>
.toolbar {
  background-color: rgba(30, 30, 30, 0.6);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
  align-items: center;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}
.tool-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color-primary);
  transition: all 0.15s ease;
}
.tool-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.tool-button.active {
  background-color: var(--accent-color);
  color: white;
  transform: scale(1.05);
}
</style>
