<!-- src/views/AboutPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 动态打字效果的状态
const typedText = ref('');
const fullText = "我们是代码的炼金术士，是设计的未来派。在数字的霓虹丛林中，MHStudio 将像素与激情熔合，构建不仅仅是网站，而是沉浸式的数字体验。我们相信，每一行代码都应 pulsate with purpose，每一个界面都应是通往未来的传送门。";
let charIndex = 0;

const typeWriter = () => {
  if (charIndex < fullText.length) {
    typedText.value += fullText.charAt(charIndex);
    charIndex++;
    setTimeout(typeWriter, 30); // 调整打字速度
  }
};

// 视差效果的状态
const parallaxStyle = ref({});
const handleScroll = () => {
  const offset = window.pageYOffset;
  parallaxStyle.value = {
    transform: `translateY(${offset * 0.3}px)`
  };
};

onMounted(() => {
  typeWriter();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// 团队成员数据
const teamMembers = ref([
  {
    name: 'Alex "Glitch" Mercer',
    role: '首席架构师 / 赛博格',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    bio: '代码是他的母语，二进制是他的血液。能够凭空构建出数字世界的摩天大楼。'
  },
  {
    name: 'Nova "Neon" Chen',
    role: 'UI/UX 设计总监 / 光影术士',
    avatar: 'https://i.pravatar.cc/150?u=nova',
    bio: '她用霓虹和光影作画，创造出既美观又直观的用户界面，让用户流连忘返。'
  },
  {
    name: 'Jax "Forge" Yamamoto',
    role: '全栈工程师 / 机械师',
    avatar: 'https://i.pravatar.cc/150?u=jax',
    bio: '从前端到后端，从数据库到云端，没有他无法驾驭的机械巨兽。'
  }
]);
</script>

<template>
  <div class="about-page">
    <!-- Section 1: Hero -->
    <section class="hero-section">
      <div class="hero-background" :style="parallaxStyle"></div>
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <h1 class="glitch" data-text="关于 MHStudio">关于 MHStudio</h1>
        <p class="hero-subtitle">
          {{ typedText }}<span class="cursor"></span>
        </p>
      </div>
    </section>

    <!-- Section 2: Our Story (Timeline) -->
    <section class="story-section container">
      <h2 class="section-title glitch" data-text="我们的旅程">我们的旅程</h2>
      <div class="timeline">
        <div class="timeline-item left">
          <div class="timeline-content">
            <h3>2021 - 创世纪</h3>
            <p>在一个被数据淹没的夜晚，MHStudio 的概念在一个咖啡因驱动的梦中诞生。我们的目标是：打破常规，创造不凡。</p>
            <time>2021 Q4</time>
          </div>
        </div>
        <div class="timeline-item right">
          <div class="timeline-content">
            <h3>2022 - 首个项目</h3>
            <p>我们发布了第一个全栈企业级商店系统，集成了当时最前沿的技术，获得了业界的初步认可。</p>
            <time>2022 Q3</time>
          </div>
        </div>
        <div class="timeline-item left">
          <div class="timeline-content">
            <h3>2023 - 团队扩张</h3>
            <p>光影术士和机械师的加入，让我们的创造力达到了新的高度，能够承接更复杂、更具挑战性的项目。</p>
            <time>2023 Q1</time>
          </div>
        </div>
        <div class="timeline-item right">
          <div class="timeline-content">
            <h3>未来 - 无限可能</h3>
            <p>我们的征途是星辰大海。我们将继续探索 AI、Web3 和元宇宙的边界，定义下一个数字时代。</p>
            <time>NOW & BEYOND</time>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 3: Meet the Team -->
    <section class="team-section">
      <div class="container">
        <h2 class="section-title glitch" data-text="核心矩阵">核心矩阵</h2>
        <div class="team-grid">
          <div v-for="member in teamMembers" :key="member.name" class="team-card">
            <div class="card-border"></div>
            <div class="card-content">
              <img :src="member.avatar" :alt="member.name" class="team-avatar">
              <h3>{{ member.name }}</h3>
              <p class="role">{{ member.role }}</p>
              <p class="bio">{{ member.bio }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 4: Our Philosophy -->
    <section class="philosophy-section container">
      <h2 class="section-title glitch" data-text="我们的信条">我们的信条</h2>
      <div class="philosophy-grid">
        <div class="philosophy-item">
          <div class="icon-wrapper">
            <i class="icon-code"></i>
          </div>
          <h3>代码即诗</h3>
          <p>我们相信优雅的代码本身就是一种艺术。它应该清晰、高效，并为未来的扩展性奠定坚实的基础。</p>
        </div>
        <div class="philosophy-item">
          <div class="icon-wrapper">
            <i class="icon-design"></i>
          </div>
          <h3>设计至上</h3>
          <p>用户体验是我们的最高指令。我们痴迷于每一个像素的细节，确保界面不仅美观，而且符合直觉。</p>
        </div>
        <div class="philosophy-item">
          <div class="icon-wrapper">
            <i class="icon-future"></i>
          </div>
          <h3>拥抱未来</h3>
          <p>我们从不满足于现状。我们持续学习和实验新兴技术，确保我们的客户永远走在技术浪潮的前沿。</p>
        </div>
      </div>
    </section>

    <!-- Section 5: Call to Action -->
    <section class="cta-section">
       <div class="cta-overlay"></div>
       <div class="container cta-content">
          <h2 class="glitch" data-text="准备好创造未来了吗？">准备好创造未来了吗？</h2>
          <p>无论你有一个疯狂的想法，还是需要一个强大的数字解决方案，我们都在这里。</p>
          <router-link to="/contact" class="cta-button">连接我们的矩阵</router-link>
       </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// 导入 Google Fonts (可以在 index.html 或主 SCSS 文件中导入)
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@300;400&display=swap');

// --- 动画定义 ---
@keyframes glitch-anim {
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  to { transform: translate(0); }
}
@keyframes glitch-skew {
  0% { clip-path: inset(40% 0 40% 0); transform: skew(0.53deg); }
  10% { clip-path: inset(20% 0 60% 0); transform: skew(0.79deg); }
  20% { clip-path: inset(80% 0 10% 0); transform: skew(0.48deg); }
  // ... (省略部分关键帧)
  100% { clip-path: inset(40% 0 40% 0); transform: skew(0.53deg); }
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// --- 页面基础样式 ---
.about-page {
  background-color: var(--color-background);
  color: var(--color-text);
  overflow-x: hidden;
}

.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4rem;
  color: var(--color-heading);
  position: relative;
  text-transform: uppercase;
}

// Glitch 文本效果
.glitch {
  position: relative;
  color: var(--color-primary);
  text-shadow:
    0 0 5px rgba(var(--color-primary-rgb), 0.5),
    0 0 10px rgba(var(--color-primary-rgb), 0.5);

  &::before, &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--color-background);
    overflow: hidden;
  }
  &::before {
    left: 2px;
    text-shadow: -1px 0 #ff00c1;
    animation: glitch-skew 2s infinite linear alternate-reverse;
  }
  &::after {
    left: -2px;
    text-shadow: -1px 0 #00fff9, 1px 1px #ff00c1;
    animation: glitch-skew 3s infinite linear alternate-reverse;
  }
}

// --- Hero Section ---
.hero-section {
  position: relative;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  padding: 2rem;

  .hero-background {
    position: absolute;
    top: -50px; left: 0;
    width: 100%; height: calc(100% + 100px);
    background-image: url('https://images.unsplash.com/photo-1518698942938-d65451525a37?q=80&w=2070'); // 赛博朋克城市背景
    background-size: cover;
    background-position: center;
    transition: transform 0.2s ease-out;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, var(--color-background) 0%, rgba(var(--color-background-rgb), 0.5) 100%);
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
  }

  h1 {
    font-size: 4.5rem;
    margin-bottom: 1.5rem;
  }

  .hero-subtitle {
    font-family: 'Roboto', sans-serif;
    font-size: 1.25rem;
    line-height: 1.8;
    color: var(--color-text-dark);
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    .cursor {
      display: inline-block;
      width: 10px;
      height: 1.25rem;
      background-color: var(--color-primary);
      margin-left: 5px;
      animation: cursor-blink 1s infinite;
      vertical-align: bottom;
    }
  }
}

