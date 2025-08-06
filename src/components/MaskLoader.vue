<!-- src/components/MaskLoader.vue -->

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useMouse, useRafFn } from '@vueuse/core';

const props = defineProps({
  active: { type: Boolean, default: true },
  enterText: { type: String, default: '进入探索' },
  backgroundOpacity: { type: Number, default: 1, validator: (v) => v >= 0 && v <= 1 },
});
const emit = defineEmits(['update:active']);

const loaderContainerRef = ref(null);

const isDismissed = ref(false);
const timers = [];
// 简化的状态机：booting（自动播放） -> dismissed（点击后）
const bootStage = ref('booting');
const bootLog = ref([]);
const progress = ref(0);
const finalMessage = ref('');
// 移除 showEngage, curtainText 等多步交互状态

const { x, y } = useMouse({ type: 'client', when: () => props.active && !isDismissed.value });
const mouseX = ref(0);
const mouseY = ref(0);
const clickX = ref(0);
const clickY = ref(0);

const loaderStyle = computed(() => ({
  '--mouse-x': `${mouseX.value}px`,
  '--mouse-y': `${mouseY.value}px`,
  '--click-x': `${clickX.value}px`,
  '--click-y': `${clickY.value}px`,
  '--mask-bg-opacity': props.backgroundOpacity,
}));

const containerClasses = computed(() => ({
  'is-dismissed': isDismissed.value,
  [`stage-${bootStage.value}`]: true,
}));

// 动态计算aria-hidden，解决无障碍冲突
const isAriaHidden = computed(() => {
  // 在启动和消失的纯动画阶段，对辅助技术隐藏
  return bootStage.value === 'booting' || bootStage.value === 'dismissed';
});

useRafFn(() => {
  if (!isDismissed.value) {
    mouseX.value += (x.value - mouseX.value) * 0.1;
    mouseY.value += (y.value - mouseY.value) * 0.1;
  }
});

const sleep = (ms) => new Promise(resolve => timers.push(setTimeout(resolve, ms)));
const clearAllTimers = () => {
  timers.forEach(id => clearTimeout(id));
  timers.length = 0;
};

const typeOut = async (ref, text, speed = 50) => {
  ref.value = '';
  for (let i = 0; i < text.length; i++) {
    ref.value += text[i];
    await sleep(speed);
  }
};

// 合并后的自动启动序列
const startAutoBootSequence = async () => {
  clearAllTimers();
  // 重置状态
  bootStage.value = 'initial'; // 临时状态防闪烁
  isDismissed.value = false;
  bootLog.value = [];
  progress.value = 0;
  finalMessage.value = '';

  await nextTick();

  // 直接进入启动阶段
  bootStage.value = 'booting';

  const systemMessages = [
    { text: 'INITIATING_CORE::v3.1_ENTERPRISE', delay: 200 },
    { text: 'AUTH_VISUAL_MODULES...', delay: 150 },
    { text: 'VERIFYING_RLS_POLICIES...[OK]', delay: 300 },
    { text: 'LOADING_ASSET_MANIFEST...[DONE]', delay: 250 },
    { text: 'DECRYPTING_UI_COMPONENTS...', delay: 400 },
    { text: 'ESTABLISHING_SUPABASE_CONNECTION...', delay: 100 },
    { text: 'CONNECTION_SECURED::JWT_RECEIVED', delay: 500 },
    { text: 'SYNCING_ATOMIC_CLOCK...[DONE]', delay: 200 },
    { text: 'FINALIZING_RENDER_PIPELINE...', delay: 300 },
  ];

  for (const msg of systemMessages) {
    const logItem = { id: Date.now() + Math.random(), text: `[SYS] ${msg.text}`, state: 'ok' };
    bootLog.value.push(logItem);
    progress.value = (bootLog.value.length / systemMessages.length) * 100;
    await sleep(msg.delay);
  }

  await sleep(500);

  // 启动完成后，显示最终提示信息
  await typeOut(finalMessage, 'SYSTEM READY. CLICK TO ENGAGE.', 40);
};

// 唯一的交互：点击屏幕任意位置
const dismiss = (event) => {
  if (isDismissed.value) return; // 防止重复点击

  // 主动释放焦点，双重保险
  loaderContainerRef.value?.blur();

  clickX.value = event.clientX;
  clickY.value = event.clientY;
  isDismissed.value = true;
  bootStage.value = 'dismissed';
};

watch(isDismissed, (newValue) => {
  if (newValue) {
    clearAllTimers();
    // 等待消失动画播放完毕
    setTimeout(() => emit('update:active', false), 1200);
  }
});

// 监听active属性，当组件激活时，自动开始启动序列
watch(() => props.active, (isActive) => {
  if (isActive) {
    startAutoBootSequence();
  } else {
    clearAllTimers();
  }
}, { immediate: true });

onUnmounted(clearAllTimers);
</script>

