<!-- src/views/CdkPage.vue -->

<template>
  <div class="cdk-page-container">
    <!-- 1. 页面头部 -->
    <header class="page-header">
      <div class="header-title">
        <h1>CDK / 卡密管理</h1>
      </div>
      <div class="actions-group">
        <div class="search-box">
          <input
            type="search"
            v-model="localSearchQuery"
            placeholder="按名称搜索..."
            class="search-input"
          />
        </div>
        <button @click="openAddModal" class="add-btn">
          <span>添加新 CDK</span>
        </button>
      </div>
    </header>

    <!-- 2. 批量操作工具栏 -->
    <transition name="toolbar-fade">
      <div v-if="selectedIds.length > 0" class="bulk-actions-toolbar">
        <span class="selection-count">已选择 {{ selectedIds.length }} 项</span>
        <button @click="handleBulkDelete" class="bulk-delete-btn">
          <span>批量删除</span>
        </button>
      </div>
    </transition>

    <!-- 3. 数据状态显示 -->
    <div v-if="loading" class="state-container loading-state">
      <div class="spinner"></div>
      <p>正在加载您的 CDK 列表...</p>
    </div>
    <div v-if="error" class="state-container error-state">
      <p>加载失败: {{ error }}</p>
    </div>
    <div v-if="!loading && cdks.length === 0 && !error" class="state-container empty-state">
      <h2>{{ cdkStore.searchQuery ? '未找到匹配的 CDK' : '您的保险库是空的' }}</h2>
      <p>点击右上角的 "添加新 CDK" 来保管您的第一个卡密吧！</p>
    </div>

    <!-- 4. CDK 列表 -->
    <div v-if="!loading && cdks.length > 0" class="cdk-list-wrapper">
      <!-- 表头，仅在桌面端显示 -->
      <div class="cdk-item list-header">
        <div class="select-cell">
          <input
            type="checkbox"
            @change="toggleSelectAll"
            :checked="isAllSelected"
            class="custom-checkbox"
            aria-label="全选"
          />
        </div>
        <div class="name-cell">名称</div>
        <div class="key-cell">密钥</div>
        <div class="status-cell">状态</div>
        <div class="actions-cell">操作</div>
      </div>

      <!-- 数据行 -->
      <transition-group name="list-anim" tag="div" class="cdk-list">
        <div v-for="cdk in cdks" :key="cdk.id" class="cdk-item">
          <!-- 复选框 -->
          <div class="select-cell">
            <input
              type="checkbox"
              :value="cdk.id"
              v-model="selectedIds"
              class="custom-checkbox"
              :aria-label="`选择 ${cdk.name}`"
            />
          </div>
          <!-- 名称 -->
          <div class="name-cell" :data-label="'名称'">
            <span class="cdk-name">{{ cdk.name }}</span>
            <small class="creation-date">{{ formatDate(cdk.created_at) }}</small>
          </div>
          <!-- 密钥 -->
          <div class="key-cell" :data-label="'密钥'">
            <code class="cdk-key-value">{{ cdk.cdk_key }}</code>
            <button @click="copyToClipboard(cdk.cdk_key)" class="icon-btn copy-btn" title="复制密钥">
              复制
            </button>
          </div>
          <!-- 状态 -->
          <div class="status-cell" :data-label="'状态'">
            <button
              @click="toggleUsedStatus(cdk)"
              :class="['status-toggle', { used: cdk.is_used }]"
              :title="cdk.is_used ? '标记为未使用' : '标记为已使用'"
            >
              <span>{{ cdk.is_used ? '已使用' : '未使用' }}</span>
            </button>
          </div>
          <!-- 操作 -->
          <div class="actions-cell" :data-label="'操作'">
            <button @click="openEditModal(cdk)" class="icon-btn edit-btn" title="编辑">
              编辑
            </button>
            <button @click="handleDeleteCdk(cdk)" class="icon-btn delete-btn" title="删除">
              删除
            </button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 5. 无限滚动加载触发器 -->
    <div ref="loadMoreTrigger" class="load-more-trigger">
      <div v-if="loadingMore" class="spinner-small"></div>
      <p v-if="!hasMore && cdks.length > 0">已加载全部数据</p>
    </div>

    <!-- 6. 添加/编辑模态框 -->
    <CdkEditModal
      v-model="isModalOpen"
      :cdk="editingCdk"
      :is-submitting="isSubmitting"
      @save="handleSaveCdk"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCdksStore } from '@/stores/cdks';
