<!-- src/components/password/GeneratorControls.vue -->

<template>
  <div class="controls-container">
    <div class="control-section">
      <div class="label-wrapper">
        <label for="length">密码长度</label>
        <span class="length-value">{{ store.config.length }}</span>
      </div>
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

    <div class="control-section checkbox-group">
      <div class="checkbox-wrapper">
        <input type="checkbox" id="uppercase" v-model="store.config.useUppercase" @change="store.generateNewPassword">
        <label for="uppercase"><i class="fas fa-check"></i> 大写字母 (A-Z)</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="lowercase" v-model="store.config.useLowercase" @change="store.generateNewPassword">
        <label for="lowercase"><i class="fas fa-check"></i> 小写字母 (a-z)</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="numbers" v-model="store.config.useNumbers" @change="store.generateNewPassword">
        <label for="numbers"><i class="fas fa-check"></i> 数字 (0-9)</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="symbols" v-model="store.config.useSymbols" @change="store.generateNewPassword">
        <label for="symbols"><i class="fas fa-check"></i> 特殊符号 (!@#...)</label>
      </div>
    </div>

    <div class="control-section">
      <div class="checkbox-wrapper single-checkbox">
        <input type="checkbox" id="excludeSimilar" v-model="store.config.excludeSimilar" @change="store.generateNewPassword">
        <label for="excludeSimilar"><i class="fas fa-check"></i> 排除易混淆字符 (i, l, 1, O, 0)</label>
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
  gap: 2rem;
}

.control-section {
  width: 100%;
}

.label-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  label {
    font-weight: 500;
    color: #C7C7E1;
    font-size: 1rem;
  }
  .length-value {
    background-color: #19D47A;
    color: #1E1D2B;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-weight: bold;
    font-size: 0.9rem;
  }
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #393850;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #19D47A;
    cursor: pointer;
    border: 3px solid #1E1D2B;
    box-shadow: 0 0 5px rgba(25, 212, 122, 0.5);
  }
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #19D47A;
    cursor: pointer;
    border: 3px solid #1E1D2B;
  }
}

.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-wrapper {
  position: relative;

  label {
    padding-left: 2em;
    cursor: pointer;
    color: #C7C7E1;
    display: flex;
    align-items: center;

    i {
      display: grid;
      place-items: center;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 1.4em;
      height: 1.4em;
      border: 1px solid #393850;
      border-radius: 4px;
      color: #1E1D2B;
      font-size: 0.8em;
      transition: background-color 0.2s, color 0.2s;
    }
  }

  input[type="checkbox"] {
    display: none; // 隐藏原始复选框
    &:checked + label i {
      background-color: #19D47A;
      color: #1E1D2B;
      border-color: #19D47A;
    }
  }
}

.single-checkbox {
  margin-top: 1rem;
}
</style>