// --- Story Section (Timeline) ---
.story-section { padding: 6rem 0; }
.timeline {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;

  &::after {
    content: '';
    position: absolute;
    width: 4px;
    background: var(--color-primary);
    top: 0; bottom: 0;
    left: 50%;
    margin-left: -2px;
    box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.8);
    animation: grow-line 2s ease-out forwards;
  }
  @keyframes grow-line {
    from { height: 0; }
    to { height: 100%; }
  }
}
.timeline-item {
  padding: 10px 40px;
  position: relative;
  width: 50%;

  &::after {
    content: '';
    position: absolute;
    width: 25px;
    height: 25px;
    right: -17px;
    background-color: var(--color-background);
    border: 4px solid var(--color-primary);
    top: 15px;
    border-radius: 50%;
    z-index: 1;
    box-shadow: 0 0 15px rgba(var(--color-primary-rgb), 1);
  }
  &.left { left: 0; }
  &.right {
    left: 50%;
    &::after { left: -14px; }
  }
}
.timeline-content {
  padding: 2rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  position: relative;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    border-color: var(--color-primary);
  }

  h3 {
    margin: 0 0 0.5rem;
    color: var(--color-heading);
    font-family: 'Orbitron', sans-serif;
  }
  p { margin: 0; color: var(--color-text-dark); }
  time {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    font-weight: bold;
    background: var(--color-primary);
    color: var(--color-background);
    border-radius: 4px;
  }
}

