<template>
  <div class="adjustments-panel" v-if="store.activeLayer">
    <div v-for="group in adjustmentGroups" :key="group.title" class="adjustment-group-container">
        <h3 class="panel-title">{{ group.title }}</h3>
        <div class="panel-content">
            <div v-for="adj in group.items" :key="adj.key" class="adjustment-item">
                <div class="label-group">
                    <label :for="adj.key">{{ adj.label }}</label>
                    <button
                        class="reset-single-btn"
                        @click="resetSingle(adj.key, `重置${adj.label}`)"
                        v-if="store.activeLayer.adjustments[adj.key] !== store.defaultAdjustments[adj.key]"
                        title="重置"
                    >
                        ⟲
                    </button>
                </div>
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
        </div>
    </div>
  </div>
</template>

<script setup>
import { useImageEditorStore } from '../../../stores/imageEditor';
const store = useImageEditorStore();

const adjustmentGroups = [
    {
        title: '光效',
        items: [
            { key: 'brightness', label: '亮度', min: -100, max: 100 },
            { key: 'contrast', label: '对比度', min: -100, max: 100 },
            { key: 'highlights', label: '高光', min: -100, max: 100 },
            { key: 'shadows', label: '阴影', min: -100, max: 100 },
        ]
    },
    {
        title: '色彩',
        items: [
            { key: 'saturate', label: '饱和度', min: -100, max: 100 },
            { key: 'vibrance', label: '自然饱和度', min: -100, max: 100 },
            { key: 'temperature', label: '色温', min: -100, max: 100 },
            { key: 'tint', label: '色调', min: -100, max: 100 },
            { key: 'hue', label: '色相', min: -180, max: 180 },
        ]
    },
    {
        title: '效果',
        items: [
            { key: 'sharpen', label: '锐化', min: 0, max: 100 },
            { key: 'blur', label: '模糊', min: 0, max: 50 },
            { key: 'vignette', label: '晕影', min: -100, max: 100 },
        ]
    }
];

const handleInput = (key, value) => {
  store.updateActiveLayerAdjustment(key, value);
};

const handleChange = (label, key, value) => {
  store.updateActiveLayerAndRecordHistory(`调整${label}`, (layer) => {
    layer.adjustments[key] = Number(value);
  });
};

const handleNumberChange = (label, key, value) => {
  handleChange(label, key, value);
};

const resetSingle = (key, actionName) => {
    store.resetSingleAdjustment(key, actionName);
};
</script>

<style scoped>
.adjustments-panel {
    padding: 10px;
}
.adjustment-group-container:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
    margin-bottom: 10px;
}
.panel-title {
    font-size: var(--font-size-normal);
    font-weight: 600;
    margin: 0 0 15px 0;
    color: var(--text-color-primary);
}
.panel-content {
    padding: 0;
}
.adjustment-item {
    margin-bottom: 14px;
}
.label-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}
.label-group label {
    font-size: var(--font-size-small);
    color: var(--text-color-secondary);
}
.reset-single-btn {
    background: none;
    border: none;
    color: var(--text-color-secondary);
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0 4px;
    line-height: 1;
    transition: color 0.15s ease, transform 0.2s ease;
}
.reset-single-btn:hover {
    color: var(--text-color-primary);
    transform: rotate(-90deg);
}

.slider-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

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
input[type="range"]:disabled {
    cursor: not-allowed;
}

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
</style>
