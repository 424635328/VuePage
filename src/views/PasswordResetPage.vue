<!-- src/views/PasswordResetPage.vue -->

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const toastStore = useToastStore();

const form = reactive({
  password: '',
  confirmPassword: '',
});

const status = reactive({
  loading: false,
  error: '',
  success: '',
});

async function handlePasswordReset() {
  if (form.password.length < 6) {
    status.error = '密码至少需要6个字符。';
    return;
  }
  if (form.password !== form.confirmPassword) {
    status.error = '两次输入的密码不匹配。';
    return;
  }

  status.loading = true;
  status.error = '';
  status.success = '';

  try {
    // 使用 Supabase 的 updateUser 方法来更新密码
    const { error } = await supabase.auth.updateUser({
      password: form.password,
    });

    if (error) throw error;

    status.success = '密码已成功重置！您现在可以用新密码登录了。';
    toastStore.showToast({ msg: '密码重置成功！' });

    // 几秒后自动跳转到主页并打开登录模态框
    setTimeout(() => {
      router.push('/');
      // 如果您有一个全局事件总线或 Pinia store 来控制模态框，可以在这里触发它
      // 例如： modalStore.openAuthModal();
    }, 3000);

  } catch (error) {
    status.error = error.message || '重置密码时发生错误，请重试。';
    toastStore.showToast({ msg: `错误: ${status.error}`, toastType: 'error' });
  } finally {
    status.loading = false;
  }
}
</script>

<template>
  <div class="reset-page-container">
    <div class="reset-form-wrapper">
      <h1 class="title">重置您的密码</h1>
      <p v-if="!status.success" class="subtitle">请输入您的新密码。密码长度至少为6个字符。</p>

      <div v-if="status.success" class="success-message-box">
        <p>{{ status.success }}</p>
        <p>3秒后将自动跳转到主页...</p>
      </div>

      <form v-else @submit.prevent="handlePasswordReset">
        <div class="form-group">
          <label for="new-password">新密码</label>
          <input
            type="password"
            id="new-password"
            v-model="form.password"
            required
            autocomplete="new-password"
          />
        </div>
        <div class="form-group">
          <label for="confirm-password">确认新密码</label>
          <input
            type="password"
            id="confirm-password"
            v-model="form.confirmPassword"
            required
            autocomplete="new-password"
          />
        </div>

        <p v-if="status.error" class="error-message">{{ status.error }}</p>

        <button type="submit" class="btn-primary" :disabled="status.loading">
          <span v-if="status.loading" class="spinner"></span>
          <span v-else>确认重置密码</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.reset-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}
.reset-form-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.title {
  text-align: center;
  font-size: 1.8rem;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}
.subtitle {
  text-align: center;
  color: var(--color-text-dark);
  margin-bottom: 2rem;
}
.form-group {
  margin-bottom: 1.5rem;
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  input {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--color-background);
    border: 1px solid var(--color-border-hover);
    border-radius: 8px;
    font-size: 1rem;
    color: var(--color-text);
  }
}
.btn-primary {
  width: 100%;
  padding: 0.8rem;
  background-color: var(--color-primary);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.error-message {
  color: #f87171;
  background-color: rgba(248, 113, 113, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}
.success-message-box {
  text-align: center;
  color: var(--color-text);
  p:first-child {
    color: #4ade80;
    font-weight: 600;
  }
}
.spinner { /* (spinner样式与AuthModal中相同) */ }
</style>
