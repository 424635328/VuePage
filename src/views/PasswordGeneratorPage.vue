<!-- src/views/PasswordGeneratorPage.vue -->

<template>
  <div class="page-wrapper">
    <!-- 模态框逻辑保持不变 -->
    <div v-if="!passwordStore.isUnlocked" class="unlock-overlay">
      <!-- 初始加载或严重错误状态 -->
      <div v-if="uiState === 'loading' || uiState === 'error'" class="unlock-modal">
        <div v-if="uiState === 'loading'">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #1DDDBE;"></i>
          <p style="margin-top: 1rem;">正在检查密码库状态...</p>
        </div>
        <div v-if="uiState === 'error'">
           <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #F87171;"></i>
           <p style="margin-top: 1rem; color: #F87171; font-weight: 500;">无法加载密码库</p>
           <p class="unlock-description" style="margin-bottom: 0;">{{ pageError }}</p>
        </div>
      </div>

      <!-- 初始化或解锁状态 (高级感样式) -->
      <div v-else class="unlock-modal high-quality-modal">
        <h2 class="unlock-title">
          {{ uiState === 'setup' ? '启用密码库' : '访问密码库' }}
        </h2>
        <p class="unlock-description">
          {{ uiState === 'setup'
            ? '为保障安全，我们将使用您的账户密码对密码库进行加密。请输入您的登录密码以完成首次设置。'
            : '为保障安全，请输入您的账户登录密码以访问和管理已保存的密码。'
          }}
        </p>

        <form @submit.prevent="handleSubmit" :class="{ 'form-loading': passwordStore.isLoading }">
          <fieldset :disabled="passwordStore.isLoading">
            <div class="input-group">
              <input v-model="accountPasswordInput" :type="showPassword ? 'text' : 'password'" placeholder="您的账户登录密码"
                required autofocus class="password-input" />
              <button type="button" class="toggle-visibility" @click="showPassword = !showPassword" title="显示/隐藏密码">
                <i :class="['fas', showPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
              </button>
            </div>

            <button type="submit" class="action-button" :disabled="!accountPasswordInput">
              <span v-if="passwordStore.isLoading">
                <i class="fas fa-spinner fa-spin"></i> 验证中...
              </span>
              <span v-else>{{ uiState === 'setup' ? '启用并进入' : '确认并访问' }}</span>
            </button>
          </fieldset>
        </form>
        <p v-if="formError" class="error-message">{{ formError }}</p>
      </div>
    </div>

    <!-- 主内容区 -->
    <div v-else class="password-generator-page-container">
      <aside class="generator-panel">
        <div class="panel-header">
          <h1>密码生成器</h1>
          <button @click="passwordStore.lockVault" class="lock-button" title="锁定密码库">
            锁定
          </button>
        </div>

        <div class="panel-content">
          <GeneratorControls />
          <GeneratedResult />
        </div>

      </aside>
      <main class="archive-panel">
        <ArchiveManager />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useToast } from '@/composables/useToast'
import GeneratorControls from '@/components/password/GeneratorControls.vue'
import GeneratedResult from '@/components/password/GeneratedResult.vue'
import ArchiveManager from '@/components/password/ArchiveManager.vue'

// 脚本部分与上一版完全相同，无需改动
const passwordStore = usePasswordStore()
const { addToast } = useToast()
const accountPasswordInput = ref('')
const formError = ref('')
const pageError = ref('')
const showPassword = ref(false)
const initialCheckDone = ref(false)

const uiState = computed(() => {
  if (pageError.value) return 'error';
  if (!initialCheckDone.value) return 'loading';
  if (passwordStore.vaultStatus === 'uninitialized') return 'setup';
  return 'login';
})

async function handleSubmit() {
  formError.value = '';
  if (uiState.value === 'setup') {
    try {
      await passwordStore.initializeWithAccountPassword(accountPasswordInput.value);
      addToast({ message: '密码库已成功启用！', type: 'success' });
      accountPasswordInput.value = '';
    } catch (error) {
      formError.value = error.message || '启用失败，请重试。';
    }
  } else {
    try {
      await passwordStore.unlockWithAccountPassword(accountPasswordInput.value);
      accountPasswordInput.value = '';
    } catch (error) {
      formError.value = error.message || '发生未知错误。';
    }
  }
}

onMounted(async () => {
  try {
    await passwordStore.checkVaultStatus();
    passwordStore.generateNewPassword();
  } catch (error) {
    const errorMessage = error.message || "无法连接到服务，请刷新页面或稍后重试。";
    pageError.value = errorMessage;
    addToast({ message: errorMessage, type: 'error', duration: 5000 });
  } finally {
    initialCheckDone.value = true;
  }
})

onUnmounted(() => {
  if (passwordStore.isUnlocked) {
    passwordStore.lockVault()
  }
})
</script>

<style lang="scss" scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.page-wrapper {
  color: #E0E1E9;
  min-height: 100vh;
  height: 100vh; /* 确保占满整个视窗 */
  overflow: hidden; /* 防止页面级别的滚动 */
}

