<!-- src/views/PasswordGeneratorPage.vue -->

<template>
  <div class="page-wrapper">
    <!-- 模态框：用于“加载中”、“锁定”和“未初始化”状态 -->
    <div v-if="!passwordStore.isUnlocked" class="unlock-overlay">
      <!-- 初始加载或严重错误状态 -->
      <div v-if="uiState === 'loading' || uiState === 'error'" class="unlock-modal">
        <div v-if="uiState === 'loading'">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3ecf8e;"></i>
          <p style="margin-top: 1rem;">正在检查密码库状态...</p>
        </div>
        <div v-if="uiState === 'error'">
           <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ff6b6b;"></i>
           <p style="margin-top: 1rem; color: #ff6b6b; font-weight: 500;">无法加载密码库</p>
           <p class="unlock-description" style="margin-bottom: 0;">{{ pageError }}</p>
        </div>
      </div>

      <!-- 初始化或解锁状态 -->
      <div v-else class="unlock-modal">
        <h2 class="unlock-title">
          <i :class="['fas', uiState === 'setup' ? 'fa-key' : 'fa-shield-alt']"></i>
          {{ uiState === 'setup' ? '启用密码库' : '访问密码库' }}
        </h2>
        <p class="unlock-description">
          {{ uiState === 'setup'
            ? '为保障安全，我们将使用您的账户密码对密码库进行加密。请输入您的登录密码以完成首次设置。'
            : '为保障安全，请输入您的账户登录密码以访问和管理已保存的密码。'
          }}
        </p>

        <!-- 表单在加载时整体禁用，防止重复提交 -->
        <form @submit.prevent="handleSubmit" :class="{ 'form-loading': passwordStore.isLoading }">
          <fieldset :disabled="passwordStore.isLoading">
            <div class="input-group">
              <i class="fas fa-lock input-icon"></i>
              <input v-model="accountPasswordInput" :type="showPassword ? 'text' : 'password'" placeholder="您的账户登录密码"
                required autofocus class="password-input" />
              <button type="button" class="toggle-visibility" @click="showPassword = !showPassword">
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
            <i class="fas fa-lock"></i> 锁定
          </button>
        </div>
        <GeneratorControls />
        <GeneratedResult />
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

const passwordStore = usePasswordStore()
const { addToast } = useToast()

const accountPasswordInput = ref('')
const formError = ref('')
const pageError = ref('') // 用于处理 onMounted 时的严重错误
const showPassword = ref(false)
const initialCheckDone = ref(false)

/**
 * UI 状态机，根据 store 的状态决定模态框显示内容。
 * 'loading': 正在进行首次状态检查。
 * 'error': 首次状态检查失败，无法继续。
 * 'setup': 密码库未初始化，需要用户设置。
 * 'login': 密码库已锁定，需要用户解锁。
 */
const uiState = computed(() => {
  if (pageError.value) return 'error';
  if (!initialCheckDone.value) return 'loading';
  if (passwordStore.vaultStatus === 'uninitialized') return 'setup';
  return 'login';
})

/**
 * 处理表单提交事件，根据当前 UI 状态调用不同的 store action。
 */
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
  } else { // 'login' state
    try {
      await passwordStore.unlockWithAccountPassword(accountPasswordInput.value);
      accountPasswordInput.value = '';
    } catch (error) {
      formError.value = error.message || '发生未知错误。';
    }
  }
}

/**
 * 在组件挂载时，检查密码库的状态以决定显示哪个界面。
 */
onMounted(async () => {
  try {
    await passwordStore.checkVaultStatus();
    passwordStore.generateNewPassword();
  } catch (error) {
    const errorMessage = error.message || "无法连接到服务，请刷新页面或稍后重试。";
    pageError.value = errorMessage;
    // 使用 Toast 提供一个非阻塞的通知
    addToast({ message: errorMessage, type: 'error', duration: 5000 });
  } finally {
    initialCheckDone.value = true;
  }
})

/**
 * 在组件卸载时，如果密码库是解锁状态，则自动锁定以确保安全。
 */
onUnmounted(() => {
  if (passwordStore.isUnlocked) {
    passwordStore.lockVault()
  }
})
</script>

<style lang="scss" scoped>
/* 样式与主密码方案基本一致，仅微调部分类名 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

.page-wrapper {
  color: #e0e0e0;
}

.unlock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(10, 10, 25, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.unlock-modal {
  background: #1e1e2f;
  padding: 2.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  border: 1px solid #4a4a6a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.5s ease-out;
}

.unlock-title {
  font-size: 1.75rem;
  color: #3ecf8e;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.unlock-description {
  color: #a0a0b0;
  margin-bottom: 2rem;
  line-height: 1.6;
}

form.form-loading {
  opacity: 0.7;
  pointer-events: none;
}

.input-group {
  position: relative;
  margin-bottom: 1.5rem;
}

.input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7a9a;
}

.password-input {
  width: 100%;
  padding: 0.8rem 2.5rem 0.8rem 2.5rem;
  border-radius: 6px;
  border: 1px solid #4a4a6a;
  background: #2a2a3e;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #3ecf8e;
    box-shadow: 0 0 0 3px rgba(62, 207, 142, 0.3);
  }
}

.toggle-visibility {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #7a7a9a;
  cursor: pointer;
  padding: 5px;

  &:hover {
    color: #fff;
  }
}

.action-button {
  width: 100%;
  padding: 0.8rem;
  background: #3ecf8e;
  color: #1e1e2f;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;

  &:hover:not(:disabled) {
    background: #35b47c;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    color: #999;
  }
}

.error-message {
  color: #ff6b6b;
  margin-top: 1rem;
  font-weight: 500;
}

.password-generator-page-container {
  display: grid;
  grid-template-columns: minmax(400px, 1fr) 1.5fr;
  gap: 2rem;
  padding: 2rem;
  height: calc(100vh - 80px);
  max-width: 1400px;
  margin: 0 auto;
}

.generator-panel,
.archive-panel {
  background-color: rgba(30, 30, 47, 0.7);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #4a4a6a;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #4a4a6a;
  padding-bottom: 1rem;
  flex-shrink: 0;
}

.panel-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
}

.lock-button {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #e05252;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
