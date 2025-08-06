<!-- src/components/Aurora.vue -->

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMouse, useRafFn } from '@vueuse/core';

// ============================================================================
// 1. Props 定义 (增强灵活性)
// ============================================================================
const props = defineProps({
  // --- 特效开关 ---
  enableRain: { type: Boolean, default: true },
  enableNeonSign: { type: Boolean, default: true },
  enableShards: { type: Boolean, default: true },

  // --- 数量控制 (性能相关) ---
  rainCount: { type: Number, default: 100 }, // 默认值降低，对性能更友好
  starCount: { type: Number, default: 150 },

  // --- 内容定制 ---
  neonSignText: { type: String, default: 'AURORA' },
});

// ============================================================================
// 2. 核心状态与鼠标跟踪
// ============================================================================
const isMounted = ref(false);
const container = ref(null); // 引用容器元素以获取尺寸

// 使用 @vueuse/core 的 useMouse 来优雅地获取鼠标位置
const { x: mouseX, y: mouseY } = useMouse();

// 优化：使用 useRafFn 代替 watch 来实现更平滑的动画插值
// 这可以减少性能开销，并确保动画在每个渲染帧上更新
const parallaxX = ref(0);
const parallaxY = ref(0);

useRafFn(() => {
  if (!container.value) return;
  const { width, height } = container.value.getBoundingClientRect();
  const targetX = (mouseX.value - width / 2);
  const targetY = (mouseY.value - height / 2);
  // 使用线性插值 (lerp) 使视差移动更平滑
  parallaxX.value += (targetX - parallaxX.value) * 0.05;
  parallaxY.value += (targetY - parallaxY.value) * 0.05;
});

onMounted(() => {
  // 延迟挂载，确保 DOM 准备就绪，同时给页面加载留出时间
  setTimeout(() => {
    isMounted.value = true;
  }, 100);
});

// ============================================================================
// 3. 静态特效配置 (更清晰的结构)
// ============================================================================
const SHARD_CONFIG = [
  // 调整了视差强度和动画，使其更微妙
  { id: 1, class: 'shard-1', style: { top: '15%', left: '10%', rotate: '-8deg' }, animation: { animate: { y: ['-20px', '20px', '-20px'], x: ['-10px', '10px', '-10px'] }, transition: { duration: 40, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } }, parallaxStrength: 0.06 },
  { id: 2, class: 'shard-2', style: { top: '60%', left: '55%', rotate: '10deg' }, animation: { animate: { y: ['30px', '-30px', '30px'] }, transition: { duration: 50, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 2.5 } }, parallaxStrength: 0.04 },
  { id: 3, class: 'shard-3', style: { top: '70%', left: '20%', rotate: '-12deg' }, animation: { animate: { y: ['-25px', '25px', '-25px'] }, transition: { duration: 32, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 5 } }, parallaxStrength: 0.05 },
  { id: 4, class: 'shard-4', style: { top: '30%', left: '80%', rotate: '6deg' }, animation: { animate: { y: ['15px', '-15px', '15px'], x: ['-20px', '20px', '-20px'] }, transition: { duration: 55, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 1.5 } }, parallaxStrength: 0.07 },
];
// --- 护眼调整: 降低光球颜色亮度和饱和度 ---
const ORB_CONFIG = [
  { id: 1, top: '25%', left: '30%', size: 35, color: '#38bdf8', parallaxStrength: 0.03 }, // 亮蓝 -> 柔和天蓝
  { id: 2, top: '85%', left: '15%', size: 45, color: '#8b5cf6', parallaxStrength: 0.025 }, // 亮紫 -> 柔和紫
  { id: 3, top: '55%', left: '80%', size: 30, color: '#34d399', parallaxStrength: 0.02 }, // 亮青 -> 柔和绿
  { id: 4, top: '90%', left: '65%', size: 40, color: '#4f46e5', parallaxStrength: 0.035 }, // 新增深靛蓝
  { id: 5, top: '10%', left: '70%', size: 25, color: '#fbbf24', parallaxStrength: 0.015 }, // 亮黄 -> 琥珀黄
];
const NUM_PUDDLES = 15;
const GLITCH_CHARS = '█_▓.¦/\\?*#@!$%&';

