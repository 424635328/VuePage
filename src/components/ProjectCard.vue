<!-- src/components/ProjectCard.vue -->

<template>
  <div class="project-card">
    <!-- 1. 图片区域 -->
    <a :href="project.liveUrl || '#'" target="_blank" rel="noopener noreferrer" class="card-image-link">
      <div class="card-image">
        <img :src="project.imageUrl" :alt="`${project.title} 项目截图`" loading="lazy" />
      </div>
    </a>

    <!-- 2. 内容区域结构不变，但样式会优化 -->
    <div class="card-content">
      <h3 class="project-title">{{ project.title }}</h3>
      <p class="project-description">{{ project.description }}</p>

      <div class="project-tags">
        <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <!-- 3. 操作按钮使用图标增强识别性 -->
      <div class="project-links">
        <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" rel="noopener noreferrer" class="link-button">
          <!-- 外部链接图标 -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>线上预览</span>
        </a>
        <a v-if="project.repoUrl" :href="project.repoUrl" target="_blank" rel="noopener noreferrer" class="link-button secondary">
           <!-- GitHub 图标 -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span>代码仓库</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  project: {
    type: Object,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.project-card {
  background-color: var(--color-background-soft);
  border-radius: 16px; /* 更大的圆角 */
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 关键：确保图片圆角生效 */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);

    /* 悬停时图片放大 */
    .card-image img {
      transform: scale(1.05);
    }
  }
}

.card-image-link {
  display: block;
}

.card-image {
  width: 100%;
  aspect-ratio: 16 / 10; /* 保持图片比例 */
  overflow: hidden;
  background-color: var(--color-background-mute);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 保证图片填满容器且不变形 */
    transition: transform 0.4s ease;
  }
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* 让内容区域填满剩余空间 */
}

.project-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.75rem;
}

.project-description {
  color: var(--color-text);
  line-height: 1.6;
  flex-grow: 1; /* 推开下方的 tags 和 links */
  margin-bottom: 1.5rem;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tag {
  background-color: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.project-links {
  display: flex;
  gap: 1rem;
  margin-top: auto; /* 确保按钮总在底部 */
}

.link-button {
  display: inline-flex; /* 使用 flex 实现图标和文字对齐 */
  align-items: center;
  gap: 0.5rem; /* 图标和文字的间距 */
  padding: 0.6rem 1.2rem;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;

  &.secondary {
    background-color: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      background-color: var(--color-border);
      color: var(--color-heading);
    }
  }

  &:not(.secondary) {
    background-color: var(--color-primary);
    color: #1a1a1a;

    &:hover {
      background-color: var(--color-primary-dark);
    }
  }
}
</style>
