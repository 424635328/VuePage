<!-- src/views/NotFoundPage.vue -->

<template>
  <div class="not-found-container" ref="container">
    <!-- 1. 新增: 动态粒子背景 -->
    <canvas ref="canvasEl" class="particle-canvas"></canvas>

    <!-- 2. 3D视差效果容器 -->
    <div class="content-wrapper" :style="contentStyle">
      <h1 class="glitch" data-text="404">404</h1>

      <!-- 3. 打字机效果容器 -->
      <h2 class="subtitle">{{ typedSubtitle }}<span class="cursor">_</span></h2>
      <p class="description">{{ typedDescription }}<span class="cursor" v-if="isTypingDescription">_</span></p>

      <router-link :to="{ name: 'home' }" class="btn-home">
        RETURN TO HOMEBASE
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useMouseInElement } from '@vueuse/core';

// --- Refs for DOM elements ---
const container = ref(null);
const canvasEl = ref(null);

// --- 3D Parallax Effect ---
const { elementX, elementY, elementWidth, elementHeight } = useMouseInElement(container);

const contentStyle = computed(() => {
  const MAX_ROTATION = 8;
  const x = elementX.value;
  const y = elementY.value;
  const width = elementWidth.value;
  const height = elementHeight.value;

  const rotateX = ((y / height) * -MAX_ROTATION) + (MAX_ROTATION / 2);
  const rotateY = ((x / width) * MAX_ROTATION) - (MAX_ROTATION / 2);

  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
  };
});

// --- Typewriter Effect ---
const subtitleText = "SIGNAL LOST";
const descriptionText = "You've strayed into the digital void. The page you're looking for has been lost to the data stream or never existed in this sector.";
const typedSubtitle = ref('');
const typedDescription = ref('');
const isTypingDescription = ref(false);

const typeWriter = (text, targetRef, delay = 70, onComplete = () => {}) => {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      targetRef.value += text.charAt(i);
      i++;
    } else {
      clearInterval(interval);
      onComplete();
    }
  }, delay);
  return interval;
};

// --- Particle Canvas Effect ---
let animationFrameId;

onMounted(() => {
  // Start typewriter
  const subtitleInterval = typeWriter(subtitleText, typedSubtitle, 80, () => {
    isTypingDescription.value = true;
    typeWriter(descriptionText, typedDescription, 20);
  });

  // Setup canvas
  const canvas = canvasEl.value;
  const ctx = canvas.getContext('2d');
  let particles = [];

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y) {
      this.x = x || Math.random() * canvas.width;
      this.y = y || Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = (Math.random() * 2 - 1) * 0.5;
      this.speedY = (Math.random() * 2 - 1) * 0.5;
      this.color = 'rgba(0, 255, 249, 0.5)';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.size > 0.2) this.size -= 0.01;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const initParticles = () => {
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }
  };
  initParticles();

  const handleParticles = () => {
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      // Connect lines
      for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(0, 255, 249, ${1 - distance / 100})`;
              ctx.lineWidth = 0.2;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
          }
      }

      if (particles[i].size <= 0.2) {
        particles.splice(i, 1);
        particles.push(new Particle());
        i--;
      }
    }
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    animationFrameId = requestAnimationFrame(animate);
  };
  animate();

  onUnmounted(() => {
    clearInterval(subtitleInterval);
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeCanvas);
  });
});

</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Space+Mono:wght@400;700&display=swap');

// --- Keyframes for Animations (Updated) ---
@keyframes glitch-anim-1 { /* ... 保持不变 ... */ }
@keyframes glitch-anim-2 { /* ... 保持不变 ... */ }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

// --- Main Styles (Updated) ---

.not-found-container {
  display: grid;
  place-items: center;
  min-height: 100vh;
  width: 100%;
  // 1. 背景设为透明，以显示App.vue中的极光背景
  background-color: transparent;
  color: #e0e0e0;
  font-family: 'Space Mono', monospace;
  position: relative; // 仍然需要相对定位
  overflow: hidden;
  padding: 2rem;
  box-sizing: border-box;
}

// 2. 新增的粒子画布样式
.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; // 在内容之下
  pointer-events: none; // 不阻挡鼠标事件
}

.content-wrapper {
  text-align: center;
  z-index: 1;
  transition: transform 0.1s ease-out; // 为视差效果添加平滑过渡
}

.glitch {
  position: relative;
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(100px, 25vw, 250px);
  font-weight: 700;
  line-height: 1;
  margin: 0;
  color: #fff;
  letter-spacing: 5px;
  // 增强光晕效果
  text-shadow:
    0 0 5px rgba(0, 255, 249, 0.7),
    0 0 15px rgba(0, 255, 249, 0.5),
    0 0 30px rgba(0, 255, 249, 0.3),
    0 0 50px rgba(255, 0, 193, 0.3);

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // 3. glitch背景设为透明
    background: transparent;
  }

  &::before {
    left: 2px;
    text-shadow: -2px 0 #ff00c1;
    animation: glitch-anim-1 2s infinite linear alternate-reverse;
  }

  &::after {
    left: -2px;
    text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
    animation: glitch-anim-2 3s infinite linear alternate-reverse;
  }
}

.subtitle, .description {
  min-height: 1.2em; // 为打字机效果预留空间，防止跳动
}

.cursor {
  animation: cursor-blink 1s infinite;
  font-weight: 700;
  color: #00fff9;
}

.subtitle {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  color: #00bfff;
  text-transform: uppercase;
  margin: 1rem 0;
  text-shadow: 0 0 5px #00bfff, 0 0 10px #00bfff;
}

.description {
  max-width: 600px;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  line-height: 1.6;
  color: #a9a9a9;
  margin: 1.5rem auto 2.5rem;
}

.btn-home {
  display: inline-block;
  font-family: 'Space Mono', monospace;
  text-decoration: none;
  color: #00fff9;
  border: 2px solid #00fff9;
  padding: 12px 24px;
  font-weight: 700;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  z-index: 1;
  background-color: rgba(0, 255, 249, 0.1); // 添加微弱背景
  backdrop-filter: blur(3px); // 玻璃拟态效果

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 249, 0.7), transparent);
    transition: left 0.4s ease;
    z-index: -1;
  }

  &:hover {
    color: #0d0d0d; // 悬停时文字变暗
    background-color: #00fff9; // 悬停时背景变实
    box-shadow: 0 0 20px #00fff9, 0 0 40px #00fff9;
  }

  &:hover::before {
    left: 100%;
  }
}
</style>