// ============================================================================
// 4. 计算属性 (用于动态生成元素)
// ============================================================================
const stars = computed(() => Array.from({ length: props.starCount }, (_, i) => ({
  id: `star-${i}`,
  style: {
    top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
    animationDuration: `${2.5 + Math.random() * 4}s`, animationDelay: `${Math.random() * 6}s`,
  },
})));

const raindrops = computed(() => {
  if (!props.enableRain) return [];
  return Array.from({ length: props.rainCount }).map((_, i) => {
    const perspective = Math.random();
    let style;
    // 调整了雨滴样式，使其更有层次感
    if (perspective > 0.8) style = { width: '2px', height: '140px', opacity: 0.8, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${0.4 + Math.random() * 0.2}s` };
    else if (perspective > 0.4) style = { width: '1.5px', height: '100px', opacity: 0.5, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 4}s`, animationDuration: `${0.8 + Math.random() * 0.4}s` };
    else style = { width: '1px', height: '60px', opacity: 0.2, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 7}s`, animationDuration: `${1.2 + Math.random() * 0.6}s` };
    return { id: `rain-${i}`, style };
  });
});

const puddles = computed(() => {
  if (!props.enableRain) return [];
  return Array.from({ length: NUM_PUDDLES }, (_, i) => ({
    id: `puddle-${i}`,
    style: {
      bottom: `${Math.random() * 4}%`, left: `${10 + Math.random() * 80}%`,
      animationDuration: `${3.5 + Math.random() * 3}s`, animationDelay: `${Math.random() * 7}s`,
    },
  }));
});

const glitchText = computed(() => Array.from({ length: 20 }, (_, i) => ({
  id: `glitch-${i}`,
  char: GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)],
  style: { animationDelay: `${Math.random() * 1.8}s` },
})));

// ============================================================================
// 5. 视差计算函数
// ============================================================================
const getParallaxStyle = (strength) => computed(() => ({
  // 使用插值后的 parallaxX/Y，动画更平滑
  transform: `translate(${parallaxX.value * strength}px, ${parallaxY.value * strength}px)`,
}));

</script>

<template>
  <div ref="container" class="aurora-background-container">
    <div v-if="isMounted" class="aurora-wrapper">

      <!-- --- 基础图层 (纯 CSS) --- -->
      <div class="black-hole-gradient"></div>
      <div class="star-dust"></div>
      <div class="lightning-flash-overlay"></div>
      <div class="scanline-container"><div class="screen-scanline"></div></div>

      <!-- --- 极光动态光球 (v-motion) --- -->
      <div
        class="aurora-blob-1"
        v-motion="{
          initial: { opacity: 0.1, scale: 0.9, x: '-30%', y: '-40%' },
          enter: { x: ['-35%', '25%', '-35%'], y: ['-45%', '15%', '-45%'], rotate: [0, 15, 0], opacity: [0.1, 0.2, 0.1], scale: [0.9, 1.05, 0.9], transition: { duration: 45, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' } }
        }"
      ></div>
       <div
        class="aurora-blob-2"
        v-motion="{
          initial: { opacity: 0.05, x: '30%', y: '30%' },
          enter: { x: ['35%', '-15%', '35%'], y: ['35%', '-35%', '35%'], rotate: [10, -5, 10], opacity: [0.15, 0.05, 0.15], scale: [1.05, 0.85, 1.05], transition: { duration: 55, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror', delay: 4 } }
        }"
      ></div>
      <div
        class="aurora-blob-3"
        v-motion="{
          initial: { opacity: 0 },
          enter: { x: '15%', y: '15%', opacity: [0, 0.08, 0.1, 0], scale: [1, 1.15, 1], transition: { duration: 30, repeat: Infinity, repeatType: 'reverse', delay: 10 } }
        }"
      ></div>

      <!-- --- 优化后的图层 --- -->
      <!-- 星空 -->
      <div class="stars-layer">
        <div v-for="star in stars" :key="star.id" class="twinkling-star" :style="star.style"></div>
      </div>

      <!-- 赛博朋克特效 -->
      <div class="cyberpunk-effects-layer">
        <h1 v-if="enableNeonSign" class="neon-sign">{{ neonSignText }}</h1>
        <template v-if="enableRain">
          <div v-for="drop in raindrops" :key="drop.id" class="raindrop" :style="drop.style"></div>
          <div v-for="puddle in puddles" :key="puddle.id" class="puddle-ripple" :style="puddle.style"></div>
        </template>
        <div class="glitchy-corner-text">
          <span v-for="item in glitchText" :key="item.id" :style="item.style">{{ item.char }}</span>
        </div>
        <div class="steam steam-1"></div>
        <div class="steam steam-2"></div>
        <div class="steam steam-3"></div>
      </div>

      <!-- 视差图层 -->
      <div v-if="enableShards" class="parallax-layers">
         <!-- 光球 -->
        <div
          v-for="orb in ORB_CONFIG"
          :key="orb.id"
          class="light-orb"
          :style="[
            { top: orb.top, left: orb.left, width: `${orb.size}vmin`, height: `${orb.size}vmin` },
            getParallaxStyle(orb.parallaxStrength).value
          ]"
        >
          <div class="orb-glow" :style="{ backgroundImage: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)` }"></div>
        </div>
        <!-- 玻璃碎片 -->
        <div
          v-for="shard in SHARD_CONFIG"
          :key="shard.id"
          class="shard-container"
          :class="shard.class"
          :style="[
            { top: shard.style.top, left: shard.style.left },
            getParallaxStyle(shard.parallaxStrength).value
          ]"
        >
          <div
            class="glass-shard"
            v-motion="{
              enter: { ...shard.animation.animate, transition: shard.animation.transition }
            }"
            :style="{ rotate: shard.style.rotate }"
          ></div>
        </div>
      </div>

      <!-- --- 默认插槽，用于显示页面内容 --- -->
      <div class="content-slot">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ============================================================================
 * Keyframes (动画关键帧)
 * ============================================================================ */
@keyframes fall { from { transform: translateY(-20vh) scaleX(1); } to { transform: translateY(120vh) scaleX(0.5); opacity: 0; } }
// --- 护眼调整: 降低霓虹灯闪烁时的阴影亮度和范围 ---
@keyframes flicker {
  0%,18%,22%,25%,53%,57%,100% {
    opacity: 0.9;
    text-shadow: 0 0 3px #c026d3, 0 0 6px #c026d3, 0 0 12px #9333ea;
  }
  20%,24%,55% {
    opacity: 0.7;
    text-shadow: none;
  }
}
@keyframes riseAndFade { from { transform: translateY(0) scale(1); opacity: 0.3; } to { transform: translateY(-100px) scale(1.6); opacity: 0; } }
@keyframes lightningFlash { 0%,98%{opacity:0} 98.1%,98.3%,98.6%{opacity:.15} 98.2%,98.5%{opacity:0} 100%{opacity:0} } // 大幅降低闪电亮度
@keyframes ripple { from { width: 0; height: 0; opacity: 0.5; } to { width: 100px; height: 50px; opacity: 0; } }
@keyframes scanline { 0% { transform: translateY(-10%); } 100% { transform: translateY(110vh); } }
@keyframes glitchFlicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes twinkle { 0%, 100% { opacity: 0; } 50% { opacity: 0.6; } } // 降低星星最亮时的透明度
@keyframes orb-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; } // 降低基础不透明度
  50% { transform: scale(1.08); opacity: 0.8; } // 降低脉冲时的不透明度
}

