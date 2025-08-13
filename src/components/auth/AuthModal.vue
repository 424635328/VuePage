<!-- src/components/auth/AuthModal.vue -->

<script setup>
import { ref, reactive, watch, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

// --- Props, Emits, and Store ---
const props = defineProps({ active: Boolean });
// 【修改】移除了不再需要的 'loggedIn' emit
const emit = defineEmits(['close', 'update:active']);
const authStore = useAuthStore();
const router = useRouter();

// --- Component State ---
const formMode = ref('login');
const isShaking = ref(false);
const otpInputRefs = ref([]);
const firstInput = ref(null);

const getInitialState = () => ({
  form: { email: '', password: '', confirmPassword: '', otp: Array(6).fill('') },
  status: { loading: false, error: '', success: '', showResendLink: false }
});

const form = reactive(getInitialState().form);
const status = reactive(getInitialState().status);

// --- Core Logic & Handlers ---

function resetState() {
  Object.assign(form, getInitialState().form);
  Object.assign(status, getInitialState().status);
  formMode.value = 'login';
}

function closeModal() {
  if (status.loading) return;
  emit('update:active', false);
  emit('close');
  setTimeout(resetState, 300);
}

async function _handleSubmit(action) {
  status.loading = true;
  status.error = '';
  status.success = '';
  try {
    await action();
    return true;
  } catch (error) {
    status.error = error.message || '发生未知错误。';
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);
    return false;
  } finally {
    status.loading = false;
  }
}

async function handleLogin() {
  const successful = await _handleSubmit(async () => {
    await authStore.signInWithPassword({ email: form.email, password: form.password });
  });

  if (successful) {
    closeModal();
    // 使用 nextTick 确保DOM更新（模态框开始关闭）有机会启动，然后再跳转。
    // 这会让过渡更平滑。
    await nextTick();
    await router.replace({ name: 'shop' });
  } else {
    if (status.error.includes('Email not confirmed')) {
      status.error = '您的账户尚未激活。请检查邮箱中的确认链接。';
      status.showResendLink = true;
    } else {
      status.error = '登录失败，请检查您的邮箱和密码是否正确。';
    }
  }
}

async function handleRegister() {
  if (form.password !== form.confirmPassword) {
    status.error = '两次输入的密码不匹配。'; return;
  }
  if (form.password.length < 6) {
    status.error = '密码至少需要6个字符。'; return;
  }
  const successful = await _handleSubmit(async () => {
    await authStore.signUp({ email: form.email, password: form.password });
  });
  if (successful) {
    formMode.value = 'verify';
    status.success = `注册请求已发送！我们已向 ${form.email} 发送了一封确认邮件。`;
    status.error = '';
  } else if (!status.error.includes('rate limit')) {
    status.error = '注册失败，该邮箱可能已被注册或输入有误。';
  }
}

async function handleVerifyOtp() {
  const otpCode = form.otp.join('');
  if (otpCode.length !== 6) {
    status.error = '请输入一个有效的6位数验证码。'; return;
  }

  const successful = await _handleSubmit(async () => {
    await authStore.verifyOtp(form.email, otpCode);
  });

  if (successful) {
    // 【关键修复】: 同样，先关闭模态框，再跳转
    closeModal();
    await nextTick();
    await router.replace({ name: 'shop' });
  } else {
    status.error = '验证码无效或已过期，请重试或检查邮件中的链接。';
  }
}

async function handleGithubLogin() {
  closeModal();
  await authStore.signInWithGithub();
}

async function handlePasswordReset() {
  if (!form.email) {
    status.error = '请输入您的邮箱地址以重置密码。';
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);
    return;
  }
  const successful = await _handleSubmit(async () => {
    await authStore.sendPasswordResetEmail(form.email);
  });
  if (successful) {
    status.success = `密码重置链接已发送至 ${form.email}，请查收。`;
  }
}

async function handleResendConfirmation() {
  if (!form.email) {
    status.error = '请输入您的邮箱地址以重新发送邮件。';
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);
    return;
  }
  const successful = await _handleSubmit(async () => {
    await authStore.resendConfirmationEmail(form.email);
  });
  if (successful) {
    status.success = `新的确认邮件已成功发送至 ${form.email}，请查收。`;
    status.showResendLink = false;
  }
}

// --- OTP Input Logic (无修改) ---
function handleOtpInput(e, index) {
  const input = e.target;
  let value = input.value;
  form.otp[index - 1] = value.substring(value.length - 1);
  if (value && index < 6) otpInputRefs.value[index].focus();
}

function handleOtpKeyDown(e, index) {
  if (e.key === 'Backspace' && !form.otp[index - 1] && index > 1) {
    otpInputRefs.value[index - 2].focus();
  }
}

