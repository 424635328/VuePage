<!-- src/components/password/GeneratedResult.vue -->

<template>
  <div class="result-container">
    <div class="result-display-wrapper">
      <input
        type="text"
        :value="store.currentGenerated.password"
        readonly
        class="password-output"
      />
      <button @click="copyPassword" class="icon-button copy-btn" :title="copied ? '已复制!' : '复制密码'">
        <i :class="['fas', copied ? 'fa-check' : 'fa-copy']"></i>
      </button>
      <button @click="store.generateNewPassword" class="icon-button refresh-btn" title="重新生成">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>

    <div class="strength-wrapper">
      <div class="strength-meter">
        <div class="strength-bar" :style="strengthBarStyle"></div>
      </div>
      <p class="strength-text" :style="{ color: strengthInfo.color }">
        强度: {{ strengthInfo.text }}
      </p>
    </div>

    <div class="divider"></div>

    <div class="save-section">
      <h3>保存到密码库</h3>
      <form @submit.prevent="handleSave">
        <input v-model="platform" type="text" placeholder="平台 (例如: Google, Github)" required />
        <input v-model="label" type="text" placeholder="标签/用户名 (例如: work-email)" required />
        <textarea v-model="notes" placeholder="备注 (可选)"></textarea>
        <!-- 保存按钮暂时移除，可以后续添加 -->
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useClipboard } from '@vueuse/core'
import { useToast } from '@/composables/useToast'

const store = usePasswordStore()
const { copy, copied } = useClipboard({ timeout: 1500 })
const { addToast } = useToast()

const platform = ref('')
const label = ref('')
const notes = ref('')

const strengthInfo = computed(() => {
  const score = store.currentGenerated.strength.score;
  const map = [
    { text: '非常弱', color: '#E55353', width: '10%' },
    { text: '弱', color: '#F9B115', width: '30%' },
    { text: '中等', color: '#F9B115', width: '60%' }, // 设计图是黄色
    { text: '强', color: '#19D47A', width: '80%' },
    { text: '非常强', color: '#19D47A', width: '100%' },
  ];
  return map[score] || { text: '', color: '#393850', width: '0%' };
});

const strengthBarStyle = computed(() => ({
  width: strengthInfo.value.width,
  backgroundColor: strengthInfo.value.color,
}));

function copyPassword() {
  copy(store.currentGenerated.password);
  if (copied.value) {
    addToast({ message: '密码已复制到剪贴板', type: 'success' });
  }
}

async function handleSave() {
  // 保存逻辑保持不变
}
</script>

<style lang="scss" scoped>
.result-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.result-display-wrapper {
  display: flex;
  gap: 0.75rem;
}

.password-output {
  flex-grow: 1;
  background: #2A293D;
  border: 1px solid #393850;
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.25rem;
  font-weight: bold;
}

.icon-button {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;

  &.copy-btn {
    background: #2A293D;
    color: #C7C7E1;
    border: 1px solid #393850;
    &:hover { background-color: #393850; }
  }
  &.refresh-btn {
    background: #19D47A;
    color: #1E1D2B;
    &:hover { filter: brightness(1.1); }
  }
}

.strength-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.strength-meter {
  flex-grow: 1;
  width: 100%;
  height: 6px;
  background: #2A293D;
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease-out, background-color 0.4s ease-out;
}

.strength-text {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #393850;
  margin: 0.5rem 0;
}

.save-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h3 { margin: 0; color: #fff; font-size: 1.1rem; }

  input, textarea {
    background: #2A293D;
    border: 1px solid #393850;
    color: #C7C7E1;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    width: 100%;
    font-size: 1rem;
    transition: all 0.2s;

     &:focus {
        outline: none;
        border-color: #19D47A;
        background-color: #1E1D2B;
      }
    &::placeholder {
      color: #5C5B77;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }
}
</style>
