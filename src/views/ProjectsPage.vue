<!-- src/views/ProjectsPage.vue -->

<template>
  <div class="projects-page">
    <!-- 1. 使用 container 统一页面布局 -->
    <div class="container">
      <header class="page-header" ref="headerRef">
        <h1 class="page-title">项目作品</h1>
        <p class="page-description">这里是我参与开发或独立完成的一些项目，展示了我在不同领域的技术应用。</p>
      </header>

      <div v-if="loading" class="loading-state">正在加载...</div>
      <div v-if="error" class="error-state">{{ error }}</div>

      <!-- 2. 添加 ref 用于动画 -->
      <div v-if="projects.length" class="projects-grid" ref="gridRef">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ProjectCard from '@/components/ProjectCard.vue';

const projects = ref([]);
const loading = ref(true);
const error = ref(null);

// 3. 添加动画所需的 ref
const headerRef = ref(null);
const gridRef = ref(null);

// 4. 实现滚动触发动画的逻辑
onMounted(async () => {
  try {
    const response = await import('@/assets/projects.json');
    projects.value = response.default;
  } catch (e) {
    error.value = '无法加载项目数据，请稍后重试。';
    console.error(e);
  } finally {
    loading.value = false;
  }

  // 等待数据加载完成且 DOM 更新后再执行动画设置
  await new Promise(resolve => setTimeout(resolve, 0));

  const options = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  if (headerRef.value) observer.observe(headerRef.value);
  if (gridRef.value) observer.observe(gridRef.value);
});
</script>

<style lang="scss" scoped>
/* 5. 页面布局和动画样式 */
.projects-page {
  padding: 4rem 0;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
  /* 动画初始状态 */
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.page-header.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.page-description {
  max-width: 600px;
  margin: 0 auto;
  color: var(--color-text);
  font-size: 1.1rem;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2.5rem;

  /* 为卡片设置交错动画 */
  &.is-visible :deep(.project-card) {
    opacity: 1;
    transform: translateY(0);
    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        transition-delay: #{0.1 * ($i - 1)}s;
      }
    }
  }
}

/* 使用 :deep() 选择子组件的根元素来设置动画初始状态 */
:deep(.project-card) {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: var(--color-text-light);
}

.error-state {
  color: #e53e3e; /* 假设的错误颜色 */
}
</style>
