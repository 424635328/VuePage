<!-- src/components/VideoSplashScreen.vue -->

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  /**
   * 控制开屏动画的显示和隐藏，支持 v-model:active
   */
  active: { type: Boolean, default: false },
  /**
   * 视频文件的路径。
   * 建议放置在 `public` 目录下，例如 `/video.mp4`。
   */ 
  videoSrc: { type: String, required: true },
  /**
   * 视频播放结束后显示的提示文字
   */
  promptText: { type: String, default: '点击任意位置继续' },
});

const emit = defineEmits(['update:active']);

// 响应式引用
const videoPlayer = ref(null);
const isVideoFinished = ref(false);
const isDismissing = ref(false); // 新增状态，防止重复触发关闭

/**
 * 当视频播放结束时触发。
 */
const onVideoEnded = () => {
  isVideoFinished.value = true;
};

/**
 * 点击屏幕以关闭开屏动画。
 * 此函数现在可以随时触发，实现“跳过”功能。
 */
const dismiss = () => {
  // 如果正在关闭中，则不执行任何操作，防止重复点击
  if (isDismissing.value) return;

  isDismissing.value = true;
  emit('update:active', false);
};

/**
 * 重置组件状态，以便在下次激活时重新播放。
 */
const resetState = () => {
  isVideoFinished.value = false;
  isDismissing.value = false; // 重置关闭状态
  // 确保 DOM 更新后再操作 video 元素
  nextTick(() => {
    if (videoPlayer.value) {
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
    // 当组件被激活时，重置状态并准备播放
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
      <video
        ref="videoPlayer"
        :src="videoSrc"
        class="fullscreen-video"
        autoplay
        muted
        playsinline
        preload="auto"
        @ended="onVideoEnded"
      >
        你的浏览器不支持 Video 标签。
      </video>

      <Transition name="prompt-fade">
        <!-- 提示文字仅在视频自然播放结束后显示 -->
        <div v-if="isVideoFinished" class="click-prompt">
          {{ promptText }}
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.splash-screen-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: #000;
  overflow: hidden;
  /* 直接设置为指针，表示任何时候都可以点击跳过 */
  cursor: pointer;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 确保视频本身不会捕获点击事件，让容器来处理 */
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
