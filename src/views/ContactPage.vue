<!-- src/views/ContactPage.vue -->

<script setup>
import { ref, computed, reactive } from 'vue'
import { useToastStore } from '@/stores/toast'

// --- 状态管理 ---

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const isLoading = ref(false)
const errors = ref({})
const toastStore = useToastStore()

// [UX 优化] 追踪字段是否被“触碰”过，用于实现更智能的验证
const touched = reactive({
  name: false,
  email: false,
  message: false,
})


// --- 计算属性 ---

// [优化] 一个集中的计算属性，决定提交按钮是否应被禁用
const isSubmitDisabled = computed(() => {
  // 在加载时，或任何必填项为空，或存在任何验证错误时，禁用按钮
  return isLoading.value || !form.value.name || !form.value.email || !form.value.message || Object.keys(errors.value).length > 0
})


// --- 方法 ---

/**
 * [已修正 & 优化] 验证单个字段的核心逻辑
 * 如果字段有效，则从 errors 对象中删除对应的键。
 * 如果无效，则添加一个带错误消息的键。
 */
const validateField = (field) => {
  // 检查必填项
  const isRequired = field === 'name' || field === 'email' || field === 'message'
  if (isRequired && !form.value[field]) {
    errors.value[field] = '此字段为必填项。'
    return
  }

  // 检查邮箱格式
  if (field === 'email' && form.value.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.value.email)) {
      errors.value.email = '请输入有效的邮箱地址。'
      return
    }
  }

  // 如果以上检查都通过，则删除该字段的错误记录
  delete errors.value[field]
}

/**
 * [UX 优化] 处理失焦事件
 * 标记字段为已“触碰”，并立即进行一次验证
 */
const handleBlur = (field) => {
  touched[field] = true
  validateField(field)
}

/**
 * [UX 优化] 处理输入事件
 * 如果字段已经被“触碰”过（即出现过一次错误），则在用户输入时进行实时验证
 */
const handleInput = (field) => {
  if (touched[field]) {
    validateField(field)
  }
}

/**
 * [已修正 & 优化] 处理表单提交
 */