function handleOtpPaste(e) {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text').slice(0, 6);
  if (/^\d{6}$/.test(pastedData)) {
    pastedData.split('').forEach((char, index) => { form.otp[index] = char; });
    otpInputRefs.value[5].focus();
  }
}

// --- Autofocus (无修改) ---
watch(() => props.active, (isActive) => {
  if (isActive) {
    nextTick(() => {
      const target = formMode.value === 'verify' ? otpInputRefs.value[0] : firstInput.value;
      target?.focus();
    });
  }
});
watch(formMode, () => {
  status.error = '';
  status.success = '';
  isShaking.value = false;
  nextTick(() => {
    const target = formMode.value === 'verify' ? otpInputRefs.value[0] : firstInput.value;
    target?.focus();
  });
});
</script>

<template>
  <!-- Template 部分无需任何修改 -->
  <transition name="modal-fade">
    <div v-if="active" class="modal-backdrop" :class="{ 'is-loading': status.loading }" @click.self="closeModal">
      <div :class="['modal-container', { 'is-shaking': isShaking }]" @click.stop>
        <header class="modal-header">
          <h2 class="modal-title" v-if="formMode === 'login'">登录</h2>
          <h2 class="modal-title" v-else-if="formMode === 'register'">创建账户</h2>
          <h2 class="modal-title" v-else>最后一步，激活您的账户</h2>
          <button @click="closeModal" class="close-btn" aria-label="关闭" :disabled="status.loading">&times;</button>
        </header>

        <main class="modal-body">
          <div v-if="formMode === 'verify'">
            <p v-if="status.success" class="success-message">{{ status.success }}</p>
            <div class="info-block">
              <p class="info-text-main">请点击邮件中的 **确认链接** 来完成注册。</p>
              <p class="info-text-secondary">或者，为了方便，您也可以在下方输入邮件中的6位验证码。</p>
            </div>
            <form @submit.prevent="handleVerifyOtp">
              <div class="form-group otp-group" @paste="handleOtpPaste">
                <template v-for="i in 6" :key="i">
                  <input :ref="el => otpInputRefs[i - 1] = el" v-model="form.otp[i-1]" type="text" inputmode="numeric" maxlength="1" class="otp-input" required @input="handleOtpInput($event, i)" @keydown="handleOtpKeyDown($event, i)" />
                </template>
              </div>
              <button type="submit" class="btn btn-primary" :disabled="status.loading">
                <span v-if="status.loading" class="spinner"></span>
                <span v-else>验证并登录</span>
              </button>
            </form>
          </div>
          <form v-else @submit.prevent="formMode === 'login' ? handleLogin() : handleRegister()">
            <div class="form-group">
              <label for="email">邮箱</label>
              <input ref="firstInput" type="email" id="email" v-model="form.email" required autocomplete="email" />
            </div>
            <div class="form-group">
              <div class="label-group">
                <label for="password">密码 <span v-if="formMode === 'register'">(至少6位)</span></label>
                <a v-if="formMode === 'login'" href="#" @click.prevent="handlePasswordReset" class="link-secondary">忘记密码？</a>
              </div>
              <input type="password" id="password" v-model="form.password" required :minlength="formMode === 'register' ? 6 : null" autocomplete="current-password" />
            </div>
            <div v-if="formMode === 'register'" class="form-group">
              <label for="confirmPassword">确认密码</label>
              <input type="password" id="confirmPassword" v-model="form.confirmPassword" required minlength="6" autocomplete="new-password" />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="status.loading">
              <span v-if="status.loading" class="spinner"></span>
              <span v-else>{{ formMode === 'login' ? '登录' : '注册' }}</span>
            </button>
          </form>
          <div class="message-area">
            <p v-if="status.error" class="error-message">{{ status.error }}</p>
            <p v-if="status.success && formMode !== 'verify'" class="success-message">{{ status.success }}</p>
            <a v-if="status.showResendLink && !status.loading" href="#" @click.prevent="handleResendConfirmation" class="link-resend">
              没有收到邮件？点击重新发送
            </a>
          </div>
          <div v-if="formMode !== 'verify'">
            <div class="separator"><span>或</span></div>
            <div class="auth-providers">
              <button @click="handleGithubLogin" class="provider-btn" :disabled="status.loading">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A10,10,0,0,0,2,12C2,16.42,4.87,20.17,8.84,21.5C9.34,21.58,9.5,21.27,9.5,21V19.21C6.73,19.64,6.15,17.92,6.15,17.92C5.69,16.79,5.07,16.5,5.07,16.5C4.17,15.88,5.15,15.9,5.15,15.9C6.12,15.96,6.63,16.93,6.63,16.93C7.5,18.45,8.97,18,9.54,17.76C9.63,17.11,9.89,16.67,10.17,16.42C7.95,16.17,5.62,15.31,5.62,11.5C5.62,10.39,6,9.5,6.65,8.79C6.55,8.54,6.2,7.5,6.75,6.15C6.75,6.15,7.59,5.88,9.5,7.17C10.29,6.95,11.15,6.84,12,6.84C12.85,6.84,13.71,6.95,14.5,7.17C16.41,5.88,17.25,6.15,17.25,6.15C17.8,7.5,17.45,8.54,17.35,8.79C18,9.5,18.38,10.39,18.38,11.5C18.38,15.32,16.04,16.16,13.81,16.41C14.17,16.72,14.5,17.33,14.5,18.26V21C14.5,21.27,14.66,21.59,15.17,21.5C19.14,20.16,22,16.42,22,12A10,10,0,0,0,12,2Z"/></svg>
                <span>使用 GitHub 继续</span>
              </button>
            </div>
          </div>
        </main>
        <footer class="modal-footer" v-if="formMode !== 'verify'">
          <p v-if="formMode === 'login'">
            还没有账户？ <a href="#" @click.prevent="formMode = 'register'">立即注册</a>
          </p>
          <p v-else>
            已有账户？ <a href="#" @click.prevent="formMode = 'login'">返回登录</a>
          </p>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
