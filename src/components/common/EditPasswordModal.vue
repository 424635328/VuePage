<!-- src/components/common/EditPasswordModal.vue -->
<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-panel">
        <header class="modal-header">
          <h2><BaseIcon name="pencil"/> 编辑条目</h2>
          <button @click="$emit('close')" class="close-btn" title="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4148L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>
          </button>
        </header>

        <main class="modal-body">
          <form @submit.prevent="handleSave" class="edit-form">

            <div class="form-group floating-label">
              <input id="platform" type="text" v-model="editableItem.platform" placeholder=" " required />
              <label for="platform">平台 (例如: Google, Github)</label>
            </div>

            <div class="form-group floating-label">
              <input id="label" type="text" v-model="editableItem.label" placeholder=" " />
              <label for="label">标签 / 用户名 (选填)</label>
            </div>

            <div class="form-group password-group floating-label">
              <input
                id="password"
                :type="isPasswordVisible ? 'text' : 'password'"
                v-model="editableItem.password"
                placeholder=" "
                required
              />
              <label for="password">密码</label>
              <div class="password-actions">
                <button type="button" @click="generateInModal" class="action-btn" title="生成新密码">
                  <BaseIcon name="refresh" />
                </button>
                <button type="button" @click="isPasswordVisible = !isPasswordVisible" class="action-btn" title="显示/隐藏密码">
                  <BaseIcon :name="isPasswordVisible ? 'eye-slash' : 'eye'" />
                </button>
              </div>
            </div>

            <div class="form-group floating-label">
              <textarea id="notes" v-model="editableItem.notes" rows="3" placeholder=" "></textarea>
              <label for="notes">备注 (选填)</label>
            </div>

          </form>
        </main>

        <footer class="modal-footer">
          <button @click="$emit('close')" class="btn btn-secondary">取消</button>
          <button @click="handleSave" class="btn btn-primary" :disabled="!isSaveable">
            <BaseIcon name="check"/>
            <span>保存更改</span>
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { usePasswordStore } from '@/stores/password';
import BaseIcon from '@/components/common/BaseIcon.vue';

const props = defineProps({
  show: Boolean,
  item: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save']);

const store = usePasswordStore();

const editableItem = ref({});
const isPasswordVisible = ref(false);

watch(() => props.show, (newVal) => {
  if (newVal && props.item) {
    // 模态框显示时，克隆数据并重置密码可见性
    editableItem.value = JSON.parse(JSON.stringify(props.item));
    isPasswordVisible.value = false;
  }
});

const isSaveable = computed(() => {
  return editableItem.value.platform?.trim() && editableItem.value.password?.trim();
});

function handleSave() {
  if (!isSaveable.value) return;
  const { ...updates } = editableItem.value;
  emit('save', updates);
  emit('close');
}

function generateInModal() {
  store.generateNewPassword();
  editableItem.value.password = store.currentGenerated.password;
}
</script>

<style lang="scss" scoped>
/* 继承全局颜色变量 */
:root {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --accent-color: #34d399;
  --primary-action: #3b82f6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(10, 15, 25, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-panel {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // 美化核心：渐变背景 + 边框 + 辉光
  background: radial-gradient(ellipse at top, var(--bg-secondary), var(--bg-primary));
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(148, 163, 184, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      width: 1.5rem;
      height: 1.5rem;
      color: var(--primary-action);
    }
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid transparent;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    svg { width: 20px; height: 20px; }

    &:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.1);
      transform: rotate(90deg);
      border-color: rgba(148, 163, 184, 0.2);
    }
  }
}

.modal-body {
  padding: 1.75rem;
  overflow-y: auto;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

// 美化核心：浮动标签输入框
.form-group.floating-label {
  position: relative;

  input, textarea {
    width: 100%;
    padding: 1.25rem 1rem 0.5rem 1rem;
    background-color: rgba(17, 24, 39, 0.8);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: var(--primary-action);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25), inset 0 2px 4px rgba(0,0,0,0.2);
    }
  }

  label {
    position: absolute;
    left: 1rem;
    top: 0.9rem;
    color: var(--text-secondary);
    font-size: 1rem;
    pointer-events: none;
    transition: all 0.2s ease-out;
  }

  // 动画效果
  input:focus + label,
  input:not(:placeholder-shown) + label,
  textarea:focus + label,
  textarea:not(:placeholder-shown) + label {
    top: 0.4rem;
    font-size: 0.75rem;
    color: var(--primary-action);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.password-group {
  .password-actions {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    transition: all 0.2s;

    svg { width: 1.25rem; height: 1.25rem; }

    &:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg { width: 1.1rem; height: 1.1rem; }

  &.btn-secondary {
    background-color: var(--bg-tertiary);
    color: var(--text-secondary);
    border-color: var(--border-color);
    &:hover {
      background-color: #4b5563;
      color: var(--text-primary);
      border-color: #4b5563;
    }
  }

  &.btn-primary {
    background-image: linear-gradient(to right, var(--primary-action), #2563eb);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);

    &:hover:not(:disabled) {
      filter: brightness(1.15);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
    }
    &:disabled {
      background: var(--bg-tertiary);
      background-image: none;
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}

// 动画
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition: all 0.3s cubic-bezier(0.52, 0.02, 0.19, 1.02);
}
.modal-fade-enter-from .modal-panel,
.modal-fade-leave-to .modal-panel {
  transform: scale(0.95) translateY(20px);
}
</style>