/* --- 模态框样式 (保持不变) --- */
.unlock-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(10, 10, 25, 0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.unlock-modal {
  background: #232230; padding: 2.5rem; border-radius: 12px;
  width: 100%; max-width: 450px; text-align: center;
  border: 1px solid #313042;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}
.high-quality-modal {
  background: linear-gradient(145deg, #2E2E48, #1A1A2A);
  padding: 3rem; border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5),
              inset 0 1px 1px rgba(255, 255, 255, 0.05);
}
.unlock-title { font-size: 2rem; font-weight: 600; color: #1DDDBE; margin: 0 0 1rem 0; letter-spacing: 1px; }
.unlock-description { color: #9A9AB0; margin-bottom: 3rem; line-height: 1.7; font-size: 1rem; }
form.form-loading fieldset { opacity: 0.6; pointer-events: none; }
fieldset { border: none; padding: 0; margin: 0; }
.input-group { position: relative; margin-bottom: 1.5rem; }
.password-input {
  width: 100%; padding: 1rem 3rem 1rem 1rem; border-radius: 8px;
  border: none; background: rgba(0, 0, 0, 0.2); color: #fff;
  font-size: 1rem; transition: all 0.3s ease;
  border-bottom: 2px solid #4A4A6A;
  &::placeholder { color: #7A7A9A; }
  &:focus {
    outline: none; background: rgba(0, 0, 0, 0.3);
    border-bottom-color: #1DDDBE;
    box-shadow: 0 5px 15px rgba(29, 221, 190, 0.1);
  }
}
.toggle-visibility {
  position: absolute; right: 1rem; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; color: #7A7A9A;
  cursor: pointer; padding: 5px; transition: color 0.2s;
  &:hover { color: #1DDDBE; }
}
.action-button {
  width: 100%; padding: 1rem;
  background: linear-gradient(to right, #5A5A7A, #4A4A6A);
  color: #D0D0E0; border: 1px solid #6A6A8A;
  border-radius: 8px; font-weight: 600; font-size: 1rem;
  letter-spacing: 0.5px; cursor: pointer; transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  &:hover:not(:disabled) {
    background: linear-gradient(to right, #1DDDBE, #16A085);
    color: #fff; border-color: #1DDDBE; transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(29, 221, 190, 0.2);
  }
  &:active:not(:disabled) { transform: translateY(-1px); }
  &:disabled {
    background: #3A3A4A; border-color: #4A4A6A; cursor: not-allowed;
    color: #7A7A9A; box-shadow: none;
  }
}
.error-message {
  color: #F87171; margin-top: 1.5rem; font-weight: 500; min-height: 1.2em;
}

/* --- 主内容区样式 (优化后) --- */
.password-generator-page-container {
  display: grid;
  grid-template-columns: 420px 1fr; /* 固定左侧宽度，右侧自适应 */
  gap: 1.5rem; /* 减小间距以节省空间 */
  padding: 1.5rem; /* 减小内边距以节省空间 */
  height: 100vh; /* 占满整个视窗高度 */
  max-width: none; /* 移除最大宽度限制 */
  margin: 0;
  box-sizing: border-box;
}

.generator-panel,
.archive-panel {
  background: rgba(46, 45, 61, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16px; /* 稍微减小圆角 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  padding: 1.5rem; /* 减小内边距 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */
  min-height: 0; /* 允许子元素收缩 */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem; /* 减小底部间距 */
  flex-shrink: 0; /* 防止头部被压缩 */

  h1 {
    margin: 0;
    font-size: 1.5rem; /* 稍微减小字体 */
    font-weight: 600;
    color: #fff;
  }

  .lock-button {
    background: #E55353;
    color: white;
    border: none;
    padding: 0.5rem 1rem; /* 稍微减小按钮 */
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem; /* 稍微减小字体 */
    transition: background-color 0.2s;
    &:hover { background: #c83c3c; }
  }
}

.panel-content {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 减小组件间距 */
  min-height: 0; /* 允许内容收缩 */
  overflow: hidden; /* 防止溢出，让子组件处理滚动 */
}

/* 响应式设计 */
@media (max-height: 700px) {
  .password-generator-page-container {
    padding: 1rem;
    gap: 1rem;
  }

  .generator-panel,
  .archive-panel {
    padding: 1rem;
    border-radius: 12px;
  }

  .panel-header {
    margin-bottom: 0.75rem;

    h1 {
      font-size: 1.3rem;
    }

    .lock-button {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }
  }

  .panel-content {
    gap: 0.75rem;
  }
}

@media (max-width: 1200px) {
  .password-generator-page-container {
    grid-template-columns: 380px 1fr;
  }
}

@media (max-width: 900px) {
  .password-generator-page-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    gap: 1rem;
  }

  .generator-panel {
    order: 1;
  }

  .archive-panel {
    order: 2;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