/* ============================================================================
 * 主容器和基础图层样式
 * ============================================================================ */
.aurora-background-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  background-color: #02000a; // 使用更深的蓝黑色作为底色
}

.aurora-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-image: linear-gradient(to bottom, #02000a, #080812, black); // 调整背景渐变
  isolation: isolate;
}

.black-hole-gradient, .star-dust, .lightning-flash-overlay, .scanline-container, .stars-layer, .cyberpunk-effects-layer, .parallax-layers {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  will-change: transform, opacity;
}

.content-slot {
  position: relative;
  z-index: 10;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

/* ============================================================================
 * 特效图层样式
 * ============================================================================ */
.aurora-blob-1, .aurora-blob-2, .aurora-blob-3 {
  position: absolute;
  border-radius: 9999px;
  filter: blur(100px); // --- 护眼调整: 增加模糊半径，使光团更柔和 ---
  will-change: transform, opacity;
}
// --- 护眼调整: 降低极光颜色的亮度和透明度 ---
.aurora-blob-1 {
  height: 110vmin; width: 110vmin;
  background-image: linear-gradient(to top right, rgba(5, 150, 105, 0.4), rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.4));
}
.aurora-blob-2 {
  height: 90vmin; width: 90vmin;
  background-image: linear-gradient(to bottom left, rgba(59, 130, 246, 0.35), rgba(91, 33, 182, 0.4));
}
.aurora-blob-3 {
  height: 70vmin; width: 70vmin;
  background-color: rgba(56, 189, 248, 0.25);
}

