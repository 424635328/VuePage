<template>
  <div class="home-page">
    <MaskLoader
      v-if="isMaskActive"
      v-model:active="isMaskActive"
      enter-text="MHStudio"
      :background-opacity="0.85"
    />

    <div v-else class="container">
      <section ref="heroSectionRef" class="hero-section fade-in-section">
        <h1 class="hero-title">构建未来，用代码驱动创新</h1>
        <p class="hero-subtitle">我们是 MHStudio，专注于提供高性能、高颜值的数字化解决方案，助力您的业务腾飞。</p>
        <router-link to="/shop" class="cta-button">探索我们的产品</router-link>
      </section>

      <section ref="featuresSectionRef" class="features-section fade-in-section">
        <h2 class="section-title">核心技术栈</h2>
        <div class="features-grid">
          <FeatureCard title="Vue.js 生态" description="精通 Vue 3、Vue Router、Pinia、Vite，并拥有丰富的项目实践经验。">
            <template #icon><svg viewBox="0 0 256 221" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M204.8 0H256L128 220.8 0 0h97.92L128 51.2 157.44 0h47.36z" fill="currentColor"/><path d="M0 0l128 220.8L256 0h-51.2L128 132.48 50.56 0H0z" fill="currentColor"/></svg></template>
          </FeatureCard>
          <FeatureCard title="JavaScript / TypeScript" description="熟练掌握 ES6+ 及 TypeScript，注重代码质量、可维护性与类型安全。">
            <template #icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M1,1.68V22.31A.68.68,0,0,0,1.68,23H22.32A.68.68,0,0,0,23,22.31V1.68A.68.68,0,0,0,22.32,1H1.68A.68.68,0,0,0,1,1.68ZM15.4,18.33a4.24,4.24,0,0,1-3.21,1.47,4.3,4.3,0,0,1-4.29-4.32,4.31,4.31,0,0,1,4.29-4.32,4,4,0,0,1,3.13,1.39l-1.3,1.38a2,2,0,0,0-1.83-.9,2.2,2.2,0,1,0,0,4.4,2,2,0,0,0,1.83-1l1.3,1.4a4,4,0,0,1-3.13,1.5Zm5.44-5.46h-2v2.09a2.33,2.33,0,0,1-2.43,2.3,2.28,2.28,0,0,1-2.4-2.3v-2.1H16.2v2.1a.9.9,0,0,0,1,1,.91.91,0,0,0,1-1V12.87h2V18H22.14Z"/></svg></template>
          </FeatureCard>
          <FeatureCard title="CSS & 动画" description="擅长 SCSS 响应式布局，并能实现流畅、高性能的 CSS 动画与交互效果。">
            <template #icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M1.38,1.2l1.6,18.05,9,3,9-3L22.62,1.2ZM18.4,7.15l-6.44.05-0.05-2.22,8.87.1L21,2.85l-17.2,0,0.44,4.82h9.25l-0.34,3.75-3.51,0.94-3.5-0.95-0.22-2.48h-2.2l0.3,3.34,5.63,1.51,5.6-1.51,0.58-6.55Z"/></svg></template>
          </FeatureCard>
          <FeatureCard title="工程化与性能" description="熟悉 Vite/Webpack 配置、性能优化、跨端开发和 CI/CD 自动化流程。">
            <template #icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.43,12.98c0.04-0.32,0.07-0.64,0.07-0.98s-0.03-0.66-0.07-0.98l2.11-1.65c0.19-0.15,0.24-0.42,0.12-0.64l-2-3.46 c-0.12-0.22-0.39-0.3-0.61-0.22l-2.49,1c-0.52-0.4-1.08-0.73-1.69-0.98l-0.38-2.65C14.46,2.18,14.25,2,14,2h-4 c-0.25,0-0.46,0.18-0.49,0.42L9.13,5.07C8.52,5.32,7.96,5.66,7.44,6.05l-2.49-1c-0.23-0.09-0.49,0-0.61,0.22l-2,3.46 c-0.13,0.22-0.07,0.49,0.12,0.64l2.11,1.65C4.57,11.34,4.5,11.67,4.5,12s0.07,0.66,0.14,0.98l-2.11,1.65 c-0.19,0.15-0.24,0.42-0.12,0.64l2,3.46c0.12,0.22,0.39,0.3,0.61,0.22l2.49-1c0.52,0.4,1.08,0.73,1.69,0.98l0.38,2.65 C9.54,21.82,9.75,22,10,22h4c0.25,0,0.46-0.18,0.49-0.42l0.38-2.65c0.61-0.25,1.17-0.59,1.69-0.98l2.49,1 c0.23,0.09,0.49,0,0.61-0.22l2-3.46c0.12-0.22,0.07-0.49-0.12-0.64L19.43,12.98z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z"/></svg></template>
          </FeatureCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import FeatureCard from '@/components/FeatureCard.vue';
import MaskLoader from '@/components/MaskLoader.vue';

const isMaskActive = ref(true);

const heroSectionRef = ref(null);
const featuresSectionRef = ref(null);

watch(isMaskActive, (isActive) => {
  if (!isActive) {
    nextTick(() => {
      setupIntersectionObserver();
    });
  }
});

function setupIntersectionObserver() {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15,
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, options);

  if (heroSectionRef.value) observer.observe(heroSectionRef.value);
  if (featuresSectionRef.value) observer.observe(featuresSectionRef.value);
}
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  width: 100%;
}
.container {
  padding: 0 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.hero-section {
  text-align: center;
  padding: 6rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}
.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 650px;
  margin: 0 auto 2.5rem;
}
.cta-button {
  display: inline-block;
  padding: 1rem 2.5rem;
  background-color: #38bdf8;
  color: #0c1524;
  text-decoration: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s, background-color 0.3s;
  box-shadow: 0 4px 20px -5px rgba(56, 189, 248, 0.4);
  &:hover {
    transform: translateY(-4px);
    background-color: #7dd3fc;
    box-shadow: 0 8px 30px -8px rgba(56, 189, 248, 0.6);
  }
}
.features-section {
  padding: 6rem 0;
}
.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 4rem;
  font-weight: 600;
  color: #fff;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.fade-in-section {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
  & > * {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
}
.fade-in-section.is-visible {
  opacity: 1;
  transform: translateY(0);
  & > * {
    opacity: 1;
    transform: translateY(0);
  }
  .hero-title, .section-title { transition-delay: 0.1s; }
  .hero-subtitle { transition-delay: 0.2s; }
  .cta-button { transition-delay: 0.3s; }
  .features-grid > * {
    &:nth-child(1) { transition-delay: 0.2s; }
    &:nth-child(2) { transition-delay: 0.3s; }
    &:nth-child(3) { transition-delay: 0.4s; }
    &:nth-child(4) { transition-delay: 0.5s; }
  }
}
@media (max-width: 768px) {
  .container { padding: 0 1rem; }
  .hero-title { font-size: 2.8rem; }
  .hero-subtitle { font-size: 1.1rem; }
  .section-title { font-size: 2.2rem; }
}
</style>
