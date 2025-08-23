<!-- src/components/password/ArchiveItem.vue -->

<template>
  <div class="archive-item">
    <div class="item-main">
      <div class="item-info">
        <div class="info-header">
          <strong class="platform">{{ item.platform }}</strong>
          <div class="strength-indicator" :title="strengthInfo.text">
            <span v-for="i in 5" :key="i" :class="['dot', { active: i <= strengthInfo.score + 1 }]" :style="{ backgroundColor: i <= strengthInfo.score + 1 ? strengthInfo.color : '' }"></span>
          </div>
        </div>
        <span v-if="item.label" class="label">{{ item.label }}</span>
        <div class="creation-date">
          <i class="fas fa-calendar-alt"></i>
          <span>{{ formattedDate }}</span>
        </div>
        <div class="password-field" @click="togglePasswordVisibility" title="点击显示/隐藏密码">
          <span v-if="!isPasswordVisible" class="password-masked">••••••••••••</span>
          <span v-else class="password-visible">{{ item.password }}</span>
        </div>
      </div>
      <div class="item-actions">
        <button @click.stop="copyItemPassword" class="action-btn" :title="copied ? '已复制!' : '复制密码'">
          <BaseIcon :name="copied ? 'check' : 'copy'" />
        </button>
        <button @click.stop="showEditModal = true" class="action-btn edit-btn" title="编辑">
          <BaseIcon name="pencil" />
        </button>
        <button @click.stop="showDeleteConfirm = true" class="action-btn delete-btn" title="删除">
          <BaseIcon name="trash" />
        </button>
      </div>
    </div>
    <div v-if="item.notes" class="item-notes">
      <p><strong>备注:</strong> {{ item.notes }}</p>
    </div>

    <ConfirmModal
      :show="showDeleteConfirm"
      title="确认删除密码"
      :message="`您确定要永久删除 “${item.platform}” 的密码吗？此操作不可撤销。`"
      confirmText="确认删除"
      cancelText="取消"
      @close="showDeleteConfirm = false"
      @confirm="handleDeleteConfirm"
    />
    <EditPasswordModal
      :show="showEditModal"
      :item="item"
      @close="showEditModal = false"
      @save="handleSaveChanges"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useClipboard } from '@vueuse/core'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import EditPasswordModal from '@/components/common/EditPasswordModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

const props = defineProps({
  item: { type: Object, required: true }
})

const store = usePasswordStore()
const { copy, copied } = useClipboard({ timeout: 2000 })
const { addToast } = useToast()

const isPasswordVisible = ref(false)
let visibilityTimer = null

const showDeleteConfirm = ref(false)
const showEditModal = ref(false)

const formattedDate = computed(() => {
  const dateStr = props.item.updatedAt || props.item.createdAt;
  if (!dateStr) return '未知时间';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
});

const strengthInfo = computed(() => {
  const score = props.item.strength ?? 0;
  const map = [
    { text: '非常弱', color: '#E55353', score },
    { text: '弱', color: '#F9B115', score },
    { text: '中等', color: '#F9B115', score },
    { text: '强', color: '#29D47A', score },
    { text: '非常强', color: '#29D47A', score },
  ];
  return map[score];
});

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value
  clearTimeout(visibilityTimer)
  if (isPasswordVisible.value) {
    visibilityTimer = setTimeout(() => { isPasswordVisible.value = false }, 5000)
  }
}

function copyItemPassword() {
  copy(props.item.password)
  addToast({ message: `"${props.item.platform}" 的密码已复制`, type: 'success' })
}

async function handleDeleteConfirm() {
  showDeleteConfirm.value = false;
  try {
    await store.deletePassword(props.item.id)
    addToast({ message: '密码已成功删除', type: 'info' })
  } catch (error) {
    addToast({ message: error.message || '删除失败，请重试。', type: 'error' })
  }
}

async function handleSaveChanges(updates) {
  try {
    await store.updatePassword(props.item.id, updates)
    addToast({ message: '信息更新成功！', type: 'success' })
  } catch (error) {
    addToast({ message: error.message || '更新失败，请重试。', type: 'error' })
  }
}
</script>

<style lang="scss" scoped>
.archive-item {
  background: #2E2D3D;
  border: 1px solid #313042;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s;
  &:hover { background: #393850; border-color: #4a4960; }
}
.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-info {
  display: flex; flex-direction: column;
  gap: 0.3rem; overflow: hidden;
  .label { font-size: 0.9rem; color: #A9A8B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .password-field { cursor: pointer; margin-top: 4px; }
  .password-masked { font-family: 'SF Mono', 'Courier New', monospace; color: #737288; font-size: 1.2rem; letter-spacing: 2px; user-select: none; }
  .password-visible { font-family: 'SF Mono', 'Courier New', monospace; color: #29D47A; font-size: 1.1rem; font-weight: bold; word-break: break-all; }
}

.info-header {
  display: flex; align-items: center; gap: 0.75rem;
  .platform { font-size: 1.1rem; color: #fff; font-weight: 500; }
}

.strength-indicator {
  display: flex; gap: 3px;
  .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background-color: #313042;
    transition: background-color 0.3s;
  }
}

.creation-date {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: #737288; margin-top: 4px;
  i { font-size: 0.8rem; }
}

.item-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-left: 1rem;

  .action-btn {
    background: #393850;
    border: 1px solid #4a4960;
    color: #c7c7e1;
    cursor: pointer;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;

    svg {
      width: 1.25rem;
      height: 1.25rem;
      transition: transform 0.2s ease;
    }

    &:hover {
      color: #fff;
      background: #4a4960;
      border-color: #5c5b77;
      svg {
        transform: scale(1.1);
      }
    }

    &.edit-btn:hover {
      background: #3b82f6;
      border-color: transparent;
      color: #fff;
    }

    &.delete-btn:hover {
      background: #E55353;
      border-color: transparent;
      color: #fff;
    }
  }
}
.item-notes {
  margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #313042;
  p {
    margin: 0; font-size: 0.9rem; color: #A9A8B8;
    white-space: pre-wrap; word-break: break-all;
    line-height: 1.6;
    strong { color: #fff; }
  }
}
</style>
