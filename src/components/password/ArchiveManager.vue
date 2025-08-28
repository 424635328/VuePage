<!-- src/components/password/ArchiveManager.vue -->

<template>
  <div class="archive-manager-container">
    <div class="archive-header">
      <div class="header-top">
        <h2>密码存档</h2>
        <div class="header-actions">
           <button class="header-btn" @click="showImportModal = true" title="导入密码">
            <BaseIcon name="upload" />
            <span>导入</span>
          </button>
          <button class="header-btn" @click="showExportModal = true" title="导出密码">
            <BaseIcon name="download" />
            <span>导出</span>
          </button>
        </div>
      </div>
      <div class="search-wrapper">
        <BaseIcon name="magnifying-glass" class="search-icon" />
        <input
          type="text"
          v-model="store.searchQuery"
          placeholder="按平台或标签搜索..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 批量操作栏 -->
    <transition name="slide-fade">
      <div v-if="store.selectedItems.size > 0" class="bulk-actions-bar">
        <div class="selection-info">
          <span>已选择 <strong>{{ store.selectedItems.size }}</strong> 项</span>
          <div class="selection-controls">
            <button @click="handleSelectAll" class="control-btn">全选</button>
            <span class="separator">|</span>
            <button @click="store.clearSelection" class="control-btn">取消选择</button>
          </div>
        </div>
        <button @click="showDeleteConfirm = true" class="delete-selected-btn">
          <BaseIcon name="trash" />
          <span>删除所选</span>
        </button>
      </div>
    </transition>

    <div class="archive-list-wrapper">
      <div v-if="store.isLoading" class="state-message">
        <div class="spinner"></div>
        <p>正在加载密码...</p>
      </div>
      <div v-else-if="store.archive.length === 0" class="state-message empty-archive">
        <div class="empty-icon-wrapper">
          <BaseIcon name="archive-box" />
        </div>
        <h3>你的保险库是空的</h3>
        <p>点击右下角的“+”按钮添加你的第一个密码吧！</p>
      </div>
       <div v-else-if="store.filteredArchive.length === 0" class="state-message">
        <BaseIcon name="search-slash" />
        <h3>未找到匹配项</h3>
        <p>尝试更换关键词进行搜索。</p>
      </div>
      <transition-group name="list" tag="div" class="archive-list" v-else>
        <ArchiveItem
          v-for="item in store.filteredArchive"
          :key="item.id"
          :item="item"
        />
      </transition-group>
    </div>

    <!-- 模态框 -->
    <ImportModal :show="showImportModal" @close="showImportModal = false" />
    <ExportModal :show="showExportModal" @close="showExportModal = false" />
    <ConfirmModal
      :show="showDeleteConfirm"
      title="确认批量删除"
      :message="`您确定要永久删除所选的 ${store.selectedItems.size} 个密码吗？此操作不可撤销。`"
      confirmText="全部删除"
      @close="showDeleteConfirm = false"
      @confirm="handleBulkDelete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePasswordStore } from '@/stores/password';
import { useToast } from '@/composables/useToast';
import ArchiveItem from './ArchiveItem.vue';
import ImportModal from '@/components/common/ImportModal.vue';
import ExportModal from '@/components/common/ExportModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import BaseIcon from '@/components/common/BaseIcon.vue';

const store = usePasswordStore();
const { addToast } = useToast();

const showImportModal = ref(false);
const showExportModal = ref(false);
const showDeleteConfirm = ref(false);

function handleSelectAll() {
  const allFilteredIds = store.filteredArchive.map(item => item.id);
  store.selectAll(allFilteredIds);
}

async function handleBulkDelete() {
  showDeleteConfirm.value = false;
  const count = store.selectedItems.size;
  try {
    await store.deleteMultiplePasswords();
    addToast({ message: `成功删除 ${count} 个密码。`, type: 'info' });
  } catch (error) {
    addToast({ message: error.message || '批量删除失败。', type: 'error' });
  }
}
</script>

<style lang="scss" scoped>
/* 使用 CSS 变量来统一管理颜色和样式，方便未来主题切换 */
:root {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --accent-color: #34d399;
  --accent-hover: #10b981;
  --danger-color: #ef4444;
  --danger-hover: #dc2626;
}

.archive-manager-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-primary);
  padding: 1.5rem 2rem;
  overflow: hidden;
}

/* --- 头部 --- */
.archive-header {
  flex-shrink: 0;
  margin-bottom: 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 2rem;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .header-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease-in-out;

    &:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    svg {
      width: 1.1rem;
      height: 1.1rem;
    }
  }
}

.search-wrapper {
  position: relative;

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    transition: color 0.2s;
    width: 1.25rem;
    height: 1.25rem;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 3.25rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease-in-out;

    &::placeholder {
      color: var(--text-secondary);
    }

    &:focus {
      outline: none;
      border-color: var(--accent-color);
      background-color: var(--bg-primary);
      box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2);

      & ~ .search-icon {
        color: var(--accent-color);
      }
    }
  }
}

/* --- 批量操作栏 (全新玻璃拟态风格) --- */
.bulk-actions-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* 关键：实现毛玻璃效果 */
  background: rgba(30, 41, 59, 0.6); /* 半透明背景 */
  backdrop-filter: blur(12px); /* 背景模糊 */
  -webkit-backdrop-filter: blur(12px); /* 兼容 Safari */

  border: 1px solid rgba(148, 163, 184, 0.1); /* 微妙的边框 */
  color: var(--text-secondary); /* 默认文字颜色调暗 */
  padding: 0.5rem 0.5rem 0.5rem 1.5rem; /* 调整内边距 */
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); /* 增加深度阴影 */

  .selection-info {
    display: flex;
    align-items: center;
    gap: 1.5rem; /* 加大间距 */
    font-size: 0.9rem;

    strong {
      color: var(--text-primary);
      font-size: 1rem;
    }
  }

  .selection-controls {
    display: flex;
    align-items: center;
    gap: 1rem;

    .separator {
      color: rgba(156, 163, 175, 0.2); /* 分隔符更柔和 */
    }

    .control-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0;
      opacity: 0.7;
      transition: all 0.2s ease-in-out;

      &:hover {
        opacity: 1;
        color: var(--text-primary);
      }
    }
  }

  .delete-selected-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: transparent;
    border: 1px solid transparent; /* 占位，防止悬停时跳动 */
    color: var(--text-secondary);
    border-radius: 10px;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease-in-out;

    svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    span {
      /* 关键：实现文字竖排 */
      writing-mode: vertical-rl;
      text-orientation: mixed;
      letter-spacing: 2px; /* 增加字间距，更美观 */
      font-size: 0.85rem;
    }

    &:hover {
      background-color: rgba(239, 68, 68, 0.1); /* 危险色的玻璃态背景 */
      color: var(--danger-color);
      border-color: rgba(239, 68, 68, 0.3);
    }
  }
}

/* --- 列表与状态 --- */
.archive-list-wrapper {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}

.archive-list {
  height: 100%;
  overflow-y: auto;
  padding-right: 1rem;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--bg-tertiary);
    border-radius: 10px;
    border: 2px solid var(--bg-primary);
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: #4b5563;
  }
}

.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;

  svg {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1.5rem;
    opacity: 0.5;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }

  &.empty-archive {
    .empty-icon-wrapper {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(145deg, var(--bg-secondary), var(--bg-primary));
      display: grid;
      place-items: center;
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);

      svg {
        width: 3.5rem;
        height: 3.5rem;
        margin: 0;
        color: var(--accent-color);
        opacity: 0.8;
      }
    }
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--bg-tertiary);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* --- 动画 --- */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
