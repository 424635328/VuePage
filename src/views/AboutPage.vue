<!-- src/views/AboutPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
// 确保已安装: npm install vue3-particles tsparticles
import { loadFull } from "tsparticles";

// --- 状态与数据 ---

// 动态打字效果
const typedText = ref('');
const fullText = "我们是代码的炼金术士，是设计的未来派。在数字的霓虹丛林中，MHStudio 将像素与激情熔合，构建不仅仅是网站，而是沉浸式的数字体验。我们相信，每一行代码都应 pulsate with purpose，每一个界面都应是通往未来的传送门。";
let charIndex = 0;

// 团队成员数据
const teamMembers = ref([
  {
    name: 'Alex "Glitch" Mercer',
    role: '首席架构师 / 赛博格',
    avatar: 'https://i.pravatar.cc/200?u=alex',
    bio: '代码是他的母语，二进制是他的血液。能够凭空构建出数字世界的摩天大楼。',
    skills: ['System Design', 'Cloud Native', 'AI Integration']
  },
  {
    name: 'Nova "Neon" Chen',
    role: 'UI/UX 设计总监 / 光影术士',
    avatar: 'https://i.pravatar.cc/200?u=nova',
    bio: '她用霓虹和光影作画，创造出既美观又直观的用户界面，让用户流连忘返。',
    skills: ['User Experience', 'Motion Design', 'Figma']
  },
  {
    name: 'Jax "Forge" Yamamoto',
    role: '全栈工程师 / 机械师',
    avatar: 'https://i.pravatar.cc/200?u=jax',
    bio: '从前端到后端，从数据库到云端，没有他无法驾驭的机械巨兽。',
    skills: ['Vue.js', 'Node.js', 'DevOps']
  }
]);

// 新增：技术兵工厂数据
const techStack = ref([
  { name: 'Vue.js', category: 'Frontend', icon: '🚀' },
  { name: 'React', category: 'Frontend', icon: '⚛️' },
  { name: 'Node.js', category: 'Backend', icon: '⚙️' },
  { name: 'Python', category: 'Backend/AI', icon: '🐍' },
  { name: 'AWS', category: 'Cloud', icon: '☁️' },
  { name: 'Kubernetes', category: 'DevOps', icon: '☸️' },
  { name: 'Figma', category: 'Design', icon: '🎨' },
  { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
]);

// 新增：我们的信条数据
const philosophyItems = ref([
    { icon: '</>', title: '代码即诗', text: '我们相信优雅的代码本身就是一种艺术。它应该清晰、高效，并为未来的扩展性奠定坚实的基础。' },
    { icon: '🎨', title: '设计至上', text: '用户体验是我们的最高指令。我们痴迷于每一个像素的细节，确保界面不仅美观，而且符合直觉。' },
    { icon: '🚀', title: '拥抱未来', text: '我们从不满足于现状。我们持续学习和实验新兴技术，确保我们的客户永远走在技术浪潮的前沿。' }
]);


// --- 动效逻辑 ---

// 1. 打字机
const typeWriter = () => {
  if (charIndex < fullText.length) {
    typedText.value += fullText.charAt(charIndex);
    charIndex++;
    setTimeout(typeWriter, 25);
  } else {
    // 打字结束后，让光标持续闪烁
    document.querySelector('.hero-subtitle .cursor')?.classList.add('blinking');
  }
};

// 2. 鼠标悬浮卡片 3D 倾斜效果
const teamGridRef = ref(null);
const handleTeamCardMouseMove = (e) => {
  if (!teamGridRef.value) return;
  const cards = teamGridRef.value.querySelectorAll('.team-card');
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }
};


// 3. 粒子背景
const particlesInit = async (engine) => {
  await loadFull(engine);
};

