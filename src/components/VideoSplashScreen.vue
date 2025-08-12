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
   * 重要提示：为了获得最佳性能，请将此视频文件放置在项目的 `public` 目录下，
   * 这样它就不会被Webpack处理，可以直接通过URL访问。
   * 例如，如果文件是 `public/video.mp4`，则此处的路径应为 `/video.mp4`。
   */
  videoSrc: { type: String, required: true },
  /**
   * 视频播放结束后显示的提示文字
   */
  promptText: { type: String, default: '点击任意位置继续' },
});

const emit = defineEmits(['update:active']);

// 响应式引用
const videoPlayer = ref(null);      // 用于获取 video DOM 元素
const isVideoFinished = ref(false); // 状态：视频是否已播放完毕

/**
 * 当视频播放结束时触发此函数。
 */
const onVideoEnded = () => {
  isVideoFinished.value = true;
};

/**
 * 点击屏幕以关闭开屏动画。
 * 此函数仅在视频播放完毕后才有效。
 */
const dismiss = () => {
  if (isVideoFinished.value) {
    emit('update:active', false);
  }
};

/**
 * 重置组件状态，以便在下次激活时重新播放。
 */
const resetState = () => {
  isVideoFinished.value = false;
  // 确保 DOM 更新后再操作 video 元素
  nextTick(() => {
    if (videoPlayer.value) {
      videoPlayer.value.currentTime = 0; // 将视频重置到开头
      videoPlayer.value.play().catch(error => {
        // 自动播放可能会被浏览器阻止，尤其是在用户没有与页面交互过的情况下。
        // muted 属性通常可以解决此问题。
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
}, { immediate: true }); // immediate: true 确保组件首次加载时也能执行

</script>

<template>
  <Transition name="splash-fade">
    <div
      v-if="active"
      class="splash-screen-container"
      :class="{ 'is-interactive': isVideoFinished }"
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
        <!--
          视频属性说明:
          - ref="videoPlayer": 获取DOM元素的引用。
          - :src="videoSrc": 动态绑定视频源。
          - autoplay: 页面加载后自动播放。
          - muted: 静音播放。这是大多数现代浏览器允许自动播放的前提条件。
          - playsinline: 在移动设备上（尤其是iOS）内联播放，而不是强制全屏。
          - preload="auto": 提示浏览器尽快加载整个视频文件。
          - @ended="onVideoEnded": 监听视频播放完成事件。
        -->
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

<style lang="scss" scoped>
.splash-screen-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: #000;
  overflow: hidden;
  cursor: default; /* 默认情况下是普通光标 */

  &.is-interactive {
    cursor: pointer; /* 视频播放完毕后，光标变为手型 */
  }
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持视频的宽高比，同时填满整个容器 */
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
  pointer-events: none; /* 确保提示文字不会阻挡对容器的点击事件 */
  animation: pulse 2s infinite;
}

/* 定义提示文字的浮动动画 */
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

/* 定义容器和提示的淡入淡出效果 */
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
