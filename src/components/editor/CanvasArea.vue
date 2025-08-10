<template>
  <div class="canvas-area" ref="containerRef" :class="cursorClass" @wheel.prevent="handleWheel">
    <div class="canvas-wrapper" ref="wrapperRef" :style="wrapperStyle">
        <div class="canvas-content" ref="contentRef" :style="contentStyle">
            <canvas ref="canvasRef"></canvas>
            <canvas ref="interactionCanvasRef" class="interaction-canvas"></canvas>
            <div class="vignette-overlay" :style="vignetteStyle"></div>

            <textarea
                v-if="isTexting"
                ref="textInputRef"
                v-model="textInputValue"
                class="text-input"
                :style="textInputStyle"
                @blur="handleTextInputBlur"
                @keydown.esc.prevent="cancelTextInput"
                @mousedown.stop
                placeholder="输入文本..."
            ></textarea>
        </div>
    </div>

    <div v-if="store.activeTool === 'crop' && store.isImageLoaded && store.cropBox" class="tool-options-bar">
        <button @click="applyCropAndExit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            应用
        </button>
        <button class="secondary" @click="cancelCropAndExit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            取消
        </button>
    </div>

    <div v-if="!store.isImageLoaded" class="placeholder">
      <p>点击 "文件" -> "打开" 或拖拽图片到此区域</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useImageEditorStore } from '../../stores/imageEditor';

const store = useImageEditorStore();
const containerRef = ref(null);
const contentRef = ref(null);
const canvasRef = ref(null);
const interactionCanvasRef = ref(null);
const textInputRef = ref(null);
let ctx = null;
let interactionCtx = null;

let isPanning = ref(false);
let isDrawing = ref(false);
let lastMousePos = { x: 0, y: 0 };
let screenLastMousePos = { x: 0, y: 0 };

const isTexting = ref(false);
const textInputValue = ref('');
const textInputPos = ref({ x: 0, y: 0 });

const cursorClass = computed(() => {
  if (isPanning.value) return 'is-grabbing';
  if (store.activeTool === 'select') return 'is-grab';
  if (store.activeTool === 'crop' || store.activeTool === 'brush') return 'is-crosshair';
  if (store.activeTool === 'text') return 'is-text';
  return '';
});

const wrapperStyle = computed(() => ({ transform: `translate(${store.pan.x}px, ${store.pan.y}px) scale(${store.zoom})` }));