// --- Team Section ---
.team-section {
  padding: 6rem 0;
  background: linear-gradient(180deg, var(--color-background) 0%, var(--color-background-mute) 100%);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
}
.team-card {
  position: relative;
  padding: 2px; /* for border gradient */
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(45deg, #ff00c1, #00fff9);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-10px) scale(1.02);
    .card-border {
      opacity: 1;
      animation: spin 4s linear infinite;
    }
  }

  .card-border {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: conic-gradient(from 180deg at 50% 50%, #ff00c1, #00fff9, #ff00c1);
    opacity: 0.5;
    transition: opacity 0.3s;
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); }}

  .card-content {
    background: var(--color-background-soft);
    padding: 2.5rem 2rem;
    border-radius: 10px;
    position: relative;
    z-index: 1;
    text-align: center;
    height: 100%;
  }

  .team-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid var(--color-primary);
    margin: 0 auto 1.5rem;
    box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.7);
  }

  h3 {
    margin: 0;
    font-family: 'Orbitron', sans-serif;
    color: var(--color-heading);
  }
  .role {
    color: var(--color-primary);
    font-size: 0.9rem;
    margin: 0.5rem 0 1rem;
  }
  .bio {
    color: var(--color-text-dark);
    font-size: 0.95rem;
    line-height: 1.6;
  }
}

// --- Philosophy Section ---
.philosophy-section {
  padding: 6rem 0;
}
.philosophy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 3rem;
}
.philosophy-item {
  text-align: center;
  padding: 2rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;

  .icon-wrapper {
    width: 80px; height: 80px;
    margin: 0 auto 2rem;
    border-radius: 50%;
    background: rgba(var(--color-primary-rgb), 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: var(--color-primary);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border: 1px solid var(--color-primary);
      border-radius: 50%;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
    }
  }

  &:hover {
    border-color: var(--color-border);
    transform: translateY(-5px);
    .icon-wrapper::before {
      opacity: 1;
      transform: scale(1);
    }
  }

  h3 {
    font-family: 'Orbitron', sans-serif;
    color: var(--color-heading);
    margin-bottom: 1rem;
  }
  p {
    color: var(--color-text-dark);
    line-height: 1.7;
  }
}
// Placeholder for icons. Use real icon library like FontAwesome or SVGs
.icon-code::before { content: '</>'; font-weight: bold; }
.icon-design::before { content: '🎨'; }
.icon-future::before { content: '🚀'; }


// --- CTA Section ---
.cta-section {
  padding: 6rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  background-color: var(--color-background-mute);
  background-image:
    linear-gradient(var(--color-primary) 1px, transparent 1px),
    linear-gradient(to right, var(--color-primary) 1px, var(--color-background-mute) 1px);
  background-size: 40px 40px;

  .cta-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, transparent 30%, var(--color-background-mute) 80%);
  }
  .cta-content { position: relative; z-index: 1; }
  h2 { font-size: 3.5rem; margin-bottom: 1rem; }
  p {
    max-width: 600px;
    margin: 0 auto 2.5rem;
    font-size: 1.1rem;
    color: var(--color-text-dark);
  }
  .cta-button {
    display: inline-block;
    background-color: var(--color-primary);
    color: #1a1a1a;
    border: none;
    padding: 1rem 3rem;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s;
    &:hover {
      background-color: var(--color-primary-dark);
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(var(--color-primary-rgb), 0.7);
    }
  }
}

// --- Responsive Adjustments ---
@media (max-width: $breakpoint-md) {
  .section-title, .hero-section h1, .cta-section h2 { font-size: 2.5rem; }
  .timeline::after { left: 31px; }
  .timeline-item { width: 100%; padding-left: 70px; padding-right: 25px; }
  .timeline-item.right, .timeline-item.left { left: 0; }
  .timeline-item::after { left: 15px; }
}

</style>
