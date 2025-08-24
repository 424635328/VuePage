<!-- src/components/password/GeneratedResult.vue -->

<template>
  <div class="result-container">
    <div class="result-display-wrapper">
      <input
        type="text"
        v-model="displayPassword"
        class="password-output"
      />
      <button @click="copyPassword" class="action-btn" :title="copied ? '已复制!' : '复制密码'">
        <BaseIcon :name="copied ? 'check' : 'copy'" />
      </button>
      <button @click="handleGenerateNew" class="action-btn refresh-btn" title="重新生成">
        <BaseIcon name="refresh" />
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
      <h3>{{ isUpdating ? '更新密码' : '保存到密码库' }}</h3>
      <form @submit.prevent="handleSave">
        <input v-model="platform" type="text" placeholder="平台 (例如: Google, Github)" required />
        <input v-model="label" type="text" placeholder="标签/用户名 (选填)" />
        <textarea v-model="notes" placeholder="备注 (选填)"></textarea>

        <button type="submit" class="save-button" :disabled="store.isLoading || !isSaveable">
          <span v-if="store.isLoading"><BaseIcon name="refresh" class="spin-animation" /> 处理中...</span>
          <span v-else-if="isUpdating"><BaseIcon name="refresh" /> 更新密码</span>
          <span v-else><BaseIcon name="save" /> 保存新密码</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
// Script 部分无变化
import { ref, computed, watch } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useClipboard } from '@vueuse/core'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { zxcvbn } from '@zxcvbn-ts/core'

const store = usePasswordStore()
const { copy, copied } = useClipboard({ timeout: 1500 })
const { addToast } = useToast()

const platform = ref('')
const label = ref('')
const notes = ref('')

const displayPassword = ref(store.currentGenerated.password);
const displayStrength = ref(store.currentGenerated.strength);

watch(() => store.currentGenerated.password, (newPass) => {
  displayPassword.value = newPass;
});

watch(displayPassword, (pass) => {
  displayStrength.value = zxcvbn(pass);
});

const isSaveable = computed(() => platform.value.trim() !== '' && displayPassword.value.trim() !== '');

const existingItem = computed(() => {
  if (!platform.value) return null;
  const platformName = platform.value.trim().toLowerCase();
  return store.archive.find(item => item.platform.toLowerCase() === platformName);
});

const isUpdating = computed(() => !!existingItem.value);

watch(existingItem, (item) => {
  if (item) {
    label.value = item.label || '';
    notes.value = item.notes || '';
  }
});

const strengthInfo = computed(() => {
  const score = displayStrength.value.score;
  const map = [
    { text: '非常弱', color: '#E55353', width: '10%' },
    { text: '弱', color: '#F9B115', width: '30%' },
    { text: '中等', color: '#F9B115', width: '60%' },
    { text: '强', color: '#29D47A', width: '80%' },
    { text: '非常强', color: '#29D47A', width: '100%' },
  ];
  return map[score] || { text: '', color: '#313042', width: '0%' };
});

const strengthBarStyle = computed(() => ({
  width: strengthInfo.value.width,
  backgroundColor: strengthInfo.value.color,
}));

function handleGenerateNew() {
    store.generateNewPassword();
}

function copyPassword() {
  copy(displayPassword.value);
  if (copied.value) {
    addToast({ message: '密码已复制到剪贴板', type: 'success' });
  }
}

async function handleSave() {
  if (!isSaveable.value) return;
  try {
    const details = {
      platform: platform.value,
      label: label.value,
      notes: notes.value,
    };

    if (isUpdating.value) {
      await store.updatePassword(existingItem.value.id, {
        ...details,
        password: displayPassword.value,
      });
      addToast({ message: `"${platform.value}" 的密码已成功更新！`, type: 'success' });
    } else {
      await store.savePassword(details, displayPassword.value, displayStrength.value.score);
      addToast({ message: `"${platform.value}" 的密码已成功保存！`, type: 'success' });
    }

    platform.value = '';
    label.value = '';
    notes.value = '';
    store.generateNewPassword();
  } catch (error) {
    addToast({ message: error.message || '操作失败，请重试。', type: 'error' });
  }
}
</script>

<style lang="scss" scoped>
.result-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.result-display-wrapper {
  display: flex;
  gap: 0.75rem;
}

.password-output {
  flex-grow: 1;
  /* [已修改] 半透明背景 */
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.25rem;
  font-weight: bold;
}

.action-btn {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  /* [已修改] 半透明背景 */
  background: rgba(30, 41, 59, 0.5);
  color: #c7c7e1;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    transition: transform 0.2s ease;
  }

  &:hover {
    background-color: rgba(57, 56, 80, 0.7);
    color: #fff;
    border-color: rgba(148, 163, 184, 0.3);
    svg {
      transform: scale(1.1);
    }
  }

  &.refresh-btn {
    background: #29D47A;
    color: #1A1926;
    border-color: transparent;
    &:hover {
      background: #29D47A;
      filter: brightness(1.1);
    }
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
  background: rgba(30, 41, 59, 0.5);
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
  background-color: rgba(148, 163, 184, 0.2);
  margin: 0.5rem 0;
}

.save-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h3 { margin: 0; color: #fff; font-size: 1.1rem; }

  input, textarea {
    /* [已修改] 半透明背景 */
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
    color: #C7C7E1;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    width: 100%;
    font-size: 1rem;
    transition: all 0.2s;

     &:focus {
        outline: none;
        border-color: #29D47A;
        background-color: rgba(30, 41, 59, 0.8);
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

.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.8rem;
  margin-top: 0.5rem;
  background: linear-gradient(to right, #29D47A, #24b86a);
  color: #1A1926;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(41, 212, 122, 0.2);

  span { display: flex; align-items: center; gap: 0.5rem; }
  svg { width: 1.25rem; height: 1.25rem; }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(41, 212, 122, 0.3);
    filter: brightness(1.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #313042;
    cursor: not-allowed;
    color: #5C5B77;
    box-shadow: none;
  }
}

.spin-animation {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