/* Style 部分无需任何修改 */
@use '@/assets/styles/index.scss' as *;
@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
  .modal-container { transition: transform 0.3s ease; }
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  .modal-container { transform: scale(0.95); }
}
.is-shaking { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }

.modal-backdrop {
  position: fixed; inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;
  padding: 1rem;
  &.is-loading { cursor: wait; }
}
.modal-container {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.modal-header {
  padding: 1rem 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--color-border);
}
.modal-title {
  font-size: 1.25rem;
  color: var(--color-heading);
  margin: 0;
}
.close-btn {
  background: none; border: none; font-size: 2rem;
  color: var(--color-text-dark);
  cursor: pointer; line-height: 1;
  transition: color 0.2s, opacity 0.2s;
  &:hover:not(:disabled) { color: var(--color-primary); }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover { color: var(--color-text-dark); }
  }
}
.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1rem 1.5rem;
  background-color: var(--color-background-mute);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 0.9rem;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  p { margin: 0; color: var(--color-text-dark); }
  a {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
    &:hover { text-decoration: underline;}
  }
}

.form-group { margin-bottom: 1.25rem; }
.label-group {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem;
}
label {
  display: block; font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 500;
  span { font-weight: 400; color: var(--color-text-dark); }
}
input {
  width: 100%; padding: 0.75rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border-hover);
  border-radius: 8px; color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
  }
}

.otp-group { display: flex; gap: 0.5rem; justify-content: center; }
.otp-input {
  width: 45px; height: 50px; text-align: center;
  font-size: 1.75rem; font-weight: 600;
  padding: 0.5rem;
}

.btn.btn-primary {
  width: 100%; padding: 0.8rem;
  background-color: var(--color-primary);
  color: #1a1a1a;
  border: none; border-radius: 8px;
  font-weight: 600; cursor: pointer;
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background-color: var(--color-primary-dark); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.link-secondary {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  text-decoration: none;
  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }
}
.link-resend {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

.message-area { min-height: 24px; margin-top: 1rem; text-align: center; }
.error-message, .success-message {
  padding: 0.75rem; border-radius: 8px;
  font-size: 0.9rem;
  margin: 0 0 1rem;
  line-height: 1.5;
  text-align: left;
}
.error-message {
  color: #f87171;
  background-color: rgba(248, 113, 113, 0.1);
}
.success-message {
  color: #4ade80;
  background-color: rgba(74, 222, 128, 0.1);
}

.info-block {
  margin: 1rem 0 1.5rem;
  padding: 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: center;
}
.info-text-main {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0 0 0.5rem;
  line-height: 1.6;
}
.info-text-secondary {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  margin: 0;
  line-height: 1.6;
}

.separator {
  display: flex; align-items: center; text-align: center;
  margin: 1.5rem 0;
  color: var(--color-text-dark);
  &::before, &::after {
    content: ''; flex: 1;
    border-bottom: 1px solid var(--color-border);
  }
  span { padding: 0 1rem; }
}
.provider-btn {
  width: 100%; padding: 0.75rem 1.5rem;
  border-radius: 8px; border: 1px solid var(--color-border);
  background: transparent; color: var(--color-heading);
  font-weight: 500; cursor: pointer;
  display: flex; justify-content: center; align-items: center;
  gap: 0.75rem;
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background-color: var(--color-background-mute); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.spinner {
  display: inline-block; width: 1.2em; height: 1.2em;
  border: 2px solid currentColor; border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
