<!-- src/components/editor/CanvasArea.vue -->

<template>
  <div class="canvas-area" ref="containerRef" :class="cursorClass">
    <canvas ref="canvasRef"></canvas>
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
  switch (store.activeTool) {
    case 'select': return 'is-grab';
    case 'brush': return 'is-crosshair';
    case 'crop': return 'is-crosshair';
    case 'text': return 'is-text';
    default: return '';
  }
});

/**
 * 绘制棋盘格背景
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
function drawCheckerboard(ctx, width, height) {
  const size = 16; // 每个格子的尺寸
  const color1 = '#424242'; // 深灰色
  const color2 = '#3a3a3a'; // 更深的灰色

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = ((x / size) + (y / size)) % 2 === 0 ? color1 : color2;
      ctx.fillRect(x, y, size, size);
    }
  }
}

const renderCanvas = () => {
  if (!ctx) return;

  const canvas = canvasRef.value;
  const { width, height } = canvas.getBoundingClientRect();

  // 适配高DPI屏幕
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // 首先绘制棋盘格作为整个画布的背景
  drawCheckerboard(ctx, width, height);

  if (!store.isImageLoaded) {
    return; // 如果没有图片，只显示棋盘格背景
  }

  // 保存当前状态，以便应用全局平移和缩放
  ctx.save();
  ctx.translate(store.pan.x, store.pan.y);
  ctx.scale(store.zoom, store.zoom);

  const img = store.originalImage;
  // 计算图片（画板）在缩放和平移后的中心位置
  const imgWrapperX = (width / store.zoom - img.width) / 2;
  const imgWrapperY = (height / store.zoom - img.height) / 2;

  // 在图片下方绘制一个纯色背景，模拟画板边界，这样棋盘格只在画板外围显示
  ctx.fillStyle = 'var(--bg-color-deepest)';
  ctx.fillRect(imgWrapperX, imgWrapperY, img.width, img.height);

  // 遍历并绘制所有可见图层
  store.layers.forEach(layer => {
    if (!layer.isVisible) return;

    ctx.save();

    ctx.globalAlpha = layer.opacity / 100;
    ctx.globalCompositeOperation = layer.blendMode;

    const { brightness, contrast, saturate, hue, blur } = layer.adjustments;
    ctx.filter = `
      brightness(${100 + brightness}%)
      contrast(${100 + contrast}%)
      saturate(${100 + saturate}%)
      hue-rotate(${hue}deg)
      blur(${blur}px)
    `;

    // 将图片绘制在计算好的画板位置上
    ctx.drawImage(img, imgWrapperX, imgWrapperY);

    ctx.restore();
  });

  // 恢复全局变换
  ctx.restore();
};

const handleWheel = (event) => {
  if (!store.isImageLoaded) return;
  event.preventDefault();
  const delta = -Math.sign(event.deltaY);
  const zoomFactor = 1.1;
  const newZoom = delta > 0 ? store.zoom * zoomFactor : store.zoom / zoomFactor;
  store.zoom = Math.max(0.1, Math.min(newZoom, 10));
};

const handleMouseDown = (event) => {
  if (isPanning.value) {
    lastMousePos = { x: event.clientX, y: event.clientY };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
};

const handleMouseMove = (event) => {
  const dx = event.clientX - lastMousePos.x;
  const dy = event.clientY - lastMousePos.y;
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

const observer = new ResizeObserver(renderCanvas);

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  containerRef.value.addEventListener('wheel', handleWheel, { passive: false });
  containerRef.value.addEventListener('mousedown', handleMouseDown);
  observer.observe(containerRef.value);
  // 初始渲染
  renderCanvas();
});

onUnmounted(() => {
  containerRef.value?.removeEventListener('wheel', handleWheel);
  containerRef.value?.removeEventListener('mousedown', handleMouseDown);
  observer.disconnect();
});

watch(
  () => [store.layers, store.zoom, store.pan],
  () => {
    requestAnimationFrame(renderCanvas);
  },
  { deep: true }
);

watch(() => store.isImageLoaded, (isLoaded) => {
  if (isLoaded) {
    const container = containerRef.value;
    const img = store.originalImage;
    const scaleX = container.clientWidth / img.width;
    const scaleY = container.clientHeight / img.height;
    store.zoom = Math.min(scaleX, scaleY, 1) * 0.9;
    store.pan = { x: 0, y: 0 };
  }
  nextTick(renderCanvas);
});

defineExpose({ startPanning, stopPanning });
</script>

<style scoped>
.canvas-area {
  background-color: var(--bg-color-deepest);
  position: relative;
  overflow: hidden;
}
.canvas-area.is-grab { cursor: grab; }
.canvas-area.is-grabbing { cursor: grabbing; }
.canvas-area.is-crosshair { cursor: crosshair; }
.canvas-area.is-text { cursor: text; }

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
