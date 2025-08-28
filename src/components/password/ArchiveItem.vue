<template>
  <div class="archive-item-wrapper">
    <div class="archive-item" :class="{ 'is-selected': isSelected, 'is-expanded': isHistoryVisible }" @click="toggleSelection">
      <div class="selection-checkbox">
        <input type="checkbox" :checked="isSelected" @click.stop="toggleSelection" />
        <span class="checkmark"></span>
      </div>

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
            <BaseIcon name="calendar-days" />
            <span>上次更新: {{ formattedDate }}</span>
          </div>
          <div class="password-field" @click.stop="togglePasswordVisibility" title="点击显示/隐藏密码">
            <span v-if="!isPasswordVisible" class="password-masked">••••••••••••</span>
            <span v-else class="password-visible">{{ item.password }}</span>
          </div>
        </div>
        <div class="item-actions">
           <!-- [关键修正] 将 v-if 改为 :disabled 绑定 -->
          <button
            @click.stop="isHistoryVisible = !isHistoryVisible"
            class="action-btn history-btn"
            :class="{ active: isHistoryVisible }"
            :disabled="!item.history || item.history.length === 0"
            :title="!item.history || item.history.length === 0 ? '暂无历史密码' : '查看历史密码'"
          >
            <BaseIcon name="clock-rotate-left" />
          </button>
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
    </div>

    <!-- 密码历史记录区域 -->
    <transition name="slide-fade">
      <div v-if="isHistoryVisible && item.history && item.history.length > 0" class="history-panel">
        <div class="history-header">
          <h4><BaseIcon name="clock-rotate-left" /> 历史密码 ({{ item.history.length }})</h4>
        </div>
        <ul>
          <li v-for="(hist, index) in item.history" :key="index" class="history-item">
            <div class="history-info">
              <span class="history-date">
                于 {{ formatHistoryDate(hist.date) }} 替换
              </span>
              <div class="history-password">
                <span v-if="!visibleHistoryPasswords.has(index)">••••••••••••</span>
                <span v-else>{{ hist.password }}</span>
              </div>
            </div>
            <div class="history-actions">
              <button @click.stop="toggleHistoryPassword(index)" title="显示/隐藏">
                <BaseIcon :name="visibleHistoryPasswords.has(index) ? 'eye-slash' : 'eye'" />
              </button>
              <button @click.stop="copyHistoryPassword(hist.password)" title="复制">
                <BaseIcon name="copy" />
              </button>
            </div>
          </li>
        </ul>
      </div>
    </transition>


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

const isHistoryVisible = ref(false);
const visibleHistoryPasswords = ref(new Set());


const isSelected = computed(() => store.selectedItems.has(props.item.id));

function toggleSelection() {
  if (isHistoryVisible.value) {
    isHistoryVisible.value = false;
    return;
  }
  store.toggleSelection(props.item.id);
}

const formattedDate = computed(() => {
  const dateStr = props.item.updatedAt || props.item.createdAt;
  if (!dateStr) return '未知时间';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(/\//g, '-');
});

function formatHistoryDate(dateStr) {
  if (!dateStr) return '未知日期';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour12: false
  }).replace(/\//g, '-');
}

const strengthInfo = computed(() => {
  const score = props.item.strength ?? 0;
  const map = [
    { text: '非常弱', color: '#E55353', score },
    { text: '弱', color: '#F9B115', score },
    { text: '中等', color: '#F9B115', score },
    { text: '强', color: '#29D47A', score },
    { text: '非常强', color: '#29D47A', score },
  ];
  return map[score] || { text: '未知', color: '#313042', score: -1 };
});

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value
  clearTimeout(visibilityTimer)
  if (isPasswordVisible.value) {
    visibilityTimer = setTimeout(() => { isPasswordVisible.value = false }, 10000)
  }
}

function toggleHistoryPassword(index) {
  if (visibleHistoryPasswords.value.has(index)) {
    visibleHistoryPasswords.value.delete(index);
  } else {
    visibleHistoryPasswords.value.add(index);
  }
}

function copyItemPassword() {
  copy(props.item.password)
  addToast({ message: `"${props.item.platform}" 的密码已复制`, type: 'success' })
}

