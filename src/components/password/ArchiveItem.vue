<!-- src/components/password/ArchiveItem.vue -->

<template>
  <div class="archive-item">
    <div class="item-main">
      <div class="item-info">
        <strong class="platform">{{ item.platform }}</strong>
        <span v-if="item.label" class="label">{{ item.label }}</span>
        <div class="password-field" @click="togglePasswordVisibility" title="点击显示/隐藏密码">
          <span v-if="!isPasswordVisible" class="password-masked">••••••••••••</span>
          <span v-else class="password-visible">{{ item.password }}</span>
        </div>
      </div>
      <div class="item-actions">
        <button @click.stop="copyItemPassword" class="action-btn" :title="copied ? '已复制!' : '复制密码'">
          <i :class="['fas', copied ? 'fa-check' : 'fa-copy']"></i>
        </button>
        <!-- [已修改] 点击时不再调用 confirmDelete，而是显示模态框 -->
        <button @click.stop="showDeleteConfirm = true" class="action-btn delete-btn" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div v-if="item.notes" class="item-notes">
      <p><strong>备注:</strong> {{ item.notes }}</p>
    </div>

    <!-- [新增] 集成您的通用确认模态框组件 -->
    <ConfirmModal
      :show="showDeleteConfirm"
      title="确认删除密码"
      :message="`您确定要永久删除 “${item.platform}” 的密码吗？此操作不可撤销。`"
      confirmText="确认删除"
      cancelText="取消"
      @close="showDeleteConfirm = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useClipboard } from '@vueuse/core'
import { useToast } from '@/composables/useToast'
// [新增] 导入您的通用确认模态框组件
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const props = defineProps({
  item: { type: Object, required: true }
})

const store = usePasswordStore()
const { copy, copied } = useClipboard({ timeout: 2000 })
const { addToast } = useToast()

const isPasswordVisible = ref(false)
let visibilityTimer = null

// [新增] 控制模态框显示的状态
const showDeleteConfirm = ref(false)

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value

  clearTimeout(visibilityTimer)
  if (isPasswordVisible.value) {
    visibilityTimer = setTimeout(() => {
      isPasswordVisible.value = false
    }, 5000)
  }
}

function copyItemPassword() {
  copy(props.item.password)
  addToast({ message: `"${props.item.platform}" 的密码已复制`, type: 'success' })
}

/**
 * [已重构] 当用户在模态框中点击“确认”时，此函数被调用
 */
async function handleDeleteConfirm() {
  // 先关闭模态框
  showDeleteConfirm.value = false;
  try {
    // 调用 store 的删除 action
    await store.deletePassword(props.item.id)
    // 显示成功提示
    addToast({ message: '密码已成功删除', type: 'info' })
  } catch (error) {
    // 显示失败提示
    addToast({ message: error.message || '删除失败，请重试。', type: 'error' })
  }
}
</script>

<style lang="scss" scoped>
/* 此组件的所有样式与上一版完全相同，无需任何改动 */
.archive-item {
  background: #2E2D3D;
  border: 1px solid #313042;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    background: #393850;
    border-color: #4a4960;
  }
}
.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;

  .platform { font-size: 1.1rem; color: #fff; font-weight: 500; }
  .label { font-size: 0.9rem; color: #A9A8B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .password-field { cursor: pointer; margin-top: 4px; }
  .password-masked { font-family: 'SF Mono', 'Courier New', Courier, monospace; color: #737288; font-size: 1.2rem; letter-spacing: 2px; user-select: none; }
  .password-visible { font-family: 'SF Mono', 'Courier New', Courier, monospace; color: #29D47A; font-size: 1.1rem; font-weight: bold; word-break: break-all; }
}
.item-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-left: 1rem;

  .action-btn {
    background: #393850;
    border: 1px solid #4a4960;
    color: #A9A8B8;
    cursor: pointer;
    font-size: 0.9rem;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: grid;
    place-content: center;
    transition: all 0.2s ease-in-out;

    i {
      transition: transform 0.2s ease;
    }

    &:hover {
      color: #fff;
      background: #4a4960;
      border-color: #5c5b77;
      i {
        transform: scale(1.1);
      }
    }

    &.delete-btn:hover {
      background: #E55353;
      border-color: transparent;
      color: #fff;
    }
  }
}
.item-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #313042;

  p {
    margin: 0;
    font-size: 0.9rem;
    color: #A9A8B8;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
    strong {
        color: #fff;
    }
  }
}
</style>
