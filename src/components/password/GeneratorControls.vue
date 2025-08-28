<!-- src/components/password/GeneratorControls.vue -->

<template>
  <div class="controls-wrapper">
    <!-- 密码长度 -->
    <div class="control-row length-control">
      <label for="length">密码长度</label>
      <div class="slider-container">
        <input
          type="range"
          id="length"
          min="6"
          max="64"
          v-model.number="store.config.length"
          @input="store.generateNewPassword"
          class="slider"
        />
      </div>
      <span class="length-value">{{ store.config.length }}</span>
    </div>

    <!-- 选项网格 (已重构) -->
    <div class="options-grid">
      <label for="uppercase">大写字母 (A-Z)</label>
      <label class="circle-switch">
        <input type="checkbox" id="uppercase" v-model="store.config.useUppercase" @change="validateAndGenerate">
        <span class="switch-indicator"></span>
      </label>

      <label for="lowercase">小写字母 (a-z)</label>
      <label class="circle-switch">
        <input type="checkbox" id="lowercase" v-model="store.config.useLowercase" @change="validateAndGenerate">
        <span class="switch-indicator"></span>
      </label>

      <label for="numbers">数字 (0-9)</label>
      <label class="circle-switch">
        <input type="checkbox" id="numbers" v-model="store.config.useNumbers" @change="validateAndGenerate">
        <span class="switch-indicator"></span>
      </label>

      <label for="symbols">特殊符号 (!@#)</label>
      <label class="circle-switch">
        <input type="checkbox" id="symbols" v-model="store.config.useSymbols" @change="validateAndGenerate">
        <span class="switch-indicator"></span>
      </label>
    </div>

    <!-- 高级选项 -->
    <div class="advanced-section">
      <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
        <span>高级选项</span>
        <svg :class="{ 'is-rotated': showAdvanced }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>
      <transition name="slide-fade">
        <div v-if="showAdvanced" class="advanced-options">
          <div class="option-row full-width">
            <label for="excludeSimilar">排除易混淆字符 (i, l, 1, O, 0)</label>
            <label class="circle-switch">
              <input type="checkbox" id="excludeSimilar" v-model="store.config.excludeSimilar" @change="store.generateNewPassword">
              <span class="switch-indicator"></span>
            </label>
          </div>
          <div class="option-row full-width">
            <label for="forceInclude">强制包含每种已选字符</label>
            <label class="circle-switch">
              <input type="checkbox" id="forceInclude" v-model="store.config.forceInclude" @change="store.generateNewPassword" :disabled="!isForceIncludeAvailable">
              <span class="switch-indicator"></span>
            </label>
          </div>
          <div class="option-row full-width custom-exclude">
             <label for="customExclusions">自定义排除字符 (例如: {[]})</label>
             <input
              id="customExclusions"
              type="text"
              v-model="store.config.customExclusions"
              @input="debouncedGenerate"
              @focus="store.config.excludeCustom = true"
              class="custom-exclude-input"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePasswordStore } from '@/stores/password';
import { useToast } from '@/composables/useToast';

const store = usePasswordStore();
const { addToast } = useToast();
const showAdvanced = ref(false);

const getSelectedCharsetsCount = () => {
    return (store.config.useUppercase ? 1 : 0) +
           (store.config.useLowercase ? 1 : 0) +
           (store.config.useNumbers ? 1 : 0) +
           (store.config.useSymbols ? 1 : 0);
};

function validateAndGenerate(event) {
  const checkboxId = event.target.id;
  // 构建正确的 store config key, e.g., 'uppercase' -> 'useUppercase'
  const configKey = `use${checkboxId.charAt(0).toUpperCase() + checkboxId.slice(1)}`;

  if (getSelectedCharsetsCount() === 0) {
    event.target.checked = true;
    store.config[configKey] = true;

    addToast({
      message: '必须至少选择一个字符集！',
      type: 'warning',
      duration: 3000
    });
    return;
  }
  store.generateNewPassword();
}

const isForceIncludeAvailable = computed(() => {
    return getSelectedCharsetsCount() > 1;
});

function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedGenerate = debounce(() => {
  store.generateNewPassword();
}, 300);
</script>

<style lang="scss" scoped>
/* 定义与截图匹配的颜色 */
:root {
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --inactive-color: #4b5563;
}

.controls-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2.5rem; /* 增加垂直间距，营造空间感 */
  background: transparent; /* 关键：移除背景 */
}

// 密码长度行
.control-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;

  label {
    flex-shrink: 0;
    font-size: 1rem;
    color: var(--text-primary);
  }
}

.length-control {
  .slider-container {
    flex-grow: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  .length-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    min-width: 3ch;
    text-align: right;
  }
}

// 还原截图中的极简滑块样式
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background: transparent; /* 关键：轨道透明 */
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    margin-top: -9px;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3); // 添加微妙辉光
  }
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: none;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }
}

// 选项网格布局 (已修改)
.options-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 2.5rem 1.5rem; /* row-gap column-gap */
  align-items: center;

  label:not(.circle-switch) {
    font-size: 1rem;
    color: var(--text-primary);
    user-select: none;
  }

  .circle-switch {
    justify-self: end; // 将开关推到其网格单元格的右侧
  }
}


// 还原截图中的圆形指示器
.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  label:not(.circle-switch) { // 在 .option-row 内部的 label 样式
    font-size: 1rem;
    color: var(--text-primary);
    user-select: none;
  }
}

.circle-switch {
  position: relative;
  width: 20px;
  height: 20px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch-indicator {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    transition: all 0.2s ease-in-out;
    // 默认状态：空心圆
    background-color: transparent;
    border: 2px solid var(--inactive-color);
  }

  input:checked + .switch-indicator {
    // 选中状态：实心圆
    background-color: white;
    border-color: white;
  }

  input:disabled + .switch-indicator {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// 高级选项
.advanced-section {
  margin-top: 1rem;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 1rem 0;
  cursor: pointer;
  font-size: 1rem;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.3s ease;
    &.is-rotated {
      transform: rotate(180deg);
    }
  }
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding-top: 1rem;
}

.full-width {
  width: 100%;
}

.custom-exclude-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  text-align: right;
  font-size: 1rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--inactive-color); // 始终可见的下划线
  flex-grow: 1; // 允许输入框伸展
  margin-left: 2rem; // 与左侧标签保持距离

  &:focus {
    outline: none;
    border-bottom-color: var(--text-primary); // 聚焦时下划线变亮
  }
}

// 动画
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
  max-height: 250px;
  overflow: hidden;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}

@media (max-width: 640px) {
  .options-grid {
    grid-template-columns: 1fr; // 在小屏幕上变为单列
  }
}
</style>
