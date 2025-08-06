<!-- src/components/auth/AuthModal.vue -->

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';

defineProps({ active: Boolean });
const emit = defineEmits(['update:active', 'close', 'loggedIn']);

const authStore = useAuthStore();

// --- State Management ---
const formMode = ref('login'); // 'login', 'register', or 'verify'
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ email: '', password: '', confirmPassword: '' });
const otpCode = ref('');

const isShaking = ref(false);
const showResendLink = ref(false);

// --- Utility Functions ---
function closeModal() {
  emit('update:active', false);
  emit('close');
  setTimeout(() => {
    formMode.value = 'login';
    errorMessage.value = '';
    successMessage.value = '';
    isShaking.value = false;
    showResendLink.value = false;
    otpCode.value = '';
    Object.assign(loginForm, { email: '', password: '' });
    Object.assign(registerForm, { email: '', password: '', confirmPassword: '' });
  }, 300);
}

// --- Logic Handlers ---
async function handleLogin() {
  loading.value = true;
  await nextTick();

  errorMessage.value = '';
  successMessage.value = '';
  showResendLink.value = false;

  try {
    await authStore.signInWithPassword({ ...loginForm });
    emit('loggedIn');
    closeModal();
  } catch (error) {
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);

    if (error.message.includes('Email not confirmed')) {
      errorMessage.value = '您的账户尚未激活，请检查邮箱。';
      showResendLink.value = true;
    } else {
      errorMessage.value = '登录失败，请检查您的邮箱和密码。';
    }
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  if (registerForm.password !== registerForm.confirmPassword) {
    errorMessage.value = '两次输入的密码不匹配。'; return;
  }
  if (registerForm.password.length < 6) {
    errorMessage.value = '密码至少需要6个字符。'; return;
  }

  loading.value = true;
  await nextTick();

  errorMessage.value = '';
  try {
    await authStore.signUp({ email: registerForm.email, password: registerForm.password });
    formMode.value = 'verify';
  } catch (error) {
    errorMessage.value = error.message || '注册失败，该邮箱可能已被使用。';
  } finally {
    loading.value = false;
  }
}

async function handleVerifyOtp() {
  if (otpCode.value.length !== 6) {
    errorMessage.value = '请输入一个有效的6位数验证码。';
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);
    return;
  }

  loading.value = true;
  await nextTick();

  errorMessage.value = '';
  try {
    await authStore.verifyOtp(registerForm.email, otpCode.value);
    emit('loggedIn');
    closeModal();
  } catch(error) {
    // ✨ FIX: Using the 'error' variable to provide a more specific message
    errorMessage.value = error.message || '验证码无效或已过期，请重试。';
    isShaking.value = true;
    setTimeout(() => isShaking.value = false, 500);
  } finally {
    loading.value = false;
  }
}

async function handleGithubLogin() {
  await authStore.signInWithGithub();
  closeModal();
  emit('loggedIn');
}

