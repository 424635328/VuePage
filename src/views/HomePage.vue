<!-- src/views/HomePage.vue -->
<template>
  <div class="home-page">
    <VideoSplashScreen
      v-if="isMaskActive"
      v-model:active="isMaskActive"
      video-src="/video/video.mp4"
      prompt-text="开启数字之旅"
    />

    <!-- 主要内容区域 -->
    <main v-else class="content-wrapper">
      <div class="aurora-background">
        <div class="aurora-blob one"></div>
        <div class="aurora-blob two"></div>
        <div class="aurora-blob three"></div>
      </div>
      <div class="particles"></div>

      <!-- 1. 英雄区 (Hero Section) - 优化核心 -->
      <section
        ref="heroSectionRef"
        class="hero-section fade-in-section"
        @mousemove="handleParallax"
      >
        <div class="container hero-container">
          <!-- 装饰性的玻璃卡片，现在应用了视差效果 -->
          <div class="glass-pane decor-pane-1" :style="parallaxLayer2"></div>
          <div class="glass-pane decor-pane-2" :style="parallaxLayer2"></div>

          <!-- 主要内容玻璃卡片，现在应用了视差效果 -->
          <div class="glass-pane main-content-pane" :style="parallaxLayer1">
            <h1 class="hero-title">
              铸造现在<span class="comma">,</span>
              <br/>
              驱动未来
            </h1>
            <p class="hero-subtitle">
              我们不仅是开发者，更是您愿景的架构师，将复杂挑战转化为优雅、高性能的数字解决方案。
            </p>
            <div class="hero-cta-group">
              <a href="/shop" class="cta-button primary">
                <span>进入探索</span>
                <i class='bx bx-right-arrow-alt'></i>
              </a>
              <a href="/vault" class="cta-button secondary">
                <span>知识仓库</span>
              </a>
            </div>
            <div class="terminal-deco">
              &gt; vision_to_reality.sh<span class="cursor">_</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. 服务范围 (Services Section) - 保持结构，优化样式细节 -->
      <section ref="servicesSectionRef" class="services-section fade-in-section">
        <div class="container">
          <h2 class="section-title">全方位数字服务</h2>
          <div class="services-grid">
            <div v-for="(service, index) in services" :key="service.title" class="service-card" :style="{'--delay': index * 0.1 + 's'}">
              <div class="service-icon">
                <i :class="service.icon"></i>
              </div>
              <h3 class="service-title">{{ service.title }}</h3>
              <p class="service-description">{{ service.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 作品集/案例展示 (Portfolio Section) - 保持结构，优化样式细节 -->
      <section id="portfolio" ref="portfolioSectionRef" class="portfolio-section fade-in-section">
        <div class="container">
          <h2 class="section-title">我们的作品</h2>
          <div class="portfolio-grid">
            <a href="#" v-for="(item, index) in portfolioItems" :key="item.title" class="portfolio-card" :style="{'--delay': index * 0.1 + 's'}">
              <img :src="item.image" :alt="item.title" class="portfolio-image-bg" />
              <div class="portfolio-content">
                <span class="portfolio-category">{{ item.category }}</span>
                <h3 class="portfolio-title">{{ item.title }}</h3>
              </div>
            </a>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import VideoSplashScreen from '@/components/VideoSplashScreen.vue';

// --- State and Refs ---
const isMaskActive = ref(true);

const heroSectionRef = ref(null);
const servicesSectionRef = ref(null);
const portfolioSectionRef = ref(null);

// [新增] 用于鼠标视差效果的状态
const mouseX = ref(0);
const mouseY = ref(0);

// --- Data ---
const services = ref([
  { icon: 'bx bx-layer', title: 'UI/UX 策略与设计', description: '打造用户喜爱、直观易用的界面，提升产品价值。' },
  { icon: 'bx bx-code-block', title: 'Web与移动端开发', description: '构建响应迅速、性能卓越、跨平台的应用程序。' },
  { icon: 'bx bx-cloud', title: '云架构与DevOps', description: '提供可扩展、安全可靠的云解决方案与自动化流程。' },
  { icon: 'bx bx-brain', title: 'AI & 大数据集成', description: '利用前沿技术，从数据中挖掘洞见，赋能智能决策。' }
]);

const portfolioItems = ref([
  { image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800', category: '数据可视化', title: '企业级数据仪表盘' },
  { image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800', category: '电子商务', title: '高端生活方式电商' },
  { image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800', category: '移动应用', title: '智能健康伴侣App' }
]);

// --- Computed Properties for Parallax ---
// [新增] 计算视差效果的样式
const parallaxLayer1 = computed(() => {
  const x = (mouseX.value - (heroSectionRef.value?.clientWidth ?? 0) / 2) / 30;
  const y = (mouseY.value - (heroSectionRef.value?.clientHeight ?? 0) / 2) / 30;
  return { transform: `rotate(-6deg) translateX(${x}px) translateY(${y}px)` };
});

const parallaxLayer2 = computed(() => {
  const x = (mouseX.value - (heroSectionRef.value?.clientWidth ?? 0) / 2) / 15;
  const y = (mouseY.value - (heroSectionRef.value?.clientHeight ?? 0) / 2) / 15;
  return { transform: `translateX(${x}px) translateY(${y}px)` };
});

// --- Methods ---
// [新增] 处理鼠标移动事件，更新坐标
const handleParallax = (event) => {
  if (heroSectionRef.value) {
    const rect = heroSectionRef.value.getBoundingClientRect();
    mouseX.value = event.clientX - rect.left;
    mouseY.value = event.clientY - rect.top;
  }
};

// --- Intersection Observer (保持不变) ---
const setupIntersectionObserver = () => {
  const sections = [
    heroSectionRef.value,
    servicesSectionRef.value,
    portfolioSectionRef.value,
  ].filter(el => el);

  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // 触发子元素的动画
          const children = entry.target.querySelectorAll('.service-card, .portfolio-card');
          children.forEach(child => child.classList.add('is-visible'));
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  sections.forEach(section => observer.observe(section));
};

// --- Lifecycle Hooks ---
watch(isMaskActive, (isActive) => {
  if (!isActive) {
    nextTick(setupIntersectionObserver);
  }
});

onMounted(() => {
  if (!isMaskActive.value) {
    nextTick(setupIntersectionObserver);
  }
});
</script>

<style lang="scss" scoped>
/* --- 全局变量和基础样式 (保持不变) --- */
:root {
  --glow-color-1: #00c2ff;
  --glow-color-2: #33ffdd;
  --glow-color-3: #ffcc00;
  --glow-color-4: #cc33ff;
  --dark-bg: #010409;
  --light-text: #f0f6fc;
  --mid-text: #8b949e;
  --glass-bg: rgba(22, 27, 34, 0.5);
  --glass-border: rgba(139, 148, 158, 0.3);
  --highlight-bg: rgba(3, 128, 255, 0.15);
}

.home-page {
  position: relative;
  background-color: var(--dark-bg);
  color: var(--light-text);
  min-height: 100vh;
  overflow-x: hidden; // 防止视差效果导致横向滚动条

  &::before {
    content: "";
    position: fixed; // 改为 fixed，使其在滚动时也保持
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-image: repeating-linear-gradient(to right, transparent, transparent 100px, rgba(139, 148, 158, 0.05) 101px, transparent 102px, transparent 200px);
    z-index: 1;
    pointer-events: none; // 确保不干扰鼠标事件
  }
}

.aurora-background {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  filter: blur(100px);
  z-index: 0;
}

.aurora-blob {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: screen; // 使用 screen 混合模式效果更佳
  opacity: 0.4;
  &.one { width: 500px; height: 500px; background: var(--glow-color-1); top: -150px; left: -150px; animation: move-blob-1 20s infinite alternate; }
  &.two { width: 400px; height: 400px; background: var(--glow-color-3); top: 50px; right: -100px; animation: move-blob-2 25s infinite alternate; }
  &.three { width: 450px; height: 450px; background: var(--glow-color-4); bottom: -200px; left: 10%; animation: move-blob-3 18s infinite alternate; }
}

@keyframes move-blob-1 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(100px, 50px) rotate(30deg); } }
@keyframes move-blob-2 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-80px, 40px) rotate(-45deg); } }
@keyframes move-blob-3 { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(60px, -60px) rotate(60deg); } }