const contentStyle = computed(() => {
    const activeLayer = store.activeLayer;
    if (!activeLayer || activeLayer.type !== store.LayerType.IMAGE) return { filter: 'none' };
    const { brightness, contrast, saturate, hue, blur, temperature, highlights, shadows, sharpen, vibrance } = activeLayer.adjustments;
    const tempFilter = temperature > 0 ? `sepia(${temperature / 100})` : '';
    const blueOverlay = temperature < 0 ? `brightness(${1 + temperature/500})` : '';
    const shadowLift = shadows > 0 ? `drop-shadow(0 0 ${shadows/5}px rgba(200,200,255, ${shadows/300}))` : '';
    const highlightCompress = highlights < 0 ? `drop-shadow(0 0 ${Math.abs(highlights)/2}px rgba(0,0,0, ${Math.abs(highlights)/200}))` : '';
    const sharpenFilter = sharpen > 0 ? `contrast(${1 + sharpen / 200}) brightness(${1 - sharpen / 500})` : '';
    const vibranceFilter = vibrance > 0 ? `saturate(${100 + saturate + vibrance}%) contrast(${100 - vibrance/4}%)` : `saturate(${100 + saturate + vibrance}%)`;
    return { filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) ${vibranceFilter} hue-rotate(${hue}deg) blur(${blur}px) ${tempFilter} ${blueOverlay} ${shadowLift} ${highlightCompress} ${sharpenFilter}`.trim().replace(/\s+/g, ' ') };
});

const vignetteStyle = computed(() => {
    const activeLayer = store.activeLayer;
    if (!activeLayer || activeLayer.type !== store.LayerType.IMAGE) return {};
    const amount = activeLayer.adjustments.vignette;
    if (amount === 0) return {};
    const intensity = Math.abs(amount) / 100;
    const color = amount > 0 ? '255, 255, 255' : '0, 0, 0';
    return { 'box-shadow': `inset 0 0 ${intensity * 150}px ${intensity * 80}px rgba(${color}, ${intensity * 0.7})` };
});

const textInputStyle = computed(() => ({
    left: `${textInputPos.value.x}px`,
    top: `${textInputPos.value.y}px`,
}));

function DOMtoCanvasCoords(event) {
    if (!contentRef.value) return { x: 0, y: 0 };
    const rect = contentRef.value.getBoundingClientRect();
    const x = (event.clientX - rect.left) / store.zoom;
    const y = (event.clientY - rect.top) / store.zoom;
    return { x, y };
}

const renderCanvas = () => {
    if (!ctx || !store.isImageLoaded) {
        if(ctx) ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
        return;
    }
    const canvas = canvasRef.value;
    const img = store.originalImage;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = img.width * dpr;
    canvas.height = img.height * dpr;
    canvas.style.width = `${img.width}px`;
    canvas.style.height = `${img.height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, img.width, img.height);

    store.layers.forEach(layer => {
        if (!layer.isVisible) return;
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode;

        if (layer.type === store.LayerType.IMAGE) {
            ctx.drawImage(img, 0, 0);
        } else if (layer.type === store.LayerType.TEXT) {
            ctx.font = layer.font;
            ctx.fillStyle = layer.color;
            ctx.textBaseline = 'top';
            ctx.fillText(layer.text, layer.x, layer.y);
        }
        ctx.restore();
    });
};

const renderInteractionCanvas = () => {
    if (!interactionCtx || !store.isImageLoaded) {
        if (interactionCtx) interactionCtx.clearRect(0, 0, interactionCanvasRef.value.width, interactionCanvasRef.value.height);
        return;
    }
    const canvas = interactionCanvasRef.value;
    const img = store.originalImage;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = img.width * dpr;
    canvas.height = img.height * dpr;
    canvas.style.width = `${img.width}px`;
    canvas.style.height = `${img.height}px`;
    interactionCtx.scale(dpr, dpr);
    interactionCtx.clearRect(0, 0, img.width, img.height);

    if (store.activeTool === 'crop' && store.cropBox) {
        drawCropBox(store.cropBox);
    }
};

function drawCropBox(box) {
    const { x, y, width, height } = box;
    interactionCtx.save();
    interactionCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    interactionCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    interactionCtx.lineWidth = 1;
    interactionCtx.beginPath();
    interactionCtx.rect(0, 0, store.originalImage.width, store.originalImage.height);
    interactionCtx.rect(x, y, width, height);
    interactionCtx.fill('evenodd');
    interactionCtx.strokeRect(x, y, width, height);
    interactionCtx.restore();
}

const handleMouseDown = (event) => {
    if (!store.isImageLoaded) return;
    screenLastMousePos = { x: event.clientX, y: event.clientY };
    lastMousePos = DOMtoCanvasCoords(event);
    isDrawing.value = true;

    switch (store.activeTool) {
        case 'select':
            isPanning.value = true;
            window.addEventListener('mousemove', handlePanMove);
            window.addEventListener('mouseup', handlePanUp);
            break;
        case 'crop':
            store.startCropping({ x: lastMousePos.x, y: lastMousePos.y, width: 0, height: 0 });
            window.addEventListener('mousemove', handleCropMove);
            window.addEventListener('mouseup', handleDrawUp);
            break;
        case 'brush':
            interactionCtx.beginPath();
            interactionCtx.moveTo(lastMousePos.x, lastMousePos.y);
            window.addEventListener('mousemove', handleBrushMove);
            window.addEventListener('mouseup', handleDrawUp);
            break;
        case 'text':
            startTextInput(lastMousePos);
            break;
    }
};

const handlePanMove = (event) => {
    if (!isPanning.value) return;
    const dx = event.clientX - screenLastMousePos.x;
    const dy = event.clientY - screenLastMousePos.y;
    store.pan.x += dx;
    store.pan.y += dy;
    screenLastMousePos = { x: event.clientX, y: event.clientY };
};

const handlePanUp = () => {
    isPanning.value = false;
    window.removeEventListener('mousemove', handlePanMove);
    window.removeEventListener('mouseup', handlePanUp);
};

const handleCropMove = (event) => {
    if (!isDrawing.value) return;
    const currentPos = DOMtoCanvasCoords(event);
    store.updateCropBox({
        width: currentPos.x - lastMousePos.x,
        height: currentPos.y - lastMousePos.y,
    });
};

const handleBrushMove = (event) => {
    if (!isDrawing.value) return;
    const currentPos = DOMtoCanvasCoords(event);
    interactionCtx.save();
    interactionCtx.strokeStyle = 'red';
    interactionCtx.lineWidth = 5;
    interactionCtx.lineCap = 'round';
    interactionCtx.lineJoin = 'round';
    interactionCtx.lineTo(currentPos.x, currentPos.y);
    interactionCtx.stroke();
    interactionCtx.restore();
};

const handleDrawUp = () => {
    isDrawing.value = false;
    if (store.activeTool === 'crop') {
        store.stopCropping();
    }
    window.removeEventListener('mousemove', handleCropMove);
    window.removeEventListener('mousemove', handleBrushMove);
    window.removeEventListener('mouseup', handleDrawUp);
};

const startTextInput = (pos) => {
    isTexting.value = true;
    textInputPos.value = pos;
    textInputValue.value = '';
};

const handleTextInputBlur = () => {
    if (textInputValue.value.trim()) {
        store.addTextLayer(textInputValue.value, {
            x: textInputPos.value.x,
            y: textInputPos.value.y,
        });
    }
    cancelTextInput();
};

const cancelTextInput = () => {
    isTexting.value = false;
    textInputValue.value = '';
};

const applyCropAndExit = () => { store.applyCrop(); store.setActiveTool('select'); };
const cancelCropAndExit = () => { store.cancelCrop(); store.setActiveTool('select'); };

const handleWheel = (event) => {
  if (!store.isImageLoaded) return;
  const delta = -Math.sign(event.deltaY);
  const zoomFactor = 1.1;
  const newZoom = delta > 0 ? store.zoom * zoomFactor : store.zoom / zoomFactor;
  store.zoom = Math.max(0.1, Math.min(newZoom, 10));
};

const startPanning = () => { if (store.isImageLoaded) isPanning.value = true; };
const stopPanning = () => { isPanning.value = false; };

const observer = new ResizeObserver(() => { renderCanvas(); renderInteractionCanvas(); });

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  interactionCtx = interactionCanvasRef.value.getContext('2d');
  containerRef.value.addEventListener('mousedown', handleMouseDown);
  observer.observe(containerRef.value);
  renderCanvas();
  renderInteractionCanvas();
});