import { useToastStore } from '@/stores/toast';
// ✨ 1. 导入 useConfirm composable
import { useConfirm } from '@/composables/useConfirm';
import { useIntersectionObserver, useDebounceFn } from '@vueuse/core';
import CdkEditModal from '@/components/cdk/CdkEditModal.vue';

// --- 逻辑代码 ---
const cdkStore = useCdksStore();
const toastStore = useToastStore();
const { cdks, loading, error, hasMore, loadingMore } = storeToRefs(cdkStore);

// ✨ 2. 获取 showConfirm 方法
const { showConfirm } = useConfirm();

// --- 模态框与表单状态 ---
const isModalOpen = ref(false);
const editingCdk = ref(null);
const isSubmitting = ref(false);

function openAddModal() {
  editingCdk.value = null;
  isModalOpen.value = true;
}

function openEditModal(cdk) {
  editingCdk.value = { ...cdk };
  isModalOpen.value = true;
}

async function handleSaveCdk(formData) {
  isSubmitting.value = true;
  let success = false;
  if (editingCdk.value) {
    success = await cdkStore.updateCdk(editingCdk.value.id, formData);
  } else {
    success = await cdkStore.addCdk(formData);
  }
  if (success) {
    isModalOpen.value = false;
  }
  isSubmitting.value = false;
}

// --- 搜索逻辑 ---
const localSearchQuery = ref(cdkStore.searchQuery);
const debouncedSearch = useDebounceFn(() => {
  cdkStore.searchQuery = localSearchQuery.value;
  selectedIds.value = [];
  cdkStore.fetchInitialCdks();
}, 300);

watch(localSearchQuery, debouncedSearch);

// --- 删除逻辑 ---
// ✨ 3. 更新单个删除的逻辑
async function handleDeleteCdk(cdk) {
  const confirmed = await showConfirm({
    title: '删除确认',
    message: `您确定要永久删除 CDK "${cdk.name}" 吗？此操作无法撤销。`,
    confirmText: '确认删除',
    cancelText: '取消',
    type: 'danger' // 使用 'danger' 类型来显示红色主题和警告图标
  });

  if (confirmed) {
    await cdkStore.deleteCdk(cdk.id);
  }
}

// --- 批量操作逻辑 ---
const selectedIds = ref([]);
const isAllSelected = computed(
  () => cdks.value.length > 0 && selectedIds.value.length === cdks.value.length
);

function toggleSelectAll(event) {
  if (event.target.checked) {
    selectedIds.value = cdks.value.map((c) => c.id);
  } else {
    selectedIds.value = [];
  }
}

watch(cdks, (newCdks) => {
  const existingIds = new Set(newCdks.map(c => c.id));
  selectedIds.value = selectedIds.value.filter(id => existingIds.has(id));
}, { deep: true });

// ✨ 4. 更新批量删除的逻辑
async function handleBulkDelete() {
  const count = selectedIds.value.length;
  const confirmed = await showConfirm({
    title: '批量删除确认',
    message: `您确定要永久删除选中的 ${count} 项 CDK 吗？此操作无法撤销。`,
    confirmText: `删除 ${count} 项`,
    cancelText: '取消',
    type: 'danger'
  });

  if (confirmed) {
    const success = await cdkStore.deleteMultipleCdks([...selectedIds.value]);
    if (success) {
      selectedIds.value = [];
    }
  }
}

// --- 快捷操作 ---
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toastStore.showToast({ msg: '密钥已复制到剪贴板' });
  });
}

function toggleUsedStatus(cdk) {
  cdkStore.updateCdk(cdk.id, { is_used: !cdk.is_used });
}

// --- 辅助函数 ---
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// --- 无限滚动 ---
const loadMoreTrigger = ref(null);
useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMore.value && !loading.value && !loadingMore.value) {
      cdkStore.fetchMoreCdks();
    }
  },
  { threshold: 0.5 }
);