.particles {
  position: fixed; // 改为 fixed
  top: 0; left: 0;
  width: 1px; height: 1px;
  background: transparent;
  box-shadow:
    -13vw 33vh 1px #fff, 8vw 9vh 0px #fff, 6vw 48vh 1px #fff,
    31vw 2vh 0px #fff, 45vw 24vh 1px #fff, 50vw 81vh 0px #fff,
    63vw 8vh 1px #fff, 68vw 48vh 1px #fff, 78vw 2vh 1px #fff,
    80vw 61vh 0px #fff, -1vw 32vh 0px #fff, 93vw 95vh 0px #fff,
    10vw 10vh 0px #fff, 20vw 30vh 1px #fff, 40vw 50vh 0px #fff,
    60vw 70vh 1px #fff, 80vw 90vh 0px #fff;
  animation: twinkle 5s infinite linear;
  z-index: 1;
}
@keyframes twinkle { 0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }

.content-wrapper { position: relative; z-index: 2; width: 100%; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
section { padding: 6rem 0; }
.fade-in-section { opacity: 0; transition: opacity 0.8s ease; &.is-visible { opacity: 1; } }
.section-title { font-size: 2.5rem; font-weight: 600; text-align: center; margin-bottom: 4rem; opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s; }
.fade-in-section.is-visible .section-title { opacity: 1; transform: translateY(0); }

/* --- 1. Hero Section 优化 --- */
.hero-section { min-height: 100vh; display: flex; align-items: center; position: relative; perspective: 1000px; /* 为3D视差效果添加透视 */ }
.hero-container { position: relative; display: flex; justify-content: center; align-items: center; width: 100%; }

.glass-pane {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); // 平滑的视差过渡
}
.main-content-pane {
  padding: 3rem;
  z-index: 10;
  max-width: 750px;
  position: relative; // 为内部绝对定位元素提供上下文
}
.decor-pane-1 { position: absolute; width: 300px; height: 200px; bottom: -80px; left: 20px; transform: rotate(15deg); z-index: 5; }
.decor-pane-2 { position: absolute; width: 250px; height: 350px; top: -100px; right: 50px; transform: rotate(10deg); z-index: 5; }
.hero-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 700; line-height: 1.2; margin-bottom: 1.5rem; .comma { color: var(--mid-text); } }
.hero-subtitle { font-size: 1.1rem; max-width: 550px; color: var(--mid-text); line-height: 1.7; margin-bottom: 2.5rem; }

