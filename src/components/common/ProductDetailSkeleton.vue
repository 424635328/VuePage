<!-- src/components/common/ProductDetailSkeleton.vue -->

<template>
  <!-- 3. A11y: 添加 role 和 aria 属性，让辅助技术知道这里在加载 -->
  <div
    class="skeleton-container"
    role="status"
    aria-live="polite"
    aria-label="正在加载内容..."
  >
    <div class="skeleton-layout">
      <div class="skeleton-gallery">
        <div class="skeleton skeleton-main-image"></div>
        <div class="skeleton-thumbnails">
          <div class="skeleton skeleton-thumb"></div>
          <div class="skeleton skeleton-thumb"></div>
          <div class="skeleton skeleton-thumb"></div>
          <div class="skeleton skeleton-thumb"></div>
        </div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-meta"></div>
        <!-- 4. 更自然的文本占位符 -->
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 95%;"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 1. 更现代的组合动画 */
@keyframes pulse {
  0%, 100% {
    background-color: var(--color-background-soft);
  }
  50% {
    background-color: var(--color-background-mute);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  // 2. 使用 CSS 变量进行主题化
  background-color: var(--color-background-soft);
  background-image: linear-gradient(
    90deg,
    transparent,
    var(--color-border),
    transparent
  );
  background-repeat: no-repeat;
  background-size: 2000px 100%;
  border-radius: 8px;

  // 组合动画，pulse 作为基础，shimmer 作为覆盖层
  animation:
    pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite,
    shimmer 2.2s linear infinite;
}

.skeleton-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  padding-top: 4rem; // 为返回按钮等预留空间
  // 淡入效果，让骨架屏出现不那么突兀
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.skeleton-layout {
  display: flex;
  gap: 3rem;
}

.skeleton-gallery {
  flex: 0 0 40%;
  max-width: 500px;
}

.skeleton-main-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  margin-bottom: 1rem;
}

.skeleton-thumbnails {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 0.75rem;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
}

.skeleton-content {
  flex: 1;
  padding-top: 0.5rem; // 微调对齐
}

.skeleton-title {
  width: 70%;
  height: 48px;
  margin-bottom: 1.5rem;
}

.skeleton-meta {
  width: 50%;
  height: 40px;
  margin-bottom: 3rem;
}

.skeleton-text {
  width: 100%;
  height: 24px;
  margin-bottom: 1rem;
  &:last-child {
    margin-bottom: 0;
  }
}

/* 4. 响应式微调 */
@media (max-width: 992px) {
  .skeleton-layout {
    flex-direction: column;
    gap: 2.5rem;
  }
  .skeleton-gallery {
    max-width: 100%;
  }
  .skeleton-content {
    padding-top: 0;
  }
}

@media (max-width: 768px) {
    .skeleton-container {
        padding: 0 1rem;
        padding-top: 2rem;
    }
    .skeleton-layout {
        gap: 1.5rem;
    }
}
</style>
