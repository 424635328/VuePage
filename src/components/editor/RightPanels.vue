<template>
  <div class="right-panels-container" ref="containerRef">
    <div v-if="store.isImageLoaded" class="panels-wrapper">
      <!-- 上方面板：调整 -->
      <div class="top-panel panel-container" :style="{ height: `${topPanelHeight}px` }">
        <AdjustmentsPanel />
      </div>

      <!-- 分隔条 -->
      <div class="panel-resizer" @mousedown="startResize"></div>

      <!-- 下方面板：图层/历史记录 -->
      <div class="bottom-panel panel-container">
        <!-- Tab 切换 -->
        <div class="tab-header">
          <button
            :class="{ active: activeTab === 'layers' }"
            @click="activeTab = 'layers'">
            图层
          </button>
          <button
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'">
            历史记录
          </button>
        </div>
        <!-- Tab 内容 -->
        <div class="tab-content">
          <LayersPanel v-show="activeTab === 'layers'" />
          <HistoryPanel v-show="activeTab === 'history'" />
        </div>
      </div>
    </div>
    <div v-else class="right-panels-placeholder">
        <p>请先打开一张图片</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import AdjustmentsPanel from './panels/AdjustmentsPanel.vue';
import LayersPanel from './panels/LayersPanel.vue';
import HistoryPanel from './panels/HistoryPanel.vue';
import { useImageEditorStore } from '../../stores/imageEditor';

const store = useImageEditorStore();
const activeTab = ref('layers');

// --- 面板大小调整逻辑 ---
const containerRef = ref(null);
const topPanelHeight = ref(350); // 初始高度
const startY = ref(0);
const startHeight = ref(0);

const startResize = (event) => {
  event.preventDefault();
  startY.value = event.clientY;
  startHeight.value = topPanelHeight.value;
  window.addEventListener('mousemove', doResize);
  window.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'ns-resize'; // 改变鼠标样式
};

const doResize = (event) => {
  const dy = event.clientY - startY.value;
  const newHeight = startHeight.value + dy;
  const containerHeight = containerRef.value?.clientHeight || 0;
  // 限制最小和最大高度
  if (newHeight > 150 && newHeight < containerHeight - 150) {
    topPanelHeight.value = newHeight;
  }
};

const stopResize = () => {
  window.removeEventListener('mousemove', doResize);
  window.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = ''; // 恢复鼠标样式
};

onUnmounted(() => {
  // 确保组件卸载时移除事件监听
  window.removeEventListener('mousemove', doResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.right-panels-container {
    background-color: rgba(30, 30, 30, 0.6);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}
.panels-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.panel-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top-panel {
  flex-shrink: 0; /* 高度由 JS 控制 */
}
.bottom-panel {
  flex-grow: 1; /* 占据剩余空间 */
}

/* 分隔条样式 */
.panel-resizer {
  height: 5px;
  background-color: rgba(255, 255, 255, 0.05);
  cursor: ns-resize;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s ease;
}
.panel-resizer:hover {
  background-color: var(--accent-color);
}

/* Tab 样式 */
.tab-header {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}
.tab-header button {
  flex-grow: 1;
  padding: 10px;
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: var(--font-size-normal);
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}
.tab-header button:hover {
  color: var(--text-color-primary);
}
.tab-header button.active {
  color: var(--text-color-primary);
  border-bottom-color: var(--accent-color);
  background-color: rgba(255, 255, 255, 0.05);
}
.tab-content {
  flex-grow: 1;
  overflow: hidden; /* 让子组件处理自己的滚动 */
  position: relative;
}
.tab-content > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.right-panels-placeholder {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
}

/* 子面板的滚动条样式 */
.top-panel, .tab-content {
  overflow-y: auto;
}
.top-panel::-webkit-scrollbar,
.tab-content::-webkit-scrollbar {
  width: 8px;
}
.top-panel::-webkit-scrollbar-track,
.tab-content::-webkit-scrollbar-track {
  background: transparent;
}
.top-panel::-webkit-scrollbar-thumb,
.tab-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.top-panel::-webkit-scrollbar-thumb:hover,
.tab-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
