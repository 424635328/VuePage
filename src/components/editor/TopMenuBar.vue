<!-- src/components/editor/TopMenuBar.vue -->

<template>
  <header class="top-menu-bar">
    <div class="menu-item">
      <span>文件</span>
      <div class="dropdown-content">
        <a @click="$emit('open-file')">打开...</a>
        <a href="#" class="disabled">保存</a>
        <div class="menu-item-sub">
          <a>导出为 ▸</a>
          <div class="dropdown-content-sub">
            <a @click="store.exportImage('image/png')" :class="{ disabled: !store.isImageLoaded }">PNG</a>
            <a @click="store.exportImage('image/jpeg')" :class="{ disabled: !store.isImageLoaded }">JPEG</a>
            <a @click="store.exportImage('image/webp')" :class="{ disabled: !store.isImageLoaded }">WEBP</a>
          </div>
        </div>
      </div>
    </div>
    <div class="menu-item">
      <span>编辑</span>
       <div class="dropdown-content">
        <a @click="store.undo()" :class="{ disabled: !store.canUndo }">撤销 (Ctrl+Z)</a>
        <a @click="store.redo()" :class="{ disabled: !store.canRedo }">重做 (Ctrl+Y)</a>
      </div>
    </div>
    <div class="view-controls">
      <span>缩放: {{ Math.round(store.zoom * 100) }}%</span>
    </div>
  </header>
</template>

<script setup>
import { useImageEditorStore } from '../../stores/imageEditor';
const store = useImageEditorStore();
defineEmits(['open-file']);
</script>

<style scoped>
.top-menu-bar {
  height: 40px;
  background-color: rgba(30, 30, 30, 0.6);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);

  display: flex;
  align-items: center;
  padding: 0 10px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  /* ‼️ 修复点: 创建一个新的堆叠上下文并提升层级 */
  position: relative;
  z-index: 1000;
}
.menu-item, .menu-item-sub {
  position: relative;
  padding: 0 12px;
  line-height: 40px;
  cursor: pointer;
  font-size: var(--font-size-normal);
  border-radius: 4px;
}
.menu-item:hover, .menu-item-sub:hover { background-color: rgba(255, 255, 255, 0.1); }

.dropdown-content, .dropdown-content-sub {
  display: none;
  position: absolute;
  background-color: rgba(45, 45, 45, 0.7);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);

  min-width: 200px;
  box-shadow: 0px 8px 24px rgba(0,0,0,0.5);
  /* ‼️ 修复点: 确保下拉菜单的 z-index 也足够高 */
  z-index: 1001;
  border-radius: 6px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.dropdown-content {
  top: 42px;
  left: 0;
}
.dropdown-content-sub {
  top: -7px;
  left: 100%;
  min-width: 120px;
  /* ‼️ 修复点: 子菜单需要更高的 z-index */
  z-index: 1002;
}

.menu-item:hover .dropdown-content, .menu-item-sub:hover .dropdown-content-sub { display: block; }

.dropdown-content a {
  color: var(--text-color-primary);
  padding: 8px 12px;
  text-decoration: none;
  display: block;
  font-size: var(--font-size-normal);
  white-space: nowrap;
  border-radius: 4px;
}
.dropdown-content a:hover:not(.disabled) { background-color: var(--accent-color); }
.dropdown-content a.disabled { color: var(--text-color-disabled); cursor: not-allowed; }

.view-controls { margin-left: auto; font-size: var(--font-size-normal); color: var(--text-color-secondary); }
</style>