const particlesOptions = {
  fullScreen: { enable: true, zIndex: -1 },
  fpsLimit: 120,
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'grab' },
      onClick: { enable: true, mode: 'push' }
    },
    modes: {
      grab: { distance: 150, links: { opacity: 0.8 } },
      push: { quantity: 4 }
    }
  },
  particles: {
    color: { value: '#00fff9' },
    links: { color: '#ffffff', distance: 150, enable: true, opacity: 0.15, width: 1 },
    collisions: { enable: true },
    move: { direction: 'none', enable: true, outModes: 'out', random: false, speed: 1, straight: false },
    number: { density: { enable: true, area: 800 }, value: 80 },
    opacity: { value: 0.3 },
    shape: { type: 'circle' },
    size: { value: { min: 1, max: 3 } }
  },
  detectRetina: true
};

// 4. 滚动触发动画的 Observer
let observer = null;


// --- 生命周期钩子 ---

onMounted(() => {
  // 启动打字机
  typeWriter();

  // **【关键修复】**
  // 在 onMounted 内部设置 IntersectionObserver，确保 DOM 元素已加载
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // 动画执行一次后停止观察，提升性能
        }
      });
    }, { threshold: 0.15 }); // 元素进入视口 15% 时触发

    animatedElements.forEach(el => observer.observe(el));
  } else {
    // 对不支持的旧浏览器做降级处理，直接显示所有元素
    animatedElements.forEach(el => el.classList.add('is-visible'));
  }

  // 绑定团队卡片鼠标移动事件
  if (teamGridRef.value) {
    teamGridRef.value.addEventListener('mousemove', handleTeamCardMouseMove);
  }
});

onUnmounted(() => {
  // 清理工作，防止内存泄漏
  if (observer) {
    observer.disconnect();
  }
  if (teamGridRef.value) {
    teamGridRef.value.removeEventListener('mousemove', handleTeamCardMouseMove);
  }
});

</script>

<template>
  <div class="about-page-wrapper">
    <!-- 动态粒子背景 -->
    <Particles id="tsparticles" :particlesInit="particlesInit" :options="particlesOptions" />

    <div class="about-page">
      <!-- Section 1: Hero -->
      <section class="hero-section">
        <div class="container hero-content">
          <h1 class="glitch animate-on-scroll" data-text="关于 MHStudio">关于 MHStudio</h1>
          <p class="hero-subtitle animate-on-scroll" style="--delay: 0.2s;">
            {{ typedText }}<span class="cursor"></span>
          </p>
        </div>
      </section>

      <!-- Section 2: Our Story (Timeline) -->
      <section class="story-section container">
        <h2 class="section-title glitch animate-on-scroll" data-text="我们的旅程">我们的旅程</h2>
        <div class="timeline">
          <!-- Timeline Items -->
          <div class="timeline-item left animate-on-scroll">
            <div class="timeline-content">
              <h3>2021 - 创世纪</h3>
              <p>在一个被数据淹没的夜晚，MHStudio 的概念在一个咖啡因驱动的梦中诞生。我们的目标是：打破常规，创造不凡。</p>
              <time>2021 Q4</time>
            </div>
          </div>
          <div class="timeline-item right animate-on-scroll" style="--delay: 0.1s;">
            <div class="timeline-content">
              <h3>2022 - 首个项目</h3>
              <p>我们发布了第一个全栈企业级商店系统，集成了当时最前沿的技术，获得了业界的初步认可。</p>
              <time>2022 Q3</time>
            </div>
          </div>
          <div class="timeline-item left animate-on-scroll" style="--delay: 0.2s;">
            <div class="timeline-content">
              <h3>2023 - 团队扩张</h3>
              <p>光影术士和机械师的加入，让我们的创造力达到了新的高度，能够承接更复杂、更具挑战性的项目。</p>
              <time>2023 Q1</time>
            </div>
          </div>
          <div class="timeline-item right animate-on-scroll" style="--delay: 0.3s;">
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
          <h2 class="section-title glitch animate-on-scroll" data-text="核心矩阵">核心矩阵</h2>
          <div class="team-grid" ref="teamGridRef">
            <div v-for="(member, index) in teamMembers" :key="member.name" class="team-card animate-on-scroll" :style="{'--delay': `${index * 0.1}s`}">
              <div class="card-content">
                 <div class="card-shine"></div>
                 <div class="card-border"></div>
                <img :src="member.avatar" :alt="member.name" class="team-avatar">
                <h3>{{ member.name }}</h3>
                <p class="role">{{ member.role }}</p>
                <p class="bio">{{ member.bio }}</p>
                <div class="skills">
                  <span v-for="skill in member.skills" :key="skill" class="skill-tag">{{ skill }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Tech Arsenal -->
      <section class="tech-section container">
        <h2 class="section-title glitch animate-on-scroll" data-text="技术兵工厂">技术兵工厂</h2>
        <div class="tech-grid">
          <div v-for="(tech, index) in techStack" :key="tech.name" class="tech-card animate-on-scroll" :style="{'--delay': `${index * 0.05}s`}">
            <div class="tech-icon">{{ tech.icon }}</div>
            <div class="tech-name">{{ tech.name }}</div>
            <div class="tech-category">{{ tech.category }}</div>
          </div>
        </div>
      </section>

      <!-- Section 5: Our Philosophy **【内容已补全】** -->
      <section class="philosophy-section container">
        <h2 class="section-title glitch animate-on-scroll" data-text="我们的信条">我们的信条</h2>
        <div class="philosophy-grid">
           <div v-for="(item, index) in philosophyItems" :key="item.title" class="philosophy-item animate-on-scroll" :style="{'--delay': `${index * 0.15}s`}">
                <div class="icon-wrapper">
                    <span class="icon">{{ item.icon }}</span>
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.text }}</p>
            </div>
        </div>
      </section>

      <!-- Section 6: Call to Action -->
      <section class="cta-section">
         <div class="container cta-content">
            <h2 class="glitch animate-on-scroll" data-text="准备好创造未来了吗？">准备好创造未来了吗？</h2>
            <p class="animate-on-scroll" style="--delay: 0.2s;">无论你有一个疯狂的想法，还是需要一个强大的数字解决方案，我们都在这里。</p>
            <router-link to="/home" class="cta-button animate-on-scroll" style="--delay: 0.4s;">连接我们的矩阵</router-link>
         </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 确保你有一个主SCSS文件来定义变量，或者在这里定义