// --- 生命周期钩子 ---
onMounted(() => {
  cdkStore.fetchInitialCdks();
});

onUnmounted(() => {
  cdkStore.clearCdks();
});
</script>

<style lang="scss" scoped>
@use "sass:color";

/*
 * Cyberpunk Aesthetic Overhaul
 * -----------------------------
 * This style block is designed to match the neon, high-tech aesthetic
 * from the provided screenshot.
 */

// 定义色板
$primary-color: #42b883; // 保持主色调，用于部分高光
$cyber-teal: #00f5c4;
$cyber-pink: #E040FB;
$cyber-danger: #ff3b5f;
$text-primary: #e0e0e0;
$text-secondary: rgba(224, 224, 224, 0.6);
$background-main: #0a0a18;
$background-container: rgba(20, 20, 40, 0.4);
$border-color: rgba(100, 100, 220, 0.3);


// --- 基础容器 ---
.cdk-page-container {
  max-width: 1200px;
  margin: 3rem auto;
  padding: 0 2rem;
  color: $text-primary;
}


// --- 头部 & 主要操作按钮 ---
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid $border-color;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  h1 {
    font-size: 2.25rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 0 5px rgba($text-primary, 0.2);
  }
  .title-icon { // This class can be removed if not used elsewhere
    color: $primary-color;
    filter: drop-shadow(0 0 8px rgba($primary-color, 0.7));
  }
}

.actions-group {
  display: flex;
  gap: 1rem;
}

// 搜索框风格
.search-box {
  position: relative;
  .search-icon { // This class can be removed
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: $text-secondary;
    pointer-events: none;
  }
  .search-input {
    background-color: $background-container;
    border: 1px solid $border-color;
    border-radius: 8px;
    padding: 0.75rem 1rem; // Adjusted padding since icon is gone
    width: 250px;
    color: $text-primary;
    transition: all 0.2s ease;
    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 10px rgba($primary-color, 0.5);
    }
  }
}

// "添加新 CDK" 按钮
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-image: linear-gradient(45deg, $primary-color, color.adjust($primary-color, $lightness: 10%));
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba($primary-color, 0.3);
  }
}

// 批量操作栏 & 按钮美化
.bulk-actions-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(90deg, rgba($primary-color, 0.1), rgba($primary-color, 0.05));
  border: 1px solid rgba($primary-color, 0.3);
  border-radius: 8px;
  margin-bottom: 2rem;
  color: $text-primary;

  .selection-count {
    font-weight: 500;
    color: $primary-color;
  }

  .bulk-delete-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: $cyber-danger;
    border: 1px solid $cyber-danger;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease-out;
    text-shadow: 0 0 5px rgba($cyber-danger, 0.5);
     box-shadow:
      inset 0 0 5px rgba($cyber-danger, 0.3),
      0 0 5px rgba($cyber-danger, 0.3);

    &:hover {
      background-color: rgba($cyber-danger, 0.15);
      color: white;
      box-shadow:
        inset 0 0 10px rgba($cyber-danger, 0.5),
        0 0 15px rgba($cyber-danger, 0.7);
    }
  }
}

// --- 状态容器 (加载/空/错误) ---
.state-container { text-align: center; padding: 4rem 2rem; color: $text-secondary; h2 { font-size: 1.75rem; margin: 1.5rem 0 0.5rem; color: $text-primary; } }
.empty-icon { opacity: 0.3; } // This class can be removed
.error-state { color: $cyber-danger; }

// --- 列表 & 列表项 ---
.cdk-list-wrapper {
  background-color: rgba(20, 20, 40, 0.2);
  border: 1px solid $border-color;
  border-radius: 12px;
  overflow: hidden;
}

.cdk-item {
  display: grid;
  grid-template-columns: 60px 2.5fr 3.5fr 1.5fr 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  transition: background-color 0.2s ease;

  &:not(.list-header) {
    border-top: 1px solid $border-color;
    &:hover {
      background: linear-gradient(90deg, rgba($primary-color, 0.08), transparent);
    }
  }
}

.list-header {
  font-weight: 600;
  color: $text-secondary;
  padding: 1rem 1.5rem;
}

