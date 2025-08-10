<template>
  <div class="canvas-area" ref="containerRef" :class="cursorClass" @wheel.prevent="handleWheel">
    <!-- ✨ transform 和 filter 都应用在这个 wrapper 上 -->
    <div class="canvas-wrapper" :style="wrapperStyle">
        <div class="canvas-content" :style="contentStyle">
            <canvas ref="canvasRef"></canvas>
            <!-- 晕影效果的覆盖层 -->
            <div class="vignette-overlay" :style="vignetteStyle"></div>
        </div>
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
const canvasRef = ref(null);
let ctx = null;

let isPanning = ref(false);
let lastMousePos = { x: 0, y: 0 };

const cursorClass = computed(() => {
  if (isPanning.value) return 'is-grabbing';
  // ✨ 当 activeTool 是 'select' 时，允许拖动
  if (store.activeTool === 'select') return 'is-grab';
  switch (store.activeTool) {
    case 'brush':
    case 'crop':
      return 'is-crosshair';
    case 'text':
      return 'is-text';
    default:
      return '';
  }
});

const vignetteStyle = computed(() => {
    if (!store.activeLayer) return {};
    const amount = store.activeLayer.adjustments.vignette;
    if (amount === 0) return {};
    const intensity = Math.abs(amount) / 100;
    const color = amount > 0 ? '255, 255, 255' : '0, 0, 0';
    return {
        'box-shadow': `inset 0 0 ${intensity * 150}px ${intensity * 80}px rgba(${color}, ${intensity * 0.7})`
    };
});

// ✨ 将变换逻辑移到 CSS 样式中
const wrapperStyle = computed(() => {
    return {
        transform: `translate(${store.pan.x}px, ${store.pan.y}px) scale(${store.zoom})`
    };
});

const contentStyle = computed(() => {
    if (!store.activeLayer) return { filter: 'none' };
    const {
        brightness, contrast, saturate, hue, blur,
        temperature, highlights, shadows, sharpen, vibrance
    } = store.activeLayer.adjustments;

    const tempFilter = temperature > 0 ? `sepia(${temperature / 100})` : '';
    const blueOverlay = temperature < 0 ? `brightness(${1 + temperature/500})` : '';
    const shadowLift = shadows > 0 ? `drop-shadow(0 0 ${shadows/5}px rgba(200,200,255, ${shadows/300}))` : '';
    const highlightCompress = highlights < 0 ? `drop-shadow(0 0 ${Math.abs(highlights)/2}px rgba(0,0,0, ${Math.abs(highlights)/200}))` : '';
    const sharpenFilter = sharpen > 0 ? `contrast(${1 + sharpen / 200}) brightness(${1 - sharpen / 500})` : '';
    const vibranceFilter = vibrance > 0 ? `saturate(${100 + saturate + vibrance}%) contrast(${100 - vibrance/4}%)` : `saturate(${100 + saturate + vibrance}%)`;

    return {
        filter: `
            brightness(${100 + brightness}%)
            contrast(${100 + contrast}%)
            ${vibranceFilter}
            hue-rotate(${hue}deg)
            blur(${blur}px)
            ${tempFilter}
            ${blueOverlay}
            ${shadowLift}
            ${highlightCompress}
            ${sharpenFilter}
        `.trim().replace(/\s+/g, ' ')
    };
});

const renderCanvas = () => {
  if (!ctx || !store.isImageLoaded) {
    if(ctx) {
        const canvas = canvasRef.value;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return;
  };

  const canvas = canvasRef.value;
  const img = store.originalImage;
  const dpr = window.devicePixelRatio || 1;

  // ✨ 画布尺寸固定为图片原始尺寸，缩放由 CSS 完成
  canvas.width = img.width * dpr;
  canvas.height = img.height * dpr;
  canvas.style.width = `${img.width}px`;
  canvas.style.height = `${img.height}px`;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, img.width, img.height);
  ctx.drawImage(img, 0, 0);
};

const handleWheel = (event) => {
  if (!store.isImageLoaded) return;
  const delta = -Math.sign(event.deltaY);
  const zoomFactor = 1.1;
  const newZoom = delta > 0 ? store.zoom * zoomFactor : store.zoom / zoomFactor;
  store.zoom = Math.max(0.1, Math.min(newZoom, 10));
};

const handleMouseDown = (event) => {
  // ✨ 只在移动工具激活时或按住空格键时允许拖动
  if (store.activeTool === 'select' || isPanning.value) {
    lastMousePos = { x: event.clientX, y: event.clientY };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
};

const handleMouseMove = (event) => {
  // ✨ 拖动距离需要除以缩放比例，以获得正确的移动速度
  const dx = (event.clientX - lastMousePos.x);
  const dy = (event.clientY - lastMousePos.y);
  store.pan.x += dx;
  store.pan.y += dy;
  lastMousePos = { x: event.clientX, y: event.clientY };
};

const handleMouseUp = () => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
};

const startPanning = () => {
  if (!store.isImageLoaded) return;
  isPanning.value = true;
};
const stopPanning = () => {
  isPanning.value = false;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
};

const observer = new ResizeObserver(() => {
    // 窗口尺寸变化时，可能需要重新居中
    if (store.isImageLoaded) {
        // You might want to recenter the image here if needed
    }
});

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  containerRef.value.addEventListener('mousedown', handleMouseDown);
  observer.observe(containerRef.value);
  renderCanvas();
});

onUnmounted(() => {
  containerRef.value?.removeEventListener('mousedown', handleMouseDown);
  observer.disconnect();
});

watch(
  () => store.isImageLoaded,
  (isLoaded) => {
    if (isLoaded) {
      nextTick(() => {
        renderCanvas();
        // 自动居中和缩放
        const container = containerRef.value;
        const img = store.originalImage;
        const scaleX = container.clientWidth / (img.width + 80); // add padding
        const scaleY = container.clientHeight / (img.height + 80);
        store.zoom = Math.min(scaleX, scaleY, 1);
        store.pan.x = 0;
        store.pan.y = 0;
      });
    } else {
        renderCanvas();
    }
  }
);


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
    transition: transform 0.1s linear;
    /* 这个 wrapper 用于平移和缩放 */
}

.canvas-content {
    /* 这个 content 用于滤镜 */
    transition: filter 0.1s ease-out;
    background-image:
        linear-gradient(45deg, #424242 25%, transparent 25%),
        linear-gradient(-45deg, #424242 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #424242 75%),
        linear-gradient(-45deg, transparent 75%, #424242 75%);
    background-size: 32px 32px;
    background-position: 0 0, 0 16px, 16px -16px, -16px 0px;
    background-color: var(--bg-color-deepest);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

canvas {
  display: block; /* 移除 canvas 下方的空隙 */
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
</style>
