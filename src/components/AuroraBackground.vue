<!-- src/components/AuroraBackground.vue -->

<script setup>
import { useUiStore } from '@/stores/ui';
// [修改] 导入 onClickOutside
import { ref, onMounted, computed } from 'vue';
import { useMouse, useRafFn, onClickOutside } from '@vueuse/core';

// --- 核心依赖 ---
const uiStore = useUiStore();

// ============================================================================
// 1. Props 定义
// ============================================================================
const props = defineProps({
  enableLightning: { type: Boolean, default: true },
  enableRain: { type: Boolean, default: true },
  enableNeonSign: { type: Boolean, default: true },
  enableShards: { type: Boolean, default: false },
  rainCount: { type: Number, default: 100 },
  starCount: { type: Number, default: 150 },
  neonSignText: { type: String, default: 'MHStudio' },
});

// ============================================================================
// 2. 核心状态与鼠标跟踪
// ============================================================================
const isMounted = ref(false);
const container = ref(null);
const { x: mouseX, y: mouseY } = useMouse();
const parallaxX = ref(0);
const parallaxY = ref(0);

useRafFn(() => {
  if (!container.value) return;
  const { width, height } = container.value.getBoundingClientRect();
  const targetX = (mouseX.value - width / 2);
  const targetY = (mouseY.value - height / 2);
  parallaxX.value += (targetX - parallaxX.value) * 0.05;
  parallaxY.value += (targetY - parallaxY.value) * 0.05;
});

onMounted(() => {
  setTimeout(() => {
    isMounted.value = true;
  }, 100);
});

// ============================================================================
// 3. UI 配置状态
// ============================================================================
const showLightning = ref(props.enableLightning);
const showRain = ref(props.enableRain);
const showNeonSign = ref(props.enableNeonSign);
const showShards = ref(props.enableShards);
const currentRainCount = ref(props.rainCount);
const currentStarCount = ref(props.starCount);
const currentNeonText = ref(props.neonSignText);
const backgroundBrightness = ref(1);

const wrapperStyle = computed(() => ({
  filter: `brightness(${backgroundBrightness.value})`,
}));

// [新增] 创建一个模板引用来指向配置面板
const configPanelRef = ref(null);

// [新增] 调用 onClickOutside
onClickOutside(configPanelRef, (event) => {
  // 检查面板是否可见，如果可见则关闭它
  if (uiStore.isConfigPanelVisible) {
    // 增加一个额外的检查，确保点击的不是Header上的齿轮按钮
    // 这可以防止按钮同时触发打开和关闭事件
    const toggleButton = document.querySelector('.icon-button[aria-label="切换背景配置"]');
    if (toggleButton && toggleButton.contains(event.target)) {
      return;
    }
    uiStore.toggleConfigPanel();
  }
});


// ============================================================================
// 4. 静态特效配置
// ============================================================================
const SHARD_CONFIG = [
  { id: 1, class: 'shard-1', style: { top: '15%', left: '10%', rotate: '-8deg' }, animation: { animate: { y: ['-20px', '20px', '-20px'], x: ['-10px', '10px', '-10px'] }, transition: { duration: 40, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } }, parallaxStrength: 0.06 },
  { id: 2, class: 'shard-2', style: { top: '60%', left: '55%', rotate: '10deg' }, animation: { animate: { y: ['30px', '-30px', '30px'] }, transition: { duration: 50, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 2.5 } }, parallaxStrength: 0.04 },
  { id: 3, class: 'shard-3', style: { top: '70%', left: '20%', rotate: '-12deg' }, animation: { animate: { y: ['-25px', '25px', '-25px'] }, transition: { duration: 32, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 5 } }, parallaxStrength: 0.05 },
  { id: 4, class: 'shard-4', style: { top: '30%', left: '80%', rotate: '6deg' }, animation: { animate: { y: ['15px', '-15px', '15px'], x: ['-20px', '20px', '-20px'] }, transition: { duration: 55, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 1.5 } }, parallaxStrength: 0.07 },
];
const ORB_CONFIG = [
  { id: 1, top: '25%', left: '30%', size: 35, color: '#67e8f9', parallaxStrength: 0.03 },
  { id: 2, top: '85%', left: '15%', size: 45, color: '#a855f7', parallaxStrength: 0.025 },
  { id: 3, top: '55%', left: '80%', size: 30, color: '#7dd3fc', parallaxStrength: 0.02 },
  { id: 4, top: '90%', left: '65%', size: 40, color: '#34d399', parallaxStrength: 0.035 },
  { id: 5, top: '10%', left: '70%', size: 25, color: '#fde047', parallaxStrength: 0.015 },
];
const NUM_PUDDLES = 15;
const GLITCH_CHARS = '█_▓.¦/\\?*#@!$%&';