.select-cell, .name-cell, .key-cell, .status-cell, .actions-cell { min-width: 0; }
.name-cell {
  display: flex; flex-direction: column;
  .cdk-name { font-weight: 500; color: $text-primary; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .creation-date { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); }
}
.key-cell {
  display: flex; align-items: center; gap: 0.75rem;
  .cdk-key-value { font-family: 'Fira Code', 'Courier New', monospace; background-color: rgba(0, 0, 0, 0.4); padding: 0.3rem 0.6rem; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
.actions-cell { display: flex; justify-content: flex-end; gap: 0.5rem; }

// 列表内按钮 & 控件美化
.status-toggle {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem; border-radius: 20px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease;
  background-color: rgba($cyber-teal, 0.15); color: $cyber-teal;
  &.used { background-color: rgba($cyber-pink, 0.15); color: $cyber-pink; }
  &:hover { background-color: rgba(255, 255, 255, 0.1); transform: scale(1.05); }
}

.icon-btn {
  background-color: transparent; border: none; color: $text-secondary; padding: 0.5rem; border-radius: 6px; cursor: pointer; transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
  }
  &.copy-btn, &.edit-btn {
    &:hover {
      color: $cyber-teal;
      background-color: rgba($cyber-teal, 0.1);
    }
  }
  &.delete-btn {
    &:hover {
      color: $cyber-danger;
      background-color: rgba($cyber-danger, 0.1);
    }
  }
}

.custom-checkbox {
  appearance: none; width: 20px; height: 20px; border: 1px solid $border-color; border-radius: 4px; cursor: pointer; position: relative; transition: all 0.2s ease; background-color: rgba(0,0,0,0.2);
  &:hover { border-color: $primary-color; }
  &:checked { background-color: $primary-color; border-color: $primary-color; box-shadow: 0 0 8px rgba($primary-color, 0.7); }
  &:checked::after { content: ''; position: absolute; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; top: 50%; left: 50%; transform: translate(-50%, -60%) rotate(45deg); }
}

// --- 动画 ---
.toolbar-fade-enter-active, .toolbar-fade-leave-active { transition: all 0.3s ease; }
.toolbar-fade-enter-from, .toolbar-fade-leave-to { opacity: 0; transform: translateY(-10px); }
.list-anim-move, .list-anim-enter-active, .list-anim-leave-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.list-anim-enter-from, .list-anim-leave-to { opacity: 0; transform: scaleY(0.01) translate(30px, 0); }
.list-anim-leave-active { position: absolute; width: 100%; }

// --- 响应式设计 ---
@media (max-width: 992px) {
  .cdk-item { grid-template-columns: 60px 2fr 3fr 1.5fr 1fr; }
}
@media (max-width: 768px) {
  .cdk-page-container { padding: 0 1rem; margin-top: 2rem; }
  .page-header { flex-direction: column; align-items: stretch; gap: 1.5rem; }
  .cdk-list-wrapper { background: none; border: none; }
  .list-header { display: none; }
  .cdk-item { display: block; background-color: $background-container; border: 1px solid $border-color; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; position: relative; }
  .select-cell { position: absolute; top: 1rem; right: 1rem; }
  .name-cell, .key-cell, .status-cell, .actions-cell { display: block; width: 100%; margin-bottom: 1rem; padding-top: 1.5rem; position: relative; &:not(:first-child) { border-top: 1px solid $border-color; } &::before { content: attr(data-label); position: absolute; top: 0; left: 0; font-weight: 600; font-size: 0.8rem; color: $text-secondary; } }
  .name-cell { padding-top: 0; border-top: none; &::before { display: none; }}
  .cdk-name { font-size: 1.2rem; }
  .actions-cell { justify-content: flex-start; }
}

// --- Spinner 动画 ---
.spinner, .spinner-small { border-radius: 50%; animation: spin 1s linear infinite; }
.spinner { width: 48px; height: 48px; border: 4px solid rgba(255, 255, 255, 0.2); border-top-color: $primary-color; }
.spinner-small { width: 20px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.4); border-top-color: $text-primary; }
.load-more-trigger { height: 60px; display: flex; justify-content: center; align-items: center; color: $text-secondary; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