<template>
  <Transition name="mask-fade">
    <div
      v-if="active"
      ref="loaderContainerRef"
      class="mask-loader-container"
      :class="containerClasses"
      :style="loaderStyle"
      :aria-hidden="isAriaHidden"
      @click="dismiss"
    >
      <!-- 移除幕布层 -->
      <div class="grid-overlay"></div>
      <div class="scanline-overlay"></div>
      <div class="spotlight"></div>
      <!-- 这个遮罩层现在负责圆形打开动画和最终的关闭动画 -->
      <div class="mask-overlay"></div>
      <div class="hud-layout">
        <div class="hud-element top-left"><p class="glitch" data-text="[VUE_SHOP_OS]">[VUE_SHOP_OS]</p><p>STATUS: <span class="status-text">ONLINE</span></p></div>
        <div class="hud-element top-right"><p>SESSION_ID: {{ Date.now() }}</p><p>DATA_STREAM: ACTIVE</p></div>
        <div class="hud-element left-bar">
          <TransitionGroup name="log-item" tag="ul">
            <li v-for="log in bootLog" :key="log.id" class="log-item" :class="log.state">{{ log.text }}</li>
          </TransitionGroup>
        </div>
        <div class="hud-element center-stage">
            <div class="logo-container">
              <svg class="core-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 4L57.5 17L72 20L65 32.5L69 47L50 42L31 47L35 32.5L28 20L42.5 17L50 4Z" /><path d="M50 96L42.5 83L28 80L35 67.5L31 53L50 58L69 53L65 67.5L72 80L57.5 83L50 96Z" /><path d="M4 50L17 42.5L20 28L32.5 35L47 31L42 50L47 69L32.5 65L20 72L17 57.5L4 50Z" /><path d="M96 50L83 57.5L80 72L67.5 65L53 69L58 50L53 31L67.5 35L80 28L83 42.5L96 50Z" /></svg>
            </div>
            <div><span class="glitch" data-text="VUE_SHOP_OS">LAUNCHING!!!</span></div>
            <button class="btn btn-hazard" data-text="CLICK TO LAUNCH">CLICK TO CONTINUE</button>
            <div><p class="status-text"> {{ finalMessage }}</p></div>
        </div>
        <div class="hud-element bottom-bar">
          <div class="progress-bar"><div class="progress-bar-inner" :style="{ width: `${progress}%` }"></div></div>
          <p class="final-message">{{ finalMessage }}<span v-if="finalMessage" class="caret"></span></p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