/* [新增] 终端装饰样式 */
.terminal-deco {
  position: absolute;
  bottom: 1.5rem;
  left: 3rem;
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  color: var(--mid-text);
  font-size: 0.9rem;
  opacity: 0.6;
  pointer-events: none;

  .cursor {
    display: inline-block;
    background-color: var(--glow-color-2);
    width: 8px;
    height: 1.1rem;
    vertical-align: middle;
    margin-left: 4px;
    animation: blink 1s infinite step-end;
  }
}
@keyframes blink { 50% { opacity: 0; } }

/* --- [优化核心] 按钮组和按钮的全新样式 --- */
.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 12px rgba(0, 194, 255, 0.3); }
  50% { box-shadow: 0 0 24px rgba(0, 194, 255, 0.6); }
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.8rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: var(--light-text);
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  i { transition: transform 0.3s ease; }

  &:active {
    transform: translateY(0) scale(0.98);
    transition-duration: 0.1s;
  }
}

.cta-button.primary {
  background-color: var(--highlight-bg);
  border-color: var(--glass-border);
  animation: pulse-glow 3s infinite ease-in-out;

  &:hover {
    transform: translateY(-3px);
    background-color: rgba(3, 128, 255, 0.25);
    border-color: var(--glow-color-1);
    box-shadow: 0 6px 20px rgba(0, 194, 255, 0.2);

    i {
      transform: translateX(4px);
    }
  }
}

.cta-button.secondary {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--glass-border);

  &:hover {
    transform: translateY(-3px);
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--light-text);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
}

/* --- 2 & 3. 服务与作品集卡片优化 --- */
.services-grid, .portfolio-grid {
  --base-delay: 0.3s;
}

.service-card, .portfolio-card {
  transform: translateY(30px);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1),
              box-shadow 0.3s ease,
              border-color 0.3s ease,
              opacity 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  transition-delay: calc(var(--base-delay) + var(--delay, 0s));

  &.is-visible {
    transform: translateY(0);
    opacity: 1;
  }
}

.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
.service-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 2rem; text-align: center; backdrop-filter: blur(10px); &:hover { transform: translateY(-8px); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); border-color: var(--glow-color-2); } }
.service-icon { font-size: 2.5rem; color: var(--glow-color-2); margin-bottom: 1.5rem; display: inline-block; text-shadow: 0 0 15px rgba(51, 255, 221, 0.5); }
.service-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--light-text); }
.service-description { color: var(--mid-text); line-height: 1.6; font-size: 0.9rem; }

.portfolio-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.portfolio-card { border-radius: 16px; overflow: hidden; position: relative; aspect-ratio: 4 / 3; border: 1px solid var(--glass-border); display: block; text-decoration: none; &:hover { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); transform: translateY(-8px) scale(1.02); border-color: var(--glow-color-1); .portfolio-image-bg { transform: scale(1.1); } } }
.portfolio-image-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; z-index: 1; }
.portfolio-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; background: linear-gradient(to top, rgba(1, 4, 9, 0.9), transparent); z-index: 2; color: var(--light-text); transform: translateY(20%); opacity: 0; transition: transform 0.4s ease, opacity 0.4s ease; }
.portfolio-card:hover .portfolio-content { transform: translateY(0); opacity: 1; }
.portfolio-category { display: inline-block; background: var(--highlight-bg); color: var(--glow-color-1); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.75rem; }
.portfolio-title { font-size: 1.4rem; font-weight: 600; }

/* --- 响应式设计 --- */
@media (max-width: 768px) {
  section { padding: 4rem 0; }
  .main-content-pane, .decor-pane-1, .decor-pane-2 { transform: rotate(0) !important; /* !important 覆盖JS内联样式 */ }
  .decor-pane-1, .decor-pane-2 { display: none; }
  .main-content-pane { padding: 2.5rem 2rem; }
  .hero-title { font-size: 2.2rem; }
  .hero-subtitle { font-size: 1rem; }
  .terminal-deco { left: 2rem; }
  .hero-cta-group { justify-content: center; }
  .section-title { font-size: 2rem; }
}
</style>
