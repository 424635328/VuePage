<!-- src/components/editor/panels/AdjustmentsPanel.vue -->

<template>
  <div class="panel" v-if="store.activeLayer">
    <h3 class="panel-title">调整</h3>
    <div class="panel-content">
      <div v-for="adj in adjustments" :key="adj.key" class="adjustment-item">
        <label :for="adj.key">{{ adj.label }}</label>
        <div class="slider-group">
          <input
            type="range"
            :id="adj.key"
            :min="adj.min"
            :max="adj.max"
            :step="adj.step || 1"
            :value="store.activeLayer.adjustments[adj.key]"
            @input="handleInput(adj.key, $event.target.value)"
            @change="handleChange(adj.label, adj.key, $event.target.value)"
            :disabled="store.activeLayer.isLocked"
          />
          <input
            type="number"
            class="slider-value"
            :value="store.activeLayer.adjustments[adj.key]"
            @change="handleNumberChange(adj.label, adj.key, $event.target.value)"
            :disabled="store.activeLayer.isLocked"
          >
        </div>
      </div>
      <button
        class="reset-btn"
        @click="resetAdjustments"
        :disabled="store.activeLayer.isLocked">
        重置调整
      </button>
    </div>
  </div>
</template>

<script setup>
import { useImageEditorStore } from '../../../stores/imageEditor';
const store = useImageEditorStore();

const adjustments = [
  { key: 'brightness', label: '亮度', min: -100, max: 100 },
  { key: 'contrast', label: '对比度', min: -100, max: 100 },
  { key: 'saturate', label: '饱和度', min: -100, max: 100 },
  { key: 'hue', label: '色相', min: -180, max: 180 },
  { key: 'blur', label: '模糊', min: 0, max: 50 },
];

// 实时更新视觉，不记录历史
const handleInput = (key, value) => {
  store.updateActiveLayerAdjustment(key, value);
};

// ‼️ 修复点: 确保最终值被提交并记录到历史
// 当滑块拖动结束时触发
const handleChange = (label, key, value) => {
  store.updateActiveLayerAndRecordHistory(`调整${label}`, (layer) => {
    layer.adjustments[key] = Number(value);
  });
};

// ‼️ 修复点: 当直接输入数字时触发
const handleNumberChange = (label, key, value) => {
  // 直接调用 handleChange 来统一逻辑
  handleChange(label, key, value);
}

const resetAdjustments = () => {
    store.updateActiveLayerAndRecordHistory('重置调整', layer => {
        Object.assign(layer.adjustments, {
            brightness: 0, contrast: 0, saturate: 0, hue: 0, blur: 0,
        });
    });
}
</script>

<style scoped>
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
.panel-content { padding: var(--panel-padding); }

.adjustment-item { margin-bottom: 12px; }
.adjustment-item label { display: block; font-size: var(--font-size-small); margin-bottom: 6px; color: var(--text-color-secondary); }
.slider-group { display: flex; align-items: center; gap: 10px; }

input[type="range"] {
  flex-grow: 1;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--bg-color-deepest);
  border-radius: 2px;
  outline: none;
  transition: opacity .2s;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--text-color-primary);
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid var(--bg-color-deep);
}
input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--text-color-primary);
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid var(--bg-color-deep);
}
input[type="range"]:disabled::-webkit-slider-thumb,
input[type="range"]:disabled::-moz-range-thumb {
    background: var(--text-color-disabled);
    cursor: not-allowed;
}
input[type="range"]:disabled { cursor: not-allowed; }

.slider-value {
  width: 45px;
  background-color: var(--bg-color-deepest);
  border: 1px solid var(--border-color);
  color: var(--text-color-primary);
  border-radius: 4px;
  text-align: center;
  padding: 4px;
  font-size: var(--font-size-small);
}
.slider-value:focus {
  outline: none;
  border-color: var(--accent-color);
}
.slider-value:disabled {
    background-color: var(--bg-color-deep);
    color: var(--text-color-disabled);
    cursor: not-allowed;
}

.reset-btn {
  width: 100%;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-color-primary);
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.15s ease;
}
.reset-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.15);
}
.reset-btn:disabled {
  background-color: transparent;
  color: var(--text-color-disabled);
  cursor: not-allowed;
}
</style>