async function handlePasswordReset() {
  if (!loginForm.email) {
    errorMessage.value = '请输入您的邮箱地址以重置密码。';
    isShaking.value = true; setTimeout(() => isShaking.value = false, 500);
    return;
  }
  loading.value = true;
  await nextTick();

  errorMessage.value = '';
  successMessage.value = '';
  try {
    await authStore.sendPasswordResetEmail(loginForm.email);
    successMessage.value = `密码重置链接已发送至 ${loginForm.email}，请查收。`;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function handleResendConfirmation() {
  if (!loginForm.email) {
    errorMessage.value = '请输入您的邮箱地址以重新发送邮件。';
    isShaking.value = true; setTimeout(() => isShaking.value = false, 500);
    return;
  }
  loading.value = true;
  await nextTick();

  errorMessage.value = '';
  successMessage.value = '';
  try {
    await authStore.resendConfirmationEmail(loginForm.email);
    successMessage.value = `新的确认邮件已发送至 ${loginForm.email}，请查收。`;
    showResendLink.value = false;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="active" class="modal-backdrop">
      <div class="modal-container">
        <header class="modal-header">
          <h2 v-if="formMode === 'login'">登录</h2>
          <h2 v-else-if="formMode === 'register'">创建账户</h2>
          <h2 v-else-if="formMode === 'verify'">输入验证码</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </header>

        <main class="modal-body">
          <!-- View 1: OTP Verification -->
          <div v-if="formMode === 'verify'" class="verify-view">
            <p class="verify-info">我们已向 <strong>{{ registerForm.email }}</strong> 发送了一个6位数验证码，请在下方输入以完成注册。</p>
            <form @submit.prevent="handleVerifyOtp" :class="{ 'is-shaking': isShaking }">
              <div class="form-group">
                <input
                  type="text"
                  id="otp-code"
                  class="otp-input"
                  v-model="otpCode"
                  required
                  maxlength="6"
                  autocomplete="one-time-code"
                  pattern="\d{6}"
                  placeholder="------"
                />
              </div>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner"></span><span v-else>验证并登录</span>
              </button>
            </form>
          </div>

          <!-- View 2: Login Form -->
          <form v-else-if="formMode === 'login'" @submit.prevent="handleLogin" :class="{ 'is-shaking': isShaking }">
            <div class="form-group">
              <label for="login-email">邮箱</label>
              <input type="email" id="login-email" v-model="loginForm.email" required autocomplete="email" />
            </div>
            <div class="form-group">
              <div class="label-group">
                <label for="login-password">密码</label>
                <a href="#" @click.prevent="handlePasswordReset" class="link-secondary">忘记密码？</a>
              </div>
              <input type="password" id="login-password" v-model="loginForm.password" required autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner"></span><span v-else>登录</span>
            </button>
          </form>

          <!-- View 3: Register Form -->
          <form v-else @submit.prevent="handleRegister">
            <div class="form-group">
              <label for="reg-email">邮箱</label>
              <input type="email" id="reg-email" v-model="registerForm.email" required autocomplete="email"/>
            </div>
            <div class="form-group">
              <label for="reg-password">密码 (至少6位)</label>
              <input type="password" id="reg-password" v-model="registerForm.password" required minlength="6" autocomplete="new-password"/>
            </div>
            <div class="form-group">
              <label for="reg-confirm-password">确认密码</label>
              <input type="password" id="reg-confirm-password" v-model="registerForm.confirmPassword" required minlength="6" autocomplete="new-password"/>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner"></span><span v-else>注册</span>
            </button>
          </form>

          <!-- Dynamic Message Area -->
          <div class="message-area" v-if="formMode !== 'verify'">
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
            <a v-if="showResendLink && !loading" href="#" @click.prevent="handleResendConfirmation" class="link-resend">
              没有收到邮件？点击重新发送
            </a>
          </div>
          <!-- OTP view has its own message display -->
           <div class="message-area" v-if="formMode === 'verify'">
             <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
           </div>


          <!-- Separator & GitHub Login -->
          <div v-if="formMode !== 'verify'">
            <div class="separator"><span>或</span></div>
            <div class="auth-providers">
              <button @click="handleGithubLogin" class="provider-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A10,10,0,0,0,2,12C2,16.42,4.87,20.17,8.84,21.5C9.34,21.58,9.5,21.27,9.5,21V19.21C6.73,19.64,6.15,17.92,6.15,17.92C5.69,16.79,5.07,16.5,5.07,16.5C4.17,15.88,5.15,15.9,5.15,15.9C6.12,15.96,6.63,16.93,6.63,16.93C7.5,18.45,8.97,18,9.54,17.76C9.63,17.11,9.89,16.67,10.17,16.42C7.95,16.17,5.62,15.31,5.62,11.5C5.62,10.39,6,9.5,6.65,8.79C6.55,8.54,6.2,7.5,6.75,6.15C6.75,6.15,7.59,5.88,9.5,7.17C10.29,6.95,11.15,6.84,12,6.84C12.85,6.84,13.71,6.95,14.5,7.17C16.41,5.88,17.25,6.15,17.25,6.15C17.8,7.5,17.45,8.54,17.35,8.79C18,9.5,18.38,10.39,18.38,11.5C18.38,15.32,16.04,16.16,13.81,16.41C14.17,16.72,14.5,17.33,14.5,18.26V21C14.5,21.27,14.66,21.59,15.17,21.5C19.14,20.16,22,16.42,22,12A10,10,0,0,0,12,2Z"/></svg>
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
/* Shake Animation */
@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}

form.is-shaking {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

/* Base Modal Styles */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-backdrop {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;
}
.modal-container {
  background-color: #1e1e1e;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 90%; max-width: 420px;
  display: flex; flex-direction: column;
}
.modal-header {
  padding: 1rem 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--color-border);
  h2 { font-size: 1.25rem; color: var(--color-heading); }
}
.close-btn { background: none; border: none; font-size: 2rem; color: var(--color-text); cursor: pointer; line-height: 1; }
.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1rem 1.5rem;
  background-color: #242424;
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 0.9rem;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  p { margin: 0; color: var(--color-text-dark); }
  a { color: var(--color-primary); font-weight: 600; text-decoration: none; &:hover { text-decoration: underline;} }
}

/* Form Styles */
.form-group {
  margin-bottom: 1.25rem;
  .label-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  label {
    display: block;
    font-size: 0.9rem;
    color: var(--color-text-dark);
  }
  input {
    width: 100%; padding: 0.75rem;
    background-color: #2a2a2a; border: 1px solid var(--color-border);
    border-radius: 8px; color: var(--color-text); font-size: 1rem;
    transition: border-color 0.2s;
    &:focus { border-color: var(--color-primary); outline: none; }
  }
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

.btn.btn-primary {
  width: 100%; padding: 0.8rem;
  background-color: var(--color-primary); color: #1a1a1a;
  border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background-color: var(--color-primary-dark); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.spinner {
  display: inline-block; width: 1.2em; height: 1.2em;
  border: 2px solid currentColor; border-top-color: transparent;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}

/* Message & Provider Styles */
.message-area {
  min-height: 24px;
  margin-top: 1rem;
  text-align: center;
}
.error-message, .success-message {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin: 0 0 0.5rem;
}
.error-message {
  color: #f87171;
  background-color: rgba(248, 113, 113, 0.1);
}
.success-message {
  color: #4ade80;
  background-color: rgba(74, 222, 128, 0.1);
}
.link-resend {
  font-size: 0.9rem;
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.separator {
  display: flex; align-items: center; text-align: center;
  margin: 1.5rem 0; color: var(--color-text-dark);
  &::before, &::after {
    content: ''; flex: 1; border-bottom: 1px solid var(--color-border);
  }
  span { padding: 0 1rem; }
}
.provider-btn {
  width: 100%; padding: 0.8rem 1.5rem;
  border-radius: 8px; border: 1px solid var(--color-border);
  background: transparent; color: var(--color-heading); font-weight: 500;
  cursor: pointer; display: flex; justify-content: center; align-items: center;
  gap: 0.75rem; transition: background-color 0.2s;
  &:hover { background: #2a2a2a; }
}

/* OTP Verification View Styles */
.verify-view {
  text-align: center;
  .verify-info {
    color: var(--color-text-dark);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  .otp-input {
    text-align: center;
    font-size: 1.75rem;
    font-weight: 600;
    letter-spacing: 0.5rem;
    color: var(--color-heading);
    padding: 0.75rem;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}
</style>