function copyHistoryPassword(password) {
  copy(password);
  addToast({ message: '历史密码已复制', type: 'info' });
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
.archive-item-wrapper {
  border-bottom: 1px solid var(--border-color, #374151);
  &:last-child {
    border-bottom: none;
  }
}

.archive-item {
  background: transparent;
  padding: 1.25rem 0.5rem;
  transition: background-color 0.2s;
  cursor: pointer;
  display: flex;
  gap: 1rem;
  align-items: center;

  &.is-selected {
    background: rgba(52, 211, 153, 0.08);
  }
  &:hover:not(.is-selected) {
    background: rgba(156, 163, 175, 0.05);
  }
}
.selection-checkbox {
  position: relative;
  flex-shrink: 0;

  input[type="checkbox"] {
    opacity: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
    position: absolute;
  }

  .checkmark {
    position: relative;
    top: 0; left: 0;
    height: 20px; width: 20px;
    background-color: var(--bg-tertiary, #374151);
    border-radius: 4px;
    display: block;
    transition: background-color 0.2s;
    &::after {
      content: "";
      position: absolute;
      display: none;
      left: 7px; top: 4px;
      width: 5px; height: 10px;
      border: solid white;
      border-width: 0 3px 3px 0;
      transform: rotate(45deg);
    }
  }

  input:checked ~ .checkmark {
    background-color: var(--accent-color, #34d399);
  }
  input:checked ~ .checkmark::after {
    display: block;
  }
}


.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
}
.item-info {
  display: flex; flex-direction: column;
  gap: 0.3rem; overflow: hidden;
  .label { font-size: 0.9rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .password-field { cursor: pointer; margin-top: 4px; }
  .password-masked { font-family: 'SF Mono', 'Courier New', monospace; color: var(--text-secondary); font-size: 1.2rem; letter-spacing: 2px; user-select: none; }
  .password-visible { font-family: 'SF Mono', 'Courier New', monospace; color: var(--accent-color); font-size: 1.1rem; font-weight: bold; word-break: break-all; }
}

.info-header {
  display: flex; align-items: center; gap: 0.75rem;
  .platform { font-size: 1.1rem; color: var(--text-primary); font-weight: 500; }
}

.strength-indicator {
  display: flex; gap: 3px;
  .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background-color: var(--bg-tertiary);
    transition: background-color 0.3s;
  }
}

.creation-date {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;
  svg {
      width: 1rem;
      height: 1rem;
      opacity: 0.7;
  }
}

.item-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-left: 1rem;

  .action-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;

    svg {
      width: 1.1rem;
      height: 1.1rem;
      transition: transform 0.2s ease;
    }

    &:hover:not(:disabled) {
      color: var(--text-primary);
      background: var(--bg-tertiary);
      border-color: #4b5563;
      svg { transform: scale(1.1); }
    }

    /* [新增] 禁用状态样式 */
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: var(--bg-secondary);
      border-color: var(--border-color);
      color: var(--text-secondary);
    }

    &.history-btn:hover:not(:disabled),
    &.history-btn.active {
        background: #f59e0b;
        border-color: transparent;
        color: white;
    }
    &.edit-btn:hover {
      background: #3b82f6;
      border-color: transparent;
      color: #fff;
    }
    &.delete-btn:hover {
      background: var(--danger-color);
      border-color: transparent;
      color: #fff;
    }
  }
}

.history-panel {
  background-color: rgba(0, 0, 0, 0.15);
  padding: 1rem 1rem 1rem 3.5rem;
  margin: 0;

  .history-header {
    margin-bottom: 1rem;
    h4 {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      svg {
        width: 1rem;
        height: 1rem;
      }
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .history-info {
    .history-date {
      font-size: 0.8rem;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.25rem;
    }
    .history-password {
      font-family: 'SF Mono', 'Courier New', monospace;
      font-size: 1rem;
      color: var(--accent-color);
    }
  }

  .history-actions {
    display: flex;
    gap: 0.5rem;

    button {
      background: none;
      border: none;
      color: var(--text-secondary);
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      transition: all 0.2s;

      svg { width: 1rem; height: 1rem; }

      &:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 500px;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}
</style>
