<!-- src/components/cdk/CdkEditModal.vue -->

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click.self="close">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-labelledby="modalTitleId">
        <!-- 1. 模态框头部 -->
        <header class="modal-header">
          <h2 :id="modalTitleId" class="modal-title">{{ isEditing ? '编辑 CDK' : '添加新 CDK' }}</h2>
          <button class="close-btn" @click="close" aria-label="关闭模态框">&times;</button>
        </header>

        <!-- 2. 主体内容与表单 -->
        <main class="modal-body">
          <form @submit.prevent="handleSubmit" novalidate>
            <!-- 名称输入框 -->
            <div class="form-group">
              <label for="cdk-name">名称</label>
              <input
                id="cdk-name"
                ref="nameInput"
                v-model.trim="form.name"
                type="text"
                placeholder="例如: Office 365 家庭版"
                required
                class="form-input"
              />
            </div>

            <!-- CDK/卡密输入框 -->
            <div class="form-group">
              <label for="cdk-key">CDK / 卡密</label>
              <textarea
                id="cdk-key"
                v-model.trim="form.cdk_key"
                rows="4"
                placeholder="输入或粘贴您的卡密"
                required
                class="form-input"
              ></textarea>
            </div>

            <!-- 3. 模态框底部与操作按钮 -->
            <footer class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="close">取消</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting || !isFormValid">
                <span v-if="isSubmitting" class="spinner"></span>
                {{ isSubmitting ? '保存中...' : '确认保存' }}
              </button>
            </footer>
          </form>
        </main>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'

// --- Props & Emits ---
const props = defineProps({
  // v-model 控制模态框的显示与隐藏
  modelValue: {
    type: Boolean,
    required: true,
  },
  // 传入的 CDK 对象，为 null 时表示“添加”模式
  cdk: {
    type: Object,
    default: null,
  },
  // 由父组件控制的提交状态，用于禁用按钮和显示 spinner
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

// --- 内部状态 ---
const form = ref({
  name: '',
  cdk_key: '',
})

// 用于自动聚焦
const nameInput = ref(null)

// --- 计算属性 ---
const isEditing = computed(() => !!props.cdk)
const modalTitleId = computed(() => `modal-title-${Date.now()}`) // 保证可访问性 ID 唯一
const isFormValid = computed(() => {
  return form.value.name.length > 0 && form.value.cdk_key.length > 0
})

// --- 侦听器 ---
// 监听 modelValue 的变化，当模态框打开时
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // 如果是编辑模式，用传入的 cdk 数据填充表单
      if (props.cdk) {
        form.value = { name: props.cdk.name, cdk_key: props.cdk.cdk_key }
      } else {
        // 否则，重置为空表单（添加模式）
        form.value = { name: '', cdk_key: '' }
      }

      // 使用 nextTick 确保 DOM 元素已渲染，然后聚焦到第一个输入框
      nextTick(() => {
        if (nameInput.value) {
          nameInput.value.focus()
        }
      })
    }
  }
)

// --- 方法 ---
const close = () => {
  // 通知父组件关闭模态框
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  // 如果表单无效或正在提交，则不执行任何操作
  if (!isFormValid.value || props.isSubmitting) {
    return
  }
  // 触发 save 事件，并将表单数据传递给父组件
  emit('save', { ...form.value })
}
</script>

<style lang="scss" scoped>
/* 遵循您项目的设计系统，这是一个现代、深色主题的示例 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 10, 20, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #1a1a2e; /* 深邃的背景色 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
  transform: scale(1);
  transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.modal-header {
  padding: 1.25rem 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #ffffff;
    transform: rotate(90deg);
  }
}

.modal-body {
  padding: 1.75rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.8rem 1rem;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #42b883; /* Vue Green */
    box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.3);
  }
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  padding: 1.25rem 1.75rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.btn-primary {
  background-color: #42b883;
  color: white;

  &:hover {
    background-color: #369b6e;
  }

  &:disabled {
    background-color: #555;
    color: #999;
    cursor: not-allowed;
  }
}

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}

.modal-fade-enter-from .modal-content {
  transform: scale(0.9);
}

.modal-fade-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
