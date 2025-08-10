import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

let nextLayerId = 0;
let nextHistoryId = 0;

// 创建图层状态快照的辅助函数
function createLayersSnapshot(layers) {
  return layers.map(layer => ({
    id: layer.id,
    name: layer.name,
    isVisible: layer.isVisible,
    isLocked: layer.isLocked,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
    adjustments: { ...layer.adjustments },
  }));
}

export const useImageEditorStore = defineStore('imageEditor', () => {
  // --- STATE ---

  // ‼️ 核心修改：定义企业级标准的默认调整项
  const defaultAdjustments = {
    // 光效组
    brightness: 0,   // 亮度
    contrast: 0,     // 对比度
    highlights: 0,   // 高光
    shadows: 0,      // 阴影
    // 色彩组
    saturate: 0,     // 饱和度
    vibrance: 0,     // 自然饱和度 (将用 CSS 滤镜组合模拟)
    temperature: 0,  // 色温 (将用 CSS 滤镜组合模拟)
    tint: 0,         // 色调 (将用 CSS 滤镜组合模拟)
    hue: 0,          // 色相
    // 效果组
    sharpen: 0,      // 锐化 (将用 CSS 滤镜组合模拟)
    blur: 0,         // 模糊
    vignette: 0,     // 晕影 (将用伪元素实现)
  };

  const originalImage = ref(null);
  const layers = ref([]);
  const activeLayerId = ref(null);
  const history = ref([]);
  const historyIndex = ref(-1);
  const activeTool = ref('select');
  const zoom = ref(1);
  const pan = ref({ x: 0, y: 0 });

  // --- GETTERS (COMPUTED) ---
  const activeLayer = computed(() => {
    if (activeLayerId.value === null) return null;
    return layers.value.find(l => l.id === activeLayerId.value);
  });

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  const isImageLoaded = computed(() => !!originalImage.value);

  // --- ACTIONS ---

  function loadImage(imageElement) {
    originalImage.value = imageElement;

    const backgroundLayer = {
      id: nextLayerId++,
      name: '背景',
      isVisible: true,
      isLocked: false,
      opacity: 100,
      blendMode: 'normal',
      // ✨ 使用新的默认值对象
      adjustments: { ...defaultAdjustments },
    };

    layers.value = [backgroundLayer];
    activeLayerId.value = backgroundLayer.id;

    history.value = [];
    historyIndex.value = -1;
    addHistoryStep('打开图片', createLayersSnapshot(layers.value));

    zoom.value = 1;
    pan.value = { x: 0, y: 0 };
  }

  function addHistoryStep(name, layersSnapshot) {
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1);
    }

    history.value.push({
      id: nextHistoryId++,
      name,
      state: { layers: layersSnapshot },
    });
    historyIndex.value = history.value.length - 1;
  }

  function undo() {
    if (!canUndo.value) return;
    historyIndex.value--;
    restoreStateFromHistory();
  }

  function redo() {
    if (!canRedo.value) return;
    historyIndex.value++;
    restoreStateFromHistory();
  }

  function restoreStateFromHistory() {
    const snapshot = history.value[historyIndex.value].state;
    layers.value = snapshot.layers.map(layerState => ({
        ...layerState,
        adjustments: { ...layerState.adjustments }
    }));

    if (!layers.value.some(l => l.id === activeLayerId.value)) {
      activeLayerId.value = layers.value.length > 0 ? layers.value[layers.value.length - 1].id : null;
    }
  }

  function updateActiveLayerAndRecordHistory(actionName, updateFn) {
    if (!activeLayer.value || activeLayer.value.isLocked) return;
    updateFn(activeLayer.value);
    addHistoryStep(actionName, createLayersSnapshot(layers.value));
  }

  function updateActiveLayerAdjustment(key, value) {
    if (!activeLayer.value) return;
    activeLayer.value.adjustments[key] = Number(value);
  }

  // ✨ 新增一个 action 用于重置单个调整项
  function resetSingleAdjustment(key, actionName) {
      updateActiveLayerAndRecordHistory(actionName, (layer) => {
          layer.adjustments[key] = defaultAdjustments[key];
      });
  }

  function setActiveTool(tool) {
    activeTool.value = tool;
  }

  function setActiveLayerId(id) {
    activeLayerId.value = id;
  }

  function exportImage(format = 'image/png', quality = 0.92) {
    if (!originalImage.value) {
      console.error("No image to export.");
      return;
    }

    const img = originalImage.value;
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    exportCanvas.width = img.width;
    exportCanvas.height = img.height;

    // ... 导出逻辑 ...

    // 在这个离屏 Canvas 上，我们不绘制棋盘格，背景默认就是透明的

    layers.value.forEach(layer => {
      if (!layer.isVisible) return;

      exportCtx.save();

      exportCtx.globalAlpha = layer.opacity / 100;
      exportCtx.globalCompositeOperation = layer.blendMode;

      const { brightness, contrast, saturate, hue, blur } = layer.adjustments; // (简化了，真实导出需要完整滤镜)
      exportCtx.filter = `
        brightness(${100 + brightness}%)
        contrast(${100 + contrast}%)
        saturate(${100 + saturate}%)
        hue-rotate(${hue}deg)
        blur(${blur}px)
      `;

      exportCtx.drawImage(img, 0, 0);

      exportCtx.restore();
    });

    const dataUrl = exportCanvas.toDataURL(format, quality);
    const link = document.createElement('a');
    const fileExtension = format.split('/')[1];
    link.download = `edited-image-${Date.now()}.${fileExtension}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    originalImage, layers, activeLayerId, activeLayer, history, historyIndex,
    activeTool, zoom, pan, canUndo, canRedo, isImageLoaded,
    defaultAdjustments, // 暴露默认值
    loadImage, addHistoryStep, undo, redo,
    updateActiveLayerAdjustment,
    updateActiveLayerAndRecordHistory,
    resetSingleAdjustment, // 暴露新 action
    setActiveTool, setActiveLayerId,
    exportImage,
  };
});
