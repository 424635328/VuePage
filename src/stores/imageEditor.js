import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const LayerType = {
  IMAGE: 'image',
  TEXT: 'text',
};

let nextLayerId = 0;
let nextHistoryId = 0;

function createFullSnapshot(originalImg, layers) {
  return {
    originalImage: originalImg,
    layers: layers.map(layer => ({
        id: layer.id,
        type: layer.type,
        name: layer.name,
        isVisible: layer.isVisible,
        isLocked: layer.isLocked,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        text: layer.text,
        x: layer.x,
        y: layer.y,
        font: layer.font,
        color: layer.color,
        adjustments: { ...layer.adjustments },
    })),
  };
}

export const useImageEditorStore = defineStore('imageEditor', () => {
  const defaultAdjustments = {
    brightness: 0, contrast: 0, highlights: 0, shadows: 0,
    saturate: 0, vibrance: 0, temperature: 0, tint: 0, hue: 0,
    sharpen: 0, blur: 0, vignette: 0,
  };

  const originalImage = ref(null);
  const layers = ref([]);
  const activeLayerId = ref(null);
  const history = ref([]);
  const historyIndex = ref(-1);
  const activeTool = ref('select');
  const zoom = ref(1);
  const pan = ref({ x: 0, y: 0 });
  const cropBox = ref(null);
  const isCropping = ref(false);

  const activeLayer = computed(() => {
    if (activeLayerId.value === null) return null;
    return layers.value.find(l => l.id === activeLayerId.value);
  });

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  const isImageLoaded = computed(() => !!originalImage.value);

  function loadImage(imageElement) {
    originalImage.value = imageElement;
    const backgroundLayer = {
      id: nextLayerId++,
      type: LayerType.IMAGE,
      name: '背景',
      isVisible: true,
      isLocked: false,
      opacity: 100,
      blendMode: 'normal',
      adjustments: { ...defaultAdjustments },
    };
    layers.value = [backgroundLayer];
    activeLayerId.value = backgroundLayer.id;
    history.value = [];
    historyIndex.value = -1;
    addHistoryStep('打开图片', createFullSnapshot(originalImage.value, layers.value));
    zoom.value = 1;
    pan.value = { x: 0, y: 0 };
    cropBox.value = null;
    isCropping.value = false;
  }

  function addHistoryStep(name, fullSnapshot) {
    if (historyIndex.value < history.value.length - 1) {
      history.value.splice(historyIndex.value + 1);
    }
    history.value.push({
      id: nextHistoryId++,
      name,
      state: fullSnapshot,
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
    if (historyIndex.value < 0 || !history.value[historyIndex.value]) return;
    const snapshot = history.value[historyIndex.value].state;
    originalImage.value = snapshot.originalImage;
    layers.value = snapshot.layers.map(layerState => ({ ...layerState }));
    if (!layers.value.some(l => l.id === activeLayerId.value)) {
        activeLayerId.value = layers.value.length > 0 ? layers.value[layers.value.length - 1].id : null;
    }
  }

  function updateActiveLayerAndRecordHistory(actionName, updateFn) {
    if (!activeLayer.value || activeLayer.value.isLocked) return;
    updateFn(activeLayer.value);
    addHistoryStep(actionName, createFullSnapshot(originalImage.value, layers.value));
  }

  function updateActiveLayerAdjustment(key, value) {
    if (!activeLayer.value) return;
    activeLayer.value.adjustments[key] = Number(value);
  }

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

  function startCropping(box) {
    cropBox.value = box;
    isCropping.value = true;
  }

  function updateCropBox(box) {
    if (isCropping.value) {
      cropBox.value = { ...cropBox.value, ...box };
    }
  }

  function stopCropping() {}

  function applyCrop() {
    if (!cropBox.value || !originalImage.value) return;
    const oldImage = originalImage.value;
    const rect = { x: cropBox.value.x, y: cropBox.value.y, width: cropBox.value.width, height: cropBox.value.height };
    if (rect.width < 0) { rect.x += rect.width; rect.width = -rect.width; }
    if (rect.height < 0) { rect.y += rect.height; rect.height = -rect.height; }
    if(rect.width < 1 || rect.height < 1) { cancelCrop(); return; }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = rect.width;
    cropCanvas.height = rect.height;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(oldImage, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);

    const newImage = new Image();
    newImage.onload = () => {
      const newLayers = [{
        ...layers.value[0], // Keep background layer properties
        adjustments: { ...defaultAdjustments }
      }];
      addHistoryStep('应用裁剪', createFullSnapshot(newImage, newLayers));
      originalImage.value = newImage;
      layers.value = newLayers;
      cropBox.value = null;
      isCropping.value = false;
    };
    newImage.src = cropCanvas.toDataURL();
  }

  function cancelCrop() {
    cropBox.value = null;
    isCropping.value = false;
  }

  function addTextLayer(text, options) {
    const newLayer = {
      id: nextLayerId++,
      type: LayerType.TEXT,
      name: text.substring(0, 15) || '文本图层',
      isVisible: true,
      isLocked: false,
      opacity: 100,
      blendMode: 'normal',
      text: text,
      x: options.x,
      y: options.y,
      font: options.font || '32px sans-serif',
      color: options.color || '#ffffff',
      adjustments: { ...defaultAdjustments },
    };
    layers.value.push(newLayer);
    activeLayerId.value = newLayer.id;
    addHistoryStep('添加文字', createFullSnapshot(originalImage.value, layers.value));
  }

  function exportImage(format = 'image/png', quality = 0.92) {
    if (!originalImage.value) { console.error("No image to export."); return; }
    const img = originalImage.value;
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    exportCanvas.width = img.width;
    exportCanvas.height = img.height;

    layers.value.forEach(layer => {
        if (!layer.isVisible) return;
        exportCtx.save();
        exportCtx.globalAlpha = layer.opacity / 100;

        if (layer.type === LayerType.IMAGE) {
            const { brightness, contrast, saturate, hue, blur, temperature, highlights, shadows, sharpen, vibrance } = layer.adjustments;
            const tempFilter = temperature > 0 ? `sepia(${temperature / 100})` : '';
            const blueOverlay = temperature < 0 ? `brightness(${1 + temperature/500})` : '';
            const shadowLift = shadows > 0 ? `drop-shadow(0 0 ${shadows/5}px rgba(200,200,255, ${shadows/300}))` : '';
            const highlightCompress = highlights < 0 ? `drop-shadow(0 0 ${Math.abs(highlights)/2}px rgba(0,0,0, ${Math.abs(highlights)/200}))` : '';
            const sharpenFilter = sharpen > 0 ? `contrast(${1 + sharpen / 200}) brightness(${1 - sharpen / 500})` : '';
            const vibranceFilter = vibrance > 0 ? `saturate(${100 + saturate + vibrance}%) contrast(${100 - vibrance/4}%)` : `saturate(${100 + saturate + vibrance}%)`;
            exportCtx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) ${vibranceFilter} hue-rotate(${hue}deg) blur(${blur}px) ${tempFilter} ${blueOverlay} ${shadowLift} ${highlightCompress} ${sharpenFilter}`.trim().replace(/\s+/g, ' ');
            exportCtx.drawImage(img, 0, 0);
        } else if (layer.type === LayerType.TEXT) {
            exportCtx.font = layer.font;
            exportCtx.fillStyle = layer.color;
            exportCtx.fillText(layer.text, layer.x, layer.y);
        }

        const vignetteAmount = layer.adjustments.vignette;
        if (vignetteAmount !== 0) {
            const intensity = Math.abs(vignetteAmount) / 100;
            const color = vignetteAmount > 0 ? '255, 255, 255' : '0, 0, 0';
            const gradient = exportCtx.createRadialGradient(img.width / 2, img.height / 2, Math.max(img.width, img.height) * 0.2, img.width / 2, img.height / 2, Math.max(img.width, img.height) * (0.8 - intensity * 0.3));
            if (vignetteAmount < 0) {
                gradient.addColorStop(0, `rgba(${color}, 0)`);
                gradient.addColorStop(1, `rgba(${color}, ${intensity * 0.8})`);
            } else {
                gradient.addColorStop(0, `rgba(${color}, ${intensity * 0.5})`);
                gradient.addColorStop(1, `rgba(${color}, 0)`);
            }
            exportCtx.fillStyle = gradient;
            exportCtx.fillRect(0, 0, img.width, img.height);
        }
        exportCtx.restore();
    });

    const dataUrl = exportCanvas.toDataURL(format, quality);
    const link = document.createElement('a');
    let fileExtension = format.split('/')[1];
    if (fileExtension === 'jpeg') fileExtension = 'jpg';
    link.download = `edited-image-${Date.now()}.${fileExtension}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    originalImage, layers, activeLayerId, activeLayer, history, historyIndex,
    activeTool, zoom, pan, canUndo, canRedo, isImageLoaded, defaultAdjustments,
    LayerType,
    loadImage, addHistoryStep, undo, redo,
    updateActiveLayerAdjustment, updateActiveLayerAndRecordHistory,
    resetSingleAdjustment, setActiveTool, setActiveLayerId, exportImage,
    cropBox, isCropping, startCropping, updateCropBox,
    stopCropping, applyCrop, cancelCrop, addTextLayer
  };
});
