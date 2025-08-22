<!-- src/components/VideoSplashScreen.vue -->
<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  /**
   * 控制开屏动画的显示和隐藏，支持 v-model:active
   */
  active: { type: Boolean, default: false },
  /**
   * 视频源数组，用于提供多种格式以增强浏览器兼容性。
   * @type {Array<{src: String, type: String}>}
   * @example [{ src: '/video/splash.webm', type: 'video/webm' }, { src: '/video/splash.mp4', type: 'video/mp4' }]
   */
  sources: {
    type: Array,
    required: true,
    // 添加验证器，确保传入的数据格式正确
    validator: (value) =>
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(item => typeof item.src === 'string' && typeof item.type === 'string')
  },
  /**
   * 视频播放结束后显示的提示文字
   */
  promptText: { type: String, default: '开启数字之旅' },
});

const emit = defineEmits(['update:active']);

// 响应式引用
const videoPlayer = ref(null);
const isVideoFinished = ref(false);
const isDismissing = ref(false);

/**
 * 当视频播放结束时触发。
 */
const onVideoEnded = () => {
  isVideoFinished.value = true;
};

/**
 * 点击屏幕以关闭开屏动画。
 */
const dismiss = () => {
  if (isDismissing.value) return;
  isDismissing.value = true;
  emit('update:active', false);
};

/**
 * 重置组件状态，以便在下次激活时重新播放。
 */
const resetState = () => {
  isVideoFinished.value = false;
  isDismissing.value = false;
  nextTick(() => {
    if (videoPlayer.value) {
      // 关键改动：先调用 load() 方法来加载新的 <source>
      videoPlayer.value.load();
      videoPlayer.value.currentTime = 0;
      videoPlayer.value.play().catch(error => {
        console.error("视频自动播放失败:", error);
      });
    }
  });
};

// 监听 active 属性的变化
watch(() => props.active, (isActive) => {
  if (isActive) {
    resetState();
  }
}, { immediate: true });

</script>

<template>
  <Transition name="splash-fade">
    <div
      v-if="active"
      class="splash-screen-container"
      @click="dismiss"
    >
      <!--
        核心改动:
        1. 移除 :src 属性。
        2. 使用 v-for 循环 props.sources 数组来动态生成 <source> 标签。
      -->
      <video
        ref="videoPlayer"
        class="fullscreen-video"
        autoplay
        muted
        playsinline
        preload="auto"
        @ended="onVideoEnded"
      >
        <!-- 动态生成 source 标签 -->
        <source
          v-for="source in sources"
          :key="source.src"
          :src="source.src"
          :type="source.type"
        />
        你的浏览器不支持 Video 标签。
      </video>

      <Transition name="prompt-fade">
        <div v-if="isVideoFinished" class="click-prompt">
          {{ promptText }}
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<!-- 样式部分无需改动，此处省略 -->
<style lang="scss" scoped>
/* ... 你的样式代码保持不变 ... */
.splash-screen-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: #000;
  overflow: hidden;
  cursor: pointer;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.click-prompt {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  text-align: center;
  pointer-events: none;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    transform: translateX(-50%) scale(1.05);
    box-shadow: 0 0 10px 15px rgba(255, 255, 255, 0);
  }
  100% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}
.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}

.prompt-fade-enter-active {
  transition: opacity 0.8s ease;
}
.prompt-fade-enter-from {
  opacity: 0;
}
</style>
