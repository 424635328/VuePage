<!-- src/views/ContactPage.vue -->

<template>
  <div class="contact-page">
    <h1 class="page-title">联系我</h1>
    <p class="page-description">如果您对我感兴趣，或有任何问题，欢迎通过以下方式与我联系。</p>

    <div class="contact-info">
      <p><strong>邮箱:</strong> <a href="mailto:your.email@example.com">your.email@example.com</a></p>
      <p><strong>GitHub:</strong> <a href="https://github.com/your-username" target="_blank">github.com/your-username</a></p>
    </div>

    <form @submit.prevent="handleSubmit" class="contact-form">
      <h2 class="form-title">或者给我留言</h2>
      <div class="form-group">
        <label for="name">您的名字</label>
        <input type="text" id="name" v-model="form.name" required>
      </div>
      <div class="form-group">
        <label for="email">您的邮箱</label>
        <input type="email" id="email" v-model="form.email" required>
      </div>
      <div class="form-group">
        <label for="message">留言内容</label>
        <textarea id="message" rows="5" v-model="form.message" required></textarea>
      </div>
      <button type="submit" class="submit-button">发送</button>
      <p v-if="submitted" class="success-message">感谢您的留言！</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const form = ref({
  name: '',
  email: '',
  message: '',
});

const submitted = ref(false);

const handleSubmit = () => {
  // 纯前端演示，不实际发送
  console.log('Form data:', form.value);
  submitted.value = true;

  // 3秒后重置表单和提示
  setTimeout(() => {
    submitted.value = false;
    form.value = { name: '', email: '', message: '' };
  }, 3000);
};
</script>

<style lang="scss" scoped>
.page-title { text-align: center; font-size: 2.5rem; margin-bottom: 1rem; }
.page-description { text-align: center; max-width: 600px; margin: 0 auto 3rem; color: var(--color-text); }

.contact-info {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 1.1rem;

  p { margin-bottom: 0.5rem; }
  a { color: var(--color-primary); text-decoration: none; &:hover { text-decoration: underline; } }
}

.contact-form {
  max-width: 600px;
  margin: 0 auto;
  background: var(--color-background-soft);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.form-title { font-size: 1.5rem; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.5rem; }

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
  }
}

textarea { resize: vertical; }

.submit-button {
  width: 100%;
  padding: 0.8rem;
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover { background-color: var(--color-primary-dark); }
}

.success-message {
  margin-top: 1rem;
  text-align: center;
  color: var(--color-primary);
}
</style>
