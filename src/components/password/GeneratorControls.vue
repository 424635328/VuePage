<!-- src/components/password/GeneratorControls.vue -->

<template>
  <div class="controls-container">
    <div class="control-section">
      <div class="label-wrapper">
        <label for="length">密码长度</label>
        <span class="length-value">{{ store.config.length }}</span>
      </div>
      <div class="slider-container">
        <input
          type="range"
          id="length"
          min="8"
          max="64"
          v-model.number="store.config.length"
          @input="store.generateNewPassword"
          class="slider"
        />
      </div>
    </div>

    <div class="divider"></div>

    <div class="control-section checkbox-group">
      <div class="checkbox-wrapper">
        <input type="checkbox" id="uppercase" v-model="store.config.useUppercase" @change="store.generateNewPassword">
        <label for="uppercase">大写字母 (A-Z)</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="lowercase" v-model="store.config.useLowercase" @change="store.generateNewPassword">
        <label for="lowercase">小写字母 (a-z)</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="numbers" v-model="store.config.useNumbers" @change="store.generateNewPassword">
        <label for="numbers">数字 (0-9)</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="symbols" v-model="store.config.useSymbols" @change="store.generateNewPassword">
        <label for="symbols">特殊符号 (!@#...)</label>
      </div>
      <div class="checkbox-wrapper full-width">
        <input type="checkbox" id="excludeSimilar" v-model="store.config.excludeSimilar" @change="store.generateNewPassword">
        <label for="excludeSimilar">排除易混淆字符 (i, l, 1, O, 0)</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { usePasswordStore } from '@/stores/password'
const store = usePasswordStore()
</script>

<style lang="scss" scoped>
.controls-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-section {
  width: 100%;
}

.label-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  label {
    font-weight: 500;
    color: #A9A8B8;
    font-size: 1rem;
  }
  .length-value {
    background-color: #29D47A;
    color: #1A1926;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-weight: bold;
  }
}

.slider-container {
  padding: 0 5px; /* 给滑块的thumb留出空间 */
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #313042;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #29D47A;
    cursor: pointer;
    margin-top: -7px; /* 垂直居中 */
    box-shadow: 0 0 10px rgba(41, 212, 122, 0.5);
  }
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #29D47A;
    cursor: pointer;
    border: none;
  }
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #313042;
  margin: 0.5rem 0;
}

.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;

  &.full-width {
    grid-column: 1 / -1; /* 占据整行 */
  }

  label {
    padding-left: 2.25rem;
    position: relative;
    cursor: pointer;
    color: #C7C7E1;
    font-size: 1rem;
    user-select: none;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 1.25rem;
      height: 1.25rem;
      background-color: #29D47A;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #313042;
      border-radius: 4px;
      transition: border-color 0.2s ease;
    }
  }

  input[type="checkbox"] {
    display: none; // 隐藏原始复选框

    &:checked + label::before {
      opacity: 1;
    }
    &:checked + label::after {
      border-color: #29D47A;
    }
  }
}
</style>
