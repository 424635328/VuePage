<!-- src/components/HomePage.vue -->
<template>
  <div class="home-page">
    <!-- 视频开屏 -->
    <VideoSplashScreen
      v-if="isMaskActive"
      v-model:active="isMaskActive"
      video-src="/video/video.mp4"
      prompt-text="开始探索"
    />

    <div v-else class="container">
      <!-- 英雄区 -->
      <section ref="heroSectionRef" class="hero-section fade-in-section">
        <h1 class="hero-title">
          <span class="gradient-text">未来已来</span>，我们为您构建它
        </h1>
        <p class="hero-subtitle">
          在 MHStudio，我们用创意、代码与技术，打造兼具速度与美感的数字化体验，让您的业务领先一步。
        </p>
        <router-link to="/shop" class="cta-button">立即了解</router-link>
      </section>

      <!-- 服务亮点 -->
      <section ref="featuresSectionRef" class="features-section fade-in-section">
        <h2 class="section-title">我们能为您做什么</h2>
        <div class="features-grid">
          <FeatureCard
            v-for="(feature, index) in features"
            :key="index"
            :title="feature.title"
            :description="feature.description"
          >
            <template #icon>
              <div class="icon-wrapper" v-html="feature.icon"></div>
            </template>
          </FeatureCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import FeatureCard from '@/components/FeatureCard.vue';
import VideoSplashScreen from '@/components/VideoSplashScreen.vue';

const isMaskActive = ref(true);
const heroSectionRef = ref(null);
const featuresSectionRef = ref(null);

const features = [
  {
    title: '高端定制开发',
    description: '为品牌量身打造独一无二的数字化产品，提升竞争力。',
    icon: `<svg ...></svg>`
  },
  {
    title: '性能优化',
    description: '极致性能调优，让您的网站与应用秒速响应。',
    icon: `<svg ...></svg>`
  },
  {
    title: '视觉设计',
    description: '融合美学与交互，打造沉浸式用户体验。',
    icon: `<svg ...></svg>`
  },
  {
    title: '跨平台支持',
    description: '从Web到移动端，一次开发，全平台覆盖。',
    icon: `<svg ...></svg>`
  }
];

watch(isMaskActive, (isActive) => {
  if (!isActive) {
    nextTick(setupIntersectionObserver);
  }
});

function setupIntersectionObserver() {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  [heroSectionRef.value, featuresSectionRef.value].forEach(el => el && observer.observe(el));
}
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  background: transparent; /* 透明背景 */
  color: #fff;
  min-height: 100vh;
}

.gradient-text {
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-section {
  text-align: center;
  padding: 8rem 0 6rem;
  background: transparent; /* 透明背景 */
}

.hero-title {
  font-size: 3.8rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  max-width: 650px;
  margin: 0 auto 2.5rem;
  color: rgba(255, 255, 255, 0.85);
}

.cta-button {
  padding: 1rem 2.5rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  color: #0f172a;
  font-weight: 600;
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px -8px rgba(56, 189, 248, 0.6);
  }
}

.features-section {
  padding: 6rem 0;
  background: transparent; /* 透明背景 */
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 40px;
    height: 40px;
    transition: transform 0.3s, filter 0.3s;
  }
  &:hover svg {
    transform: scale(1.1);
    filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.7));
  }
}

.fade-in-section {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s ease, transform 1s ease;
}

.fade-in-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