:root {
  --transition-duration: 1.2s;
  --timing-function: cubic-bezier(0.85, 0, 0.15, 1);
  --color-primary: #6ac7f1;
  --color-primary-glow: rgba(106, 199, 241, 0.7);
  --color-accent: #f9d858;
  --color-warn: #f0a03d;
  --color-danger: #ff4747;
  --color-danger-glow: rgba(255, 71, 71, 0.7);
  --color-bg-dark: #06040f;
  --color-bg-light: rgba(6, 4, 15, var(--mask-bg-opacity, 1));
  --color-grid: rgba(56, 117, 215, 0.1);
  --color-spotlight: rgba(255, 255, 255, 0.08);
  --font-mono: 'Roboto Mono', 'Fira Code', monospace;
}
.mask-loader-container {
  position: fixed; inset: 0; z-index: 100;
  overflow: hidden;
  background-color: var(--color-bg-dark);
  font-family: var(--font-mono);
  color: var(--color-primary);
  cursor: pointer;
  user-select: none;
  &:focus {
    outline: none;
  }
}
.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 0.5s ease;
}
.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}
.caret {
  display: inline-block; width: 10px; height: 1.2em;
  background-color: var(--color-primary);
  animation: blink-caret 0.75s step-end infinite;
  margin-left: 5px;
  vertical-align: middle;
}
@keyframes blink-caret {
  from, to { opacity: 0 }
  50% { opacity: 1 }
}
.mask-overlay {
  position: absolute; inset: 0;
  background-color: var(--color-bg-light);
  clip-path: circle(0% at 50% 50%);
  transition: clip-path var(--transition-duration) var(--timing-function);
}
.grid-overlay, .scanline-overlay, .spotlight {
  position: absolute; inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease-out;
}
.grid-overlay {
  background-image: linear-gradient(to right, var(--color-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--color-grid) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: pan-grid 30s linear infinite;
}
@keyframes pan-grid {
  0% { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}
.scanline-overlay {
  background: linear-gradient(to bottom, rgba(20, 20, 40, 0) 50%, rgba(20, 20, 40, 0.2) 51%);
  background-size: 100% 4px;
  animation: scanlines 10s linear infinite;
}
@keyframes scanlines {
  from { background-position: 0 0; }
  to { background-position: 0 100%; }
}
.spotlight {
  background: radial-gradient(circle 350px at var(--mouse-x) var(--mouse-y), var(--color-spotlight) 0%, transparent 70%);
  transition: opacity 0.5s ease;
}
.mask-loader-container:hover:not(.is-dismissed) .spotlight {
  opacity: 1;
}
.hud-layout {
  position: absolute; inset: 20px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s ease-out;
}
.hud-element {
  position: absolute;
  opacity: 0;
  animation: fade-in 1s forwards;
  &.top-left { top: 0; left: 0; text-align: left; }
  &.top-right { top: 0; right: 0; text-align: right; }
  &.left-bar { top: 100px; left: 0; bottom: 100px; width: 45%; }
  &.center-stage { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; text-align: center; }
  &.bottom-bar { bottom: 0; left: 0; right: 0; }
}
@keyframes fade-in { to { opacity: 1; } }
.glitch { position: relative; font-size: 1.2rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }
.status-text { color: #55ff55; text-shadow: 0 0 5px #55ff55; }
.left-bar ul { list-style: none; padding: 0; margin: 0; }
.log-item {
  margin-bottom: 8px; font-size: 0.85rem;
  white-space: nowrap;
  transition: color 0.5s;
}
.log-item-enter-active {
  transition: all 0.5s ease-out;
}
.log-item-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.log-item::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 10px;
  border: 1px solid var(--color-primary);
  opacity: 0.5;
}
.log-item.ok {
  color: #aaffaa;
  &::before { background: #55ff55; box-shadow: 0 0 5px #55ff55; border-color: #55ff55; }
}
.log-item.warn {
  color: var(--color-warn);
  &::before { background: var(--color-warn); box-shadow: 0 0 5px var(--color-warn); border-color: var(--color-warn); }
}
.logo-container {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 1s, transform 1s;
}
.core-logo {
  width: 120px; height: 120px;
  stroke: var(--color-primary);
  stroke-width: 2;
  filter: drop-shadow(0 0 10px var(--color-primary-glow));
}
.bottom-bar .progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(106, 199, 241, 0.1);
  border: 1px solid rgba(106, 199, 241, 0.3);
  padding: 2px;
  margin-bottom: 10px;
}
.bottom-bar .progress-bar-inner {
  width: 0%;
  height: 100%;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary-glow);
  transition: width 0.5s ease-out;
}
.bottom-bar .final-message {
  text-align: center;
  font-size: 1rem;
  height: 1.2rem;
  color: var(--color-accent);
  text-shadow: 0 0 8px var(--color-accent);
}

.stage-booting {
  animation: glitch-flash 0.4s steps(2, end);
  .mask-overlay {
    clip-path: circle(150% at 50% 50%);
    transition-delay: 0.2s;
  }
  .hud-layout {
    opacity: 1;
    transition-delay: 0.4s;
  }
  .grid-overlay, .scanline-overlay {
    opacity: 1;
    transition-delay: 0.8s;
  }
  .hud-element {
    &.top-left, &.top-right { animation-delay: 1s; }
    &.left-bar { animation-delay: 1.4s; }
    &.bottom-bar { animation-delay: 1.6s; }
    &.center-stage { animation-delay: 1.8s; }
  }
  .logo-container {
    opacity: 0.7;
    transform: scale(1);
    transition-delay: 2s;
  }
}
@keyframes glitch-flash {
  0%, 100% { transform: translate(0, 0); opacity: 1; }
  25% { transform: translate(5px, -5px); }
  50% { transform: translate(-5px, 5px); opacity: 0.8; }
  75% { transform: translate(5px, 5px); }
}

.stage-dismissed {
  cursor: default;
  .hud-layout, .spotlight, .grid-overlay, .scanline-overlay {
    opacity: 0 !important;
    transition: opacity 0.3s ease-in;
  }
  .mask-overlay {
    clip-path: circle(0% at var(--click-x) var(--click-y));
    transition-duration: calc(var(--transition-duration) * 0.9);
  }
}
/* --- 变量定义 (可放入 :root) --- */
:root {
  --color-hazard-bright: #ff3c3c;
  --color-hazard-dark: #c00;
  --font-mono: 'Roboto Mono', 'Fira Code', monospace;
}

/* --- 按钮样式 --- */
.btn-hazard {
  padding: 14px 28px;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  border: none;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
  position: relative;
  overflow: hidden;

  /* 切角效果 */
  clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);

  /* 警告条纹背景 */
  background-color: var(--color-hazard-dark);
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
  transition: all 0.3s ease;
}

.btn-hazard::before {
  /* 内部边框光晕 */
  content: '';
  position: absolute;
  inset: 2px;
  background: transparent;
  border: 2px solid var(--color-hazard-bright);
  clip-path: polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
  box-shadow: 0 0 15px var(--color-hazard-bright);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.btn-hazard:hover {
  background-color: var(--color-hazard-bright);
}

.btn-hazard:hover::before {
  opacity: 1;
  box-shadow: 0 0 25px var(--color-hazard-bright);
  transform: scale(0.97); /* 轻微收缩，增加立体感 */
}

.btn-hazard:active::before {
  box-shadow: 0 0 5px var(--color-hazard-bright);
  transform: scale(1);
}
</style>