:root {
  --color-primary: #00fff9;
  --color-secondary: #ff00c1;
  --color-primary-rgb: 0, 255, 249;
  --color-text: #e0e0e0;
  --color-heading: #ffffff;
  --color-background-soft: rgba(22, 28, 41, 0.85); /* 增加一点不透明度，提高可读性 */
  --color-border: rgba(var(--color-primary-rgb), 0.2);
  --font-body: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  --font-heading: 'Orbitron', 'sans-serif';
}

@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@300;400&display=swap');

// --- 动画定义 ---
@keyframes glitch-skew {
  0% { clip-path: inset(40% 0 40% 0); transform: skew(0.53deg); } 10% { clip-path: inset(20% 0 60% 0); transform: skew(0.79deg); } 20% { clip-path: inset(80% 0 10% 0); transform: skew(0.48deg); } 30% { clip-path: inset(40% 0 15% 0); transform: skew(0.98deg); } 40% { clip-path: inset(70% 0 5% 0); transform: skew(0.12deg); } 50% { clip-path: inset(10% 0 80% 0); transform: skew(0.32deg); } 60% { clip-path: inset(50% 0 50% 0); transform: skew(0.81deg); } 70% { clip-path: inset(25% 0 55% 0); transform: skew(0.24deg); } 80% { clip-path: inset(90% 0 5% 0); transform: skew(0.69deg); } 90% { clip-path: inset(5% 0 70% 0); transform: skew(0.45deg); } 100% { clip-path: inset(40% 0 40% 0); transform: skew(0.53deg); }
}
@keyframes cursor-blink { 50% { opacity: 0; } }
@keyframes grow-line { from { transform: scaleY(0); } to { transform: scaleY(1); } }