// 玻璃碎片 (Glass Shards)
.shard-container {
  position: absolute;
  will-change: transform;
  z-index: 20;
}
.shard-1 { height: 35vh; width: 25vw; min-height: 200px; min-width: 300px; }
.shard-2 { height: 30vh; width: 40vw; min-height: 250px; min-width: 400px; }
.shard-3 { height: 20vh; width: 20vw; min-height: 150px; min-width: 200px; }
.shard-4 { height: 22vh; width: 24vw; min-height: 180px; min-width: 220px; }

.glass-shard {
  position: absolute;
  inset: 0;
  // --- 护眼调整: 降低碎片亮度和背景透明度 ---
  backdrop-filter: blur(20px) brightness(1.1);
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 1rem;
  box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  will-change: transform;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1rem;
    // --- 护眼调整: 降低高光部分的透明度 ---
    background-image: linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), transparent 50%);
  }
}

// 光球 (Light Orbs)
.light-orb {
  position: absolute;
  z-index: 10;
  will-change: transform;
}
.orb-glow {
  position: absolute;
  inset: -50%;
  border-radius: 9999px;
  animation: orb-pulse 8s ease-in-out infinite alternate;
  // --- 护眼调整: 对光球本身增加一层模糊，使其更柔和 ---
  filter: blur(10px);
}

// 星星 (Stars)
.twinkling-star {
  position: absolute;
  height: 1.5px; // 使星星更小更精细
  width: 1.5px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6); // 降低基础亮度
  animation-name: twinkle;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

// 赛博朋克特效 (Cyberpunk Effects)
.neon-sign {
  position: absolute;
  top: 5vh;
  right: 5vw;
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  color: #e9d5ff; // --- 护眼调整: 颜色从纯白变为淡紫色 ---
  animation: flicker 4s linear infinite;
  user-select: none;
  z-index: 5;
  @media (max-width: 768px) { font-size: 2rem; }
}

.raindrop {
  position: absolute;
  bottom: 100%;
  // --- 护眼调整: 降低雨滴的亮度 ---
  background: linear-gradient(to top, rgba(173, 216, 230, 0), rgba(100, 180, 220, 0.4));
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

.puddle-ripple {
  position: absolute;
  // --- 护眼调整: 降低水波纹的亮度 ---
  border: 1px solid rgba(135, 206, 250, 0.25);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation-name: ripple;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
}

.glitchy-corner-text {
  position: absolute;
  bottom: 20px;
  left: 20px;
  font-family: 'Courier New', Courier, monospace;
  // --- 护眼调整: 降低文字亮度 ---
  color: rgba(135, 206, 250, 0.4);
  font-size: 0.75rem;
  z-index: 5;
  user-select: none;
  span {
    display: inline-block;
    animation: glitchFlicker 2s infinite;
  }
}

.steam {
  position: absolute;
  bottom: -60px;
  width: 250px;
  height: 150px;
  // --- 护眼调整: 降低蒸汽的可见度 ---
  background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 65%);
  border-radius: 50%;
  animation-name: riseAndFade;
  animation-iteration-count: infinite;
  transform-origin: bottom center;
}
.steam-1 { left: 15%; animation-delay: 0s; animation-duration: 9s; }
.steam-2 { left: 70%; animation-delay: 3s; animation-duration: 11s; }
.steam-3 { left: 40%; animation-delay: 5s; animation-duration: 8s; }

.screen-scanline {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  // --- 护眼调整: 大幅降低扫描线的亮度和阴影 ---
  background: linear-gradient(to right, transparent, rgba(135, 206, 250, 0.1), transparent);
  animation: scanline 9s cubic-bezier(0.7, 0.3, 0.3, 0.7) infinite; // 调整动画缓动函数
  z-index: 2;
  box-shadow: 0 0 5px rgba(135, 206, 250, 0.2);
}
</style>