// ============================================================================
// 5. 计算属性
// ============================================================================
const stars = computed(() => Array.from({ length: currentStarCount.value }, (_, i) => ({
  id: `star-${i}`,
  style: { top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDuration: `${2.5 + Math.random() * 4}s`, animationDelay: `${Math.random() * 6}s` },
})));

const raindrops = computed(() => {
  if (!showRain.value) return [];
  return Array.from({ length: currentRainCount.value }).map((_, i) => {
    const p = Math.random();
    if (p > 0.8) return { id: `rain-${i}`, style: { width: '2px', height: '140px', opacity: 0.8, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${0.4 + Math.random() * 0.2}s` }};
    if (p > 0.4) return { id: `rain-${i}`, style: { width: '1.5px', height: '100px', opacity: 0.5, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 4}s`, animationDuration: `${0.8 + Math.random() * 0.4}s` }};
    return { id: `rain-${i}`, style: { width: '1px', height: '60px', opacity: 0.2, left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 7}s`, animationDuration: `${1.2 + Math.random() * 0.6}s` }};
  });
});

const puddles = computed(() => {
  if (!showRain.value) return [];
  return Array.from({ length: NUM_PUDDLES }, (_, i) => ({
    id: `puddle-${i}`,
    style: { bottom: `${Math.random() * 4}%`, left: `${10 + Math.random() * 80}%`, animationDuration: `${3.5 + Math.random() * 3}s`, animationDelay: `${Math.random() * 7}s` },
  }));
});

const glitchText = computed(() => Array.from({ length: 20 }, (_, i) => ({
  id: `glitch-${i}`,
  char: GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)],
  style: { animationDelay: `${Math.random() * 1.8}s` },
})));

// ============================================================================
// 6. 视差计算函数
// ============================================================================
const getParallaxStyle = (strength) => computed(() => ({
  transform: `translate(${parallaxX.value * strength}px, ${parallaxY.value * strength}px)`,
}));
</script>

<template>
  <div ref="container" class="aurora-background-container">

    <Teleport to="body">
      <Transition name="config-panel-fade">
        <!-- [修改] 将模板引用 ref="configPanelRef" 绑定到面板根元素 -->
        <div v-if="uiStore.isConfigPanelVisible" ref="configPanelRef" class="config-panel">
          <h3>背景特效配置</h3>

          <div class="control-group toggles">
            <label><input type="checkbox" v-model="showLightning" /> 启用闪电</label>
            <label><input type="checkbox" v-model="showRain" /> 启用下雨</label>
            <label><input type="checkbox" v-model="showNeonSign" /> 启用霓虹灯</label>
            <label><input type="checkbox" v-model="showShards" /> 启用玻璃碎片</label>
          </div>

          <div class="control-group sliders">
            <label for="brightness">背景亮度: {{ Number(backgroundBrightness).toFixed(2) }}</label>
            <input type="range" id="brightness" min="0.5" max="1.5" step="0.05" v-model="backgroundBrightness" />

            <label for="rain">雨滴数量: {{ currentRainCount }}</label>
            <input type="range" id="rain" min="0" max="400" v-model="currentRainCount" />

            <label for="stars">星星数量: {{ currentStarCount }}</label>
            <input type="range" id="stars" min="0" max="520" v-model="currentStarCount" />
          </div>

          <div class="control-group">
            <label for="neon-text">霓虹灯文本</label>
            <input type="text" id="neon-text" v-model="currentNeonText" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="isMounted" class="aurora-wrapper" :style="wrapperStyle">
      <!-- --- 基础图层 --- -->
      <div class="black-hole-gradient"></div>
      <div class="star-dust"></div>
      <div v-if="showLightning" class="lightning-flash-overlay"></div>
      <div class="scanline-container"><div class="screen-scanline"></div></div>

      <!-- --- 极光动态光球 --- -->
      <div class="aurora-blob-1" v-motion="{ initial: { opacity: 0.15, scale: 0.9, x: '-30%', y: '-40%' }, enter: { x: ['-35%', '25%', '-35%'], y: ['-45%', '15%', '-45%'], rotate: [0, 15, 0], scale: [0.9, 1.05, 0.9], transition: { duration: 45, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}}"></div>
      <div class="aurora-blob-2" v-motion="{ initial: { opacity: 0.1, x: '30%', y: '30%' }, enter: { x: ['35%', '-15%', '35%'], y: ['35%', '-35%', '35%'], rotate: [10, -5, 10], scale: [1.05, 0.85, 1.05], transition: { duration: 55, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror', delay: 4 }}}"></div>
      <div class="aurora-blob-3" v-motion="{ initial: { opacity: 0.08, x: '15%', y: '15%' }, enter: { x: ['15%', '-10%', '15%'], y: ['15%', '30%', '15%'], scale: [1, 1.1, 1], transition: { duration: 60, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror', delay: 8 }}}"></div>

      <!-- --- 动态特效图层 --- -->
      <div class="stars-layer"><div v-for="star in stars" :key="star.id" class="twinkling-star" :style="star.style"></div></div>
      <div class="cyberpunk-effects-layer">
        <h1 v-if="showNeonSign" class="neon-sign">{{ currentNeonText }}</h1>
        <template v-if="showRain">
          <div v-for="drop in raindrops" :key="drop.id" class="raindrop" :style="drop.style"></div>
          <div v-for="puddle in puddles" :key="puddle.id" class="puddle-ripple" :style="puddle.style"></div>
        </template>
        <div class="glitchy-corner-text"><span v-for="item in glitchText" :key="item.id" :style="item.style">{{ item.char }}</span></div>
        <div class="steam steam-1"></div>
        <div class="steam steam-2"></div>
        <div class="steam steam-3"></div>
      </div>

      <!-- --- 视差图层 --- -->
      <div v-if="showShards" class="parallax-layers">
        <div v-for="orb in ORB_CONFIG" :key="orb.id" class="light-orb" :style="[{ top: orb.top, left: orb.left, width: `${orb.size}vmin`, height: `${orb.size}vmin` }, getParallaxStyle(orb.parallaxStrength).value]"><div class="orb-glow" :style="{ backgroundImage: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)` }"></div></div>
        <div v-for="shard in SHARD_CONFIG" :key="shard.id" class="shard-container" :class="shard.class" :style="[{ top: shard.style.top, left: shard.style.left }, getParallaxStyle(shard.parallaxStrength).value]"><div class="glass-shard" v-motion="{ enter: { ...shard.animation.animate, transition: shard.animation.transition } }" :style="{ rotate: shard.style.rotate }"></div></div>
      </div>

      <!-- --- 内容插槽 --- -->
      <div class="content-slot"><slot /></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ============================================================================
 * Keyframes (动画关键帧)
 * ============================================================================ */
@keyframes fall { from { transform: translateY(-20vh); } to { transform: translateY(120vh) scaleX(0.5); opacity: 0; } }
@keyframes riseAndFade { from { transform: translateY(0); opacity: 0.3; } to { transform: translateY(-100px) scale(1.6); opacity: 0; } }
@keyframes ripple { from { width: 0; height: 0; opacity: 0.7; } to { width: 100px; height: 50px; opacity: 0; } }
@keyframes scanline { to { transform: translateY(110vh); } }
@keyframes twinkle { 0%, 100% { opacity: 0; } 50% { opacity: 0.7; } }
@keyframes orb-pulse { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes glitchFlicker { 0%, 97% { opacity: 1; } 98% { opacity: 0.5; } 100% { opacity: 1; } }
@keyframes lightningFlash { 0%, 93% { opacity: 0; } 94% { opacity: 0.2; } 95% { opacity: 0.05; } 96%, 100% { opacity: 0; } }
@keyframes flicker { 0%, 88% { opacity: 1; text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 18px #ff00de, 0 0 32px #ff00de; } 90% { opacity: 0.7; text-shadow: none; } 92% { opacity: 1; text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 18px #ff00de, 0 0 32px #ff00de; } 93% { opacity: 0.8; text-shadow: none; } 94%, 100% { opacity: 1; text-shadow: 0 0 4px #fff, 0 0 10px #fff, 0 0 18px #ff00de, 0 0 32px #ff00de; } }

/* ============================================================================
 * 基础样式
 * ============================================================================ */
.aurora-background-container {
  position: fixed; inset: 0; z-index: -1;
  background-color: #06040f;
}
.aurora-wrapper {
  position: relative; height: 100%; width: 100%;
  overflow: hidden;
  background-image: linear-gradient(to bottom, #06040f, #0a0a14, black);
  isolation: isolate;
  transition: filter 0.3s ease-in-out;
}

/* ============================================================================
 * 配置面板样式
 * ============================================================================ */
.config-panel {
  --panel-accent: #67e8f9;
  --panel-bg: rgba(22, 28, 49, 0.7);
  --panel-border: rgba(103, 232, 249, 0.4);

  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 2000; /* 确保在最上层 */
  width: 320px;
  padding: 24px;
  background-color: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  box-shadow: 0 0 15px rgba(103, 232, 249, 0.2), 0 0 40px rgba(0,0,0,0.5);
  color: #e0e7ff;
  font-family: 'Orbitron', sans-serif;

  h3 {
    margin-top: 0;
    margin-bottom: 28px;
    color: #fff;
    font-weight: 500;
    text-align: center;
    text-shadow: 0 0 5px var(--panel-accent);
    border-bottom: 1px solid rgba(103, 232, 249, 0.2);
    padding-bottom: 16px;
  }

  .control-group {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    &.toggles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    user-select: none;
    color: #c7d2fe;
  }

  input[type="checkbox"] {
    appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid var(--panel-border);
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    box-shadow: 0 0 5px transparent;

    &:hover {
      border-color: var(--panel-accent);
    }

    &:checked {
      background-color: var(--panel-accent);
      border-color: var(--panel-accent);
      box-shadow: 0 0 8px var(--panel-accent);
      &::after {
        content: '✔';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #06040f;
        font-size: 14px;
        font-weight: bold;
      }
    }
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      border: 2px solid var(--panel-accent);
      box-shadow: 0 0 8px var(--panel-accent), 0 0 12px var(--panel-accent);
      transition: box-shadow 0.2s ease;
      margin-top: -6px;
    }
    &:active::-webkit-slider-thumb {
      box-shadow: 0 0 12px var(--panel-accent), 0 0 20px var(--panel-accent);
    }
    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      border: 2px solid var(--panel-accent);
      box-shadow: 0 0 8px var(--panel-accent), 0 0 12px var(--panel-accent);
      transition: box-shadow 0.2s ease;
    }
  }

  input[type="text"] {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--panel-border);
    color: #e0e7ff;
    padding: 10px 14px;
    border-radius: 6px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s ease;
    &:focus {
      border-color: var(--panel-accent);
      box-shadow: 0 0 10px rgba(103, 232, 249, 0.5);
    }
  }
}

// 面板进入/离开动画
.config-panel-fade-enter-active,
.config-panel-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.config-panel-fade-enter-from,
.config-panel-fade-leave-to {
  transform: translateX(20px) scale(0.98);
  opacity: 0;
}


/* ============================================================================
 * 特效图层样式
 * ============================================================================ */
.black-hole-gradient, .star-dust, .lightning-flash-overlay, .scanline-container, .stars-layer, .cyberpunk-effects-layer, .parallax-layers {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  will-change: transform, opacity;
}
.content-slot {
  position: relative; z-index: 10; height: 100%; width: 100%;
  overflow-y: auto;
}
.lightning-flash-overlay {
  background: radial-gradient(circle at 50% 50%, rgba(137, 207, 235, 0.6), transparent 80%);
  animation: lightningFlash 7s linear infinite;
  z-index: 0;
}
.aurora-blob-1, .aurora-blob-2, .aurora-blob-3 {
  position: absolute; border-radius: 9999px;
  filter: blur(80px); will-change: transform, opacity;
}
.aurora-blob-1 { height: 110vmin; width: 110vmin; background-image: linear-gradient(to top right, rgba(5, 150, 105, 0.7), rgba(168, 85, 247, 0.6), rgba(6, 182, 212, 0.7)); }
.aurora-blob-2 { height: 90vmin; width: 90vmin; background-image: linear-gradient(to bottom left, rgba(59, 130, 246, 0.6), rgba(124, 58, 237, 0.6)); }
.aurora-blob-3 { height: 70vmin; width: 70vmin; background-color: rgba(56, 189, 248, 0.4); }
.shard-container { position: absolute; z-index: 20; will-change: transform; }
.shard-1 { height: 35vh; width: 25vw; min-height: 200px; min-width: 300px; }
.shard-2 { height: 30vh; width: 40vw; min-height: 250px; min-width: 400px; }
.shard-3 { height: 20vh; width: 20vw; min-height: 150px; min-width: 200px; }
.shard-4 { height: 22vh; width: 24vw; min-height: 180px; min-width: 220px; }
.glass-shard {
  position: absolute; inset: 0;
  backdrop-filter: blur(20px) brightness(1.2);
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 1rem;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  will-change: transform;
  &::after { content: ''; position: absolute; inset: 0; border-radius: 1rem; background-image: linear-gradient(to bottom right, rgba(255, 255, 255, 0.08), transparent 50%); }
}
.light-orb { position: absolute; z-index: 10; will-change: transform; }
.orb-glow { position: absolute; inset: -50%; border-radius: 9999px; animation: orb-pulse 8s ease-in-out infinite alternate; }
.twinkling-star { position: absolute; height: 2px; width: 2px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.7); animation: twinkle linear infinite; }
.neon-sign {
  position: absolute; top: 5vh; right: 5vw; z-index: 5;
  font-family: 'Orbitron', sans-serif; font-size: 3rem; font-weight: 700;
  color: #fff; user-select: none;
  animation: flicker 5s linear infinite;
  @media (max-width: 768px) { font-size: 2rem; }
}
.raindrop { position: absolute; bottom: 100%; background: linear-gradient(to top, rgba(173, 216, 230, 0), rgba(100, 210, 250, 0.6)); animation: fall linear infinite; will-change: transform, opacity; }
.puddle-ripple { position: absolute; border: 1px solid rgba(135, 206, 250, 0.4); border-radius: 50%; transform: translate(-50%, -50%); animation: ripple ease-out infinite; }
.glitchy-corner-text { position: absolute; bottom: 20px; left: 20px; z-index: 5; font-family: 'Courier New', Courier, monospace; color: rgba(135, 206, 250, 0.6); font-size: 0.75rem; user-select: none; span { display: inline-block; animation: glitchFlicker 2s infinite; } }
.steam { position: absolute; bottom: -60px; width: 250px; height: 150px; background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 65%); border-radius: 50%; animation: riseAndFade infinite; transform-origin: bottom center; }
.steam-1 { left: 15%; animation-delay: 0s; animation-duration: 9s; }
.steam-2 { left: 70%; animation-delay: 3s; animation-duration: 11s; }
.steam-3 { left: 40%; animation-delay: 5s; animation-duration: 8s; }
.screen-scanline { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(to right, transparent, rgba(135, 206, 250, 0.3), transparent); animation: scanline 9s cubic-bezier(0.7, 0, 0.3, 1) infinite; z-index: 2; box-shadow: 0 0 8px rgba(135, 206, 250, 0.5); }
</style>