// --- 基础样式 ---
.about-page-wrapper { background: transparent; }
.about-page {
  font-family: var(--font-body);
  color: var(--color-text);
  overflow-x: hidden;
  position: relative;
  z-index: 1;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
section { padding: 8rem 0; position: relative; }
.section-title { font-family: var(--font-heading); font-size: clamp(2.5rem, 5vw, 4rem); text-align: center; margin-bottom: 5rem; color: var(--color-heading); text-transform: uppercase; }

.glitch {
  position: relative;
  color: var(--color-primary);
  text-shadow: 0 0 5px rgba(var(--color-primary-rgb), 0.8), 0 0 10px rgba(var(--color-primary-rgb), 0.6), 0 0 20px rgba(var(--color-primary-rgb), 0.4), 0 0 40px rgba(var(--color-secondary), 0.4);
  &::before, &::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; clip-path: inset(50% 0 50% 0); }
  &::before { left: -2px; text-shadow: 2px 0 var(--color-secondary); animation: glitch-skew 3s infinite linear alternate-reverse; }
  &::after { left: 2px; text-shadow: -2px 0 var(--color-primary); animation: glitch-skew 2s infinite linear alternate; }
}

// **【关键修复】** 动画的初始状态和激活状态
.animate-on-scroll {
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

// --- Hero Section ---
.hero-section {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center; text-align: center;
  .hero-content { max-width: 900px; text-shadow: 0 2px 20px rgba(0, 0, 0, 0.7); }
  h1 { font-size: clamp(3rem, 7vw, 6rem); }
  .hero-subtitle {
    font-size: 1.5rem; line-height: 1.7; margin-top: 2rem; color: var(--color-text);
    .cursor {
      display: inline-block; width: 3px; height: 1.5rem; background-color: var(--color-primary); margin-left: 8px; vertical-align: bottom; box-shadow: 0 0 10px var(--color-primary);
      &.blinking { animation: cursor-blink 1s steps(1) infinite; }
    }
  }
}

// --- Story Section (Timeline) ---
.timeline {
  position: relative; max-width: 1000px; margin: 0 auto;
  &::after { content: ''; position: absolute; width: 4px; background-image: linear-gradient(var(--color-secondary), var(--color-primary)); top: 0; bottom: 0; left: 50%; margin-left: -2px; box-shadow: 0 0 15px rgba(var(--color-primary-rgb), 0.5); transform-origin: top; animation: grow-line 3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
}
.timeline-item {
  padding: 10px 40px; position: relative; width: 50%;
  &::after { content: ''; position: absolute; width: 20px; height: 20px; right: -14px; background-color: #0d1117; border: 4px solid var(--color-primary); top: 25px; border-radius: 50%; z-index: 1; transition: all 0.3s ease; }
  &.left { left: 0; }
  &.right { left: 50%; &::after { left: -10px; } }
}
.timeline-content {
  padding: 2rem; background: var(--color-background-soft); backdrop-filter: blur(10px); border: 1px solid var(--color-border); position: relative; border-radius: 12px; transition: all 0.4s ease;
  &:hover { transform: translateY(-10px); border-color: var(--color-primary); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
  h3 { color: var(--color-heading); font-family: var(--font-heading); }
  time { display: inline-block; margin-top: 1rem; padding: 0.3rem 0.8rem; font-weight: bold; background-image: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); color: #0d1117; border-radius: 4px; }
}

// --- Team Section (Interactive 3D Cards) ---
.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 3rem; perspective: 2000px; }
.team-card {
  --mouse-x: 50%; --mouse-y: 50%;
  position: relative; background: var(--color-background-soft); border-radius: 16px; overflow: hidden; border: 1px solid var(--color-border); transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.3s; transform-style: preserve-3d;
  &:hover {
    border-color: rgba(var(--color-primary-rgb), 0.5);
    transform: rotateY(calc((var(--mouse-x) - (clientWidth / 2)) / 30 * -1deg)) rotateX(calc((var(--mouse-y) - (clientHeight / 2)) / 30 * 1deg)) translateZ(20px);
    .card-shine { opacity: 1; }
  }
  .card-content { padding: 2.5rem; text-align: center; position: relative; z-index: 2; transform: translateZ(20px); }
  .card-shine { position: absolute; top: var(--mouse-y); left: var(--mouse-x); width: 400px; height: 400px; background: radial-gradient(circle at center, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 70%); transform: translate(-50%, -50%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .card-border { position: absolute; inset: 0; border-radius: 16px; border: 1px solid transparent; background: radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(var(--color-primary-rgb), 0.3), transparent 40%) border-box; mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
  .team-avatar { width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--color-primary); margin: 0 auto 1.5rem; box-shadow: 0 0 25px rgba(var(--color-primary-rgb), 0.6); }
  h3 { font-family: var(--font-heading); }
  .role { color: var(--color-primary); }
  .skills { margin-top: 1.5rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
  .skill-tag { background: rgba(var(--color-primary-rgb), 0.1); color: var(--color-primary); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid rgba(var(--color-primary-rgb), 0.2); }
}

// --- Tech Arsenal Section ---
.tech-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1.5rem; }
.tech-card {
  background: var(--color-background-soft); border: 1px solid var(--color-border); border-radius: 8px; padding: 2rem 1rem; text-align: center; transition: all 0.3s ease;
  &:hover { transform: translateY(-8px) scale(1.03); border-color: var(--color-primary); box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.3); }
  .tech-icon { font-size: 3rem; line-height: 1; }
  .tech-name { margin-top: 1rem; font-weight: bold; color: var(--color-heading); }
  .tech-category { font-size: 0.8rem; color: var(--color-text); opacity: 0.7; }
}

// --- Philosophy Section ---
.philosophy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; }
.philosophy-item {
  text-align: center; padding: 2.5rem 2rem; background: var(--color-background-soft); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; transition: all 0.3s ease;
  &:hover { transform: translateY(-10px); border-color: var(--color-primary); }
  .icon-wrapper {
    width: 80px; height: 80px; margin: 0 auto 2rem; border-radius: 50%; background: rgba(var(--color-primary-rgb), 0.1); display: flex; align-items: center; justify-content: center; color: var(--color-primary); transition: all 0.3s ease;
    .icon { font-size: 2.5rem; font-family: monospace; }
  }
  &:hover .icon-wrapper { transform: scale(1.1) rotate(-10deg); box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.4); }
  h3 { font-family: var(--font-heading); color: var(--color-heading); margin-bottom: 1rem; }
  p { color: var(--color-text); line-height: 1.7; }
}

// --- CTA Section ---
.cta-section {
  text-align: center; background: linear-gradient(rgba(13, 17, 23, 0.5), rgba(13, 17, 23, 0.9));
  .cta-content { z-index: 1; }
  h2 { font-size: clamp(2.5rem, 5vw, 3.5rem); margin-bottom: 1.5rem; }
  p { max-width: 600px; margin: 0 auto 3rem; }
  .cta-button {
    display: inline-block; padding: 1rem 3rem; border: 2px solid var(--color-primary); border-radius: 50px; color: var(--color-primary); background: transparent; font-size: 1.2rem; font-weight: bold; text-decoration: none; transition: all 0.3s ease; position: relative; overflow: hidden; z-index: 1;
    &::before { content: ''; position: absolute; left: 50%; transform: translateX(-50%); bottom: 0; width: 0%; height: 100%; background: var(--color-primary); transition: width 0.3s ease; z-index: -1; }
    &:hover { color: #0d1117; box-shadow: 0 0 30px rgba(var(--color-primary-rgb), 0.7); &::before { width: 101%; } }
  }
}

// --- Responsive ---
@media (max-width: 768px) {
  section { padding: 6rem 0; }
  .timeline::after { left: 31px; }
  .timeline-item { width: 100%; padding-left: 70px; padding-right: 15px; }
  .timeline-item.right, .timeline-item.left { left: 0; }
  .timeline-item::after, .timeline-item.right::after { left: 18px; }
}
</style>