onUnmounted(() => {
  containerRef.value?.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mousemove', handlePanMove);
  window.removeEventListener('mouseup', handlePanUp);
  window.removeEventListener('mousemove', handleCropMove);
  window.removeEventListener('mousemove', handleBrushMove);
  window.removeEventListener('mouseup', handleDrawUp);
  observer.disconnect();
});

watch(isTexting, (is) => {
    if(is) {
        nextTick(() => {
            textInputRef.value?.focus();
        });
    }
});

watch(() => store.activeTool, (newTool) => {
    if (newTool !== 'crop') store.cancelCrop();
    if (newTool !== 'text' && isTexting.value) cancelTextInput();
    renderInteractionCanvas();
});

watch(() => store.cropBox, () => { renderInteractionCanvas(); }, { deep: true });

watch([() => store.layers, () => store.originalImage], () => {
    nextTick(renderCanvas);
}, { deep: true });

watch(() => store.isImageLoaded, (isLoaded) => {
  if (isLoaded) {
    nextTick(() => {
      const container = containerRef.value;
      const img = store.originalImage;
      renderCanvas();
      renderInteractionCanvas();
      const scaleX = container.clientWidth / (img.width + 80);
      const scaleY = container.clientHeight / (img.height + 80);
      store.zoom = Math.min(scaleX, scaleY, 1);
      const contentWidth = img.width * store.zoom;
      const contentHeight = img.height * store.zoom;
      store.pan.x = (container.clientWidth - contentWidth) / 2;
      store.pan.y = (container.clientHeight - contentHeight) / 2;
    });
  } else {
    renderCanvas();
    renderInteractionCanvas();
  }
});

defineExpose({ startPanning, stopPanning });
</script>

<style scoped>
.canvas-area {
  background-color: transparent;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.canvas-area.is-grab { cursor: grab; }
.canvas-area.is-grabbing { cursor: grabbing; }
.canvas-area.is-crosshair { cursor: crosshair; }
.canvas-area.is-text { cursor: text; }

.canvas-wrapper {
    position: absolute;
    line-height: 0;
}

.canvas-content {
    transition: filter 0.1s ease-out;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    position: relative;
    background-color: var(--bg-color-deepest);
}

canvas {
    display: block;
}

.interaction-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
}

.vignette-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    transition: box-shadow 0.15s ease-in-out;
}

.tool-options-bar {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(30, 30, 30, 0.8);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    gap: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10;
}
.tool-options-bar button {
    background-color: var(--accent-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: var(--font-size-normal);
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}
.tool-options-bar button:hover {
    background-color: var(--accent-color-hover);
}
.tool-options-bar button.secondary {
    background-color: rgba(255, 255, 255, 0.1);
}
.tool-options-bar button.secondary:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-color-secondary);
  font-size: 1.1rem;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
.text-input {
    position: absolute;
    background-color: rgba(30, 30, 30, 0.9);
    border: 1px solid var(--accent-color);
    color: white;
    padding: 8px;
    font-size: 32px;
    z-index: 20;
    transform-origin: top left;
    outline: none;
    resize: none;
    line-height: 1.2;
    border-radius: 4px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    min-width: 50px;
    min-height: 40px;
    white-space: pre;
    overflow: hidden;
}
.text-input::placeholder {
    color: var(--text-color-secondary);
}
</style>