const handleSubmit = async () => {
  // [UX 优化] 提交时，将所有字段标记为已触碰并执行验证，以显示所有错误
  Object.keys(touched).forEach(field => {
    touched[field] = true
    validateField(field)
  })

  // 如果验证后仍有错误，则中止
  if (Object.keys(errors.value).length > 0) {
    toastStore.showToast({
      message: '请修正表单中的错误后重试。',
      type: 'error',
    })
    return
  }

  isLoading.value = true

  // 模拟后端 API 调用
  await new Promise(resolve => setTimeout(resolve, 1500))

  try {
    console.log('Form Submitted:', form.value)
    toastStore.showToast({
      message: '消息已发送！感谢您的联系。',
      type: 'success',
    })

    // [优化] 成功后完全重置表单状态
    form.value = { name: '', email: '', subject: '', message: '' }
    errors.value = {}
    Object.keys(touched).forEach(field => { touched[field] = false })

  } catch (error) {
    // [已修正] 确保 toast 类型是正确的字符串
    toastStore.showToast({
      message: '发送失败，请稍后重试。',
      type: error instanceof Error ? 'error' : 'info', // 确保类型是字符串
      error: error instanceof Error ? error.message : '未知错误',
      timeout: 5000,
      position: 'top-right',
      icon: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="contact-page">
    <div class="container">
      <section class="page-header">
        <h1 class="page-title">联系我们</h1>
        <p class="page-subtitle">我们随时准备好倾听您的想法、项目需求或任何疑问。请通过以下方式与我们取得联系。</p>
      </section>

      <div class="contact-content-grid">
        <div class="contact-form-wrapper">
          <h2 class="section-title">发送消息</h2>
          <form @submit.prevent="handleSubmit" novalidate>
            <!-- 姓名输入框 -->
            <div class="form-group">
              <label for="name">您的姓名</label>
              <input
                id="name"
                v-model.trim="form.name"
                type="text"
                placeholder="例如：王先生"
                required
                :class="{ 'is-invalid': errors.name }"
                :aria-invalid="!!errors.name"
                @blur="handleBlur('name')"
                @input="handleInput('name')"
              />
              <span v-if="errors.name" class="error-message" aria-live="polite">{{ errors.name }}</span>
            </div>

            <!-- 邮箱输入框 -->
            <div class="form-group">
              <label for="email">您的邮箱</label>
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                placeholder="例如：your.email@example.com"
                required
                :class="{ 'is-invalid': errors.email }"
                :aria-invalid="!!errors.email"
                @blur="handleBlur('email')"
                @input="handleInput('email')"
              />
              <span v-if="errors.email" class="error-message" aria-live="polite">{{ errors.email }}</span>
            </div>

            <!-- 主题输入框 -->
            <div class="form-group">
              <label for="subject">主题 (可选)</label>
              <input
                id="subject"
                v-model.trim="form.subject"
                type="text"
                placeholder="例如：关于项目合作的咨询"
              />
            </div>

            <!-- 消息文本域 -->
            <div class="form-group">
              <label for="message">消息内容</label>
              <textarea
                id="message"
                v-model.trim="form.message"
                rows="6"
                placeholder="请在此详细描述您的需求..."
                required
                :class="{ 'is-invalid': errors.message }"
                :aria-invalid="!!errors.message"
                @blur="handleBlur('message')"
                @input="handleInput('message')"
              ></textarea>
              <span v-if="errors.message" class="error-message" aria-live="polite">{{ errors.message }}</span>
            </div>

            <!-- 提交按钮 -->
            <button type="submit" class="cta-button" :disabled="isSubmitDisabled">
              <span v-if="isLoading">发送中...</span>
              <span v-else>立即发送</span>
            </button>
          </form>
        </div>

        <aside class="contact-info-wrapper">
          <div class="contact-info-block">
            <h3 class="section-title">直接联系</h3>
            <ul class="contact-list">
              <li>
                <i class="icon-email"></i>
                <span><strong>邮箱:</strong> <a href="mailto:miraclehcat@gmail.com">miraclehcat@gmail.com</a></span>
              </li>
              <li>
                <i class="icon-phone"></i>
                <span><strong>电话:</strong> <a href="tel:+8612345678900">(+86) 123-4567-8900</a></span>
              </li>
              <li>
                <i class="icon-location"></i>
                <span><strong>地址:</strong> 中国上海市未来科技区创新大道 123 号</span>
              </li>
            </ul>
          </div>

          <div class="contact-info-block">
            <h3 class="section-title">关注我们</h3>
            <div class="social-links">
              <a href="https://github.com/424635328" target="_blank" aria-label="GitHub">GitHub</a>
              <a href="#" target="_blank" aria-label="LinkedIn">LinkedIn</a>
              <a href="#" target="_blank" aria-label="Twitter">Twitter</a>
            </div>
          </div>

          <div class="map-placeholder">
            <span>地图加载区域</span>
            <p>MHStudio Location</p>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
// [集成] 引入项目定义的全局样式和变量
@use '@/assets/styles/index.scss' as *;

.contact-page {
  padding: 4rem 0;
  animation: fadeIn 0.8s ease-out;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.page-subtitle {
  font-size: 1.125rem;
  max-width: 650px;
  margin: 0 auto;
  color: var(--color-text-muted);
}

.contact-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 4rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 2rem;
  position: relative;
  padding-bottom: 0.5rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background-color: var(--color-primary);
  }
}

// 表单样式
.contact-form-wrapper form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background-color: rgba(26, 26, 26, 0.8);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.2);
  }

  &::placeholder {
    color: var(--color-text-muted);
  }
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

// 错误状态
.form-group .is-invalid {
  border-color: var(--color-error);
}

.error-message {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: block;
}

// 提交按钮
.cta-button {
  display: inline-block;
  background-color: var(--color-primary);
  color: #1a1a1a;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s, opacity 0.3s;
  align-self: flex-start; // 左对齐

  &:hover {
    background-color: var(--color-primary-dark);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 右侧联系信息
.contact-info-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1rem;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.3s;
    &:hover {
      color: var(--color-primary-dark);
      text-decoration: underline;
    }
  }
}

.social-links {
  display: flex;
  gap: 1rem;
  a {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text);
    text-decoration: none;
    transition: background-color 0.3s, border-color 0.3s;

    &:hover {
      background-color: var(--color-border);
      border-color: var(--color-primary);
    }
  }
}

// 地图占位符
.map-placeholder {
  width: 100%;
  aspect-ratio: 16 / 10;
  background-color: rgba(26, 26, 26, 0.8);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--color-text-muted);

  span {
    font-weight: 500;
  }

  p {
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
}


// [响应式布局]
@media (max-width: $breakpoint-md) {
  .page-title {
    font-size: 2.5rem;
  }

  .contact-content-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .contact-info-wrapper {
    // 在移动端，让联系信息显示在表单下方，符合通用浏览顺序
    order: 1;
  }
}

// Keyframes for fade-in animation
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
