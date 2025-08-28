<!-- src/views/PasswordGeneratorPage.vue -->

<template>
  <div class="page-wrapper">
    <!-- 加载与错误状态界面 -->
    <div v-if="!passwordStore.isReady" class="unlock-screen">
      <div class="unlock-content">
        <div class="unlock-status">
          <div v-if="passwordStore.isLoading" class="status-icon loading">
            <div class="spinner"></div>
          </div>
          <div v-else-if="pageError" class="status-icon error">
            <BaseIcon name="trash" />
          </div>
        </div>

        <div v-if="passwordStore.isLoading" class="unlock-message">
          <h2>正在加载密码库...</h2>
        </div>

        <div v-else-if="pageError" class="unlock-message">
          <h2>加载失败</h2>
          <p>{{ pageError }}</p>
          <button @click="window.location.reload()" class="retry-btn">
            <BaseIcon name="refresh" /> 重试
          </button>
        </div>
      </div>
    </div>

    <!-- 全屏主界面 (数据加载后显示) -->
    <div v-else class="main-screen">
      <!-- 顶部工具栏 -->
      <header class="toolbar">
        <div class="toolbar-left">
          <h1><BaseIcon name="key" /> 密码管家</h1>

          <!-- 解码器入口按钮 -->
          <button @click="showDecoderModal = true" class="tool-btn">
            <BaseIcon name="lock-open" /> 解码器
          </button>

          <div class="status-badge">
            <BaseIcon name="check" /> 已连接
          </div>
        </div>
        <div class="toolbar-right">
          <div class="stats">
            <span><BaseIcon name="circle-stack" /> {{ passwordStore.filteredArchive?.length || 0 }} 个密码</span>
            <span><BaseIcon name="clock" /> {{ formatTime(new Date()) }}</span>
          </div>
          <button @click="passwordStore.generateNewPassword" class="action-btn generate">
            <BaseIcon name="refresh" /> 生成
          </button>
        </div>
      </header>

      <!-- 主内容区域 - 双栏布局 -->
      <main class="content-grid">
        <!-- 左栏：密码生成器 -->
        <section class="generator-area">
          <div class="area-header">
            <h2><i class="fas fa-magic"></i> 密码生成器</h2>
          </div>
          <div class="area-body">
            <GeneratorControls />
            <GeneratedResult />
          </div>
        </section>

        <!-- 分割线 -->
        <div class="divider"></div>

        <!-- 右栏：密码存档 -->
        <section class="archive-area">
          <div class="area-header">
            <h2><i class="fas fa-archive"></i> 密码存档</h2>
          </div>
          <div class="area-body">
            <ArchiveManager />
          </div>
        </section>
      </main>
    </div>

    <!-- 密码解码器模态框 -->
    <PasswordDecoder :show="showDecoderModal" @close="showDecoderModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useToast } from '@/composables/useToast'
import GeneratorControls from '@/components/password/GeneratorControls.vue'
import GeneratedResult from '@/components/password/GeneratedResult.vue'
import ArchiveManager from '@/components/password/ArchiveManager.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import PasswordDecoder from '@/components/decoder/PasswordDecoder.vue'

const passwordStore = usePasswordStore()
const { addToast } = useToast()
const pageError = ref('')
const showDecoderModal = ref(false)

function formatTime(date) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    await passwordStore.loadVault();
    passwordStore.generateNewPassword();
    addToast({ message: '密码库已加载', type: 'success' });
  } catch (error) {
    const errorMessage = error.message || "网络连接失败，无法加载数据。";
    pageError.value = errorMessage;
    addToast({ message: errorMessage, type: 'error', duration: 5000 });
  }
})
</script>

<style lang="scss" scoped>
// 全局样式变量
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-light: rgba(148, 163, 184, 0.1);
  --border-medium: rgba(148, 163, 184, 0.2);
}

// 重置和基础样式
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* === 加载/错误界面 === */
.unlock-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 2rem;
}

.unlock-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.unlock-status {
  margin-bottom: 2rem;

  .status-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;

    svg {
      width: 2.5rem;
      height: 2.5rem;
    }

    &.loading {
      background: rgba(59, 130, 246, 0.1);
      border: 2px solid var(--primary);
    }

    &.error {
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid var(--error);
      color: var(--error);
    }
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(59, 130, 246, 0.3);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.unlock-message {
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  p {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    line-height: 1.5;
  }
}

.retry-btn {
  background: var(--error);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    background: #dc2626;
  }
}

/* === 主界面 === */
.main-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      svg {
        color: var(--primary);
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    .tool-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning, #f59e0b);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid rgba(245, 158, 11, 0.2);
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: 1rem;
        height: 1rem;
      }

      &:hover {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
      }
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid rgba(16, 185, 129, 0.2);

      svg {
        width: 1rem;
        height: 1rem;
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: var(--text-secondary);
      font-size: 0.875rem;

      span {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
          color: var(--primary);
          width: 1rem;
          height: 1rem;
        }
      }
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;

      svg {
        width: 1rem;
        height: 1rem;
      }

      &.generate {
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        border: 1px solid rgba(59, 130, 246, 0.2);

        &:hover {
          background: rgba(59, 130, 246, 0.15);
        }
      }
    }
  }
}

.content-grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(400px, 1fr) 1px minmax(400px, 1fr);
  min-height: 0;
  overflow: hidden;
}

.generator-area, .archive-area {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  min-height: 0;
}

.divider {
  background: var(--border-light);
  width: 1px;
}

.area-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;

  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);

    i {
      color: var(--primary);
      font-size: 1rem;
    }
  }
}

.area-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 0;
  overflow: hidden;
}

/* === 响应式设计 === */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .divider {
    display: none;
  }

  .toolbar {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;

    .toolbar-left, .toolbar-right {
      gap: 1rem;
    }

    .stats {
      order: 3;
      flex-basis: 100%;
      justify-content: center;
    }
  }
}

@media (max-width: 640px) {
  .generator-area, .archive-area {
    padding: 1rem;
  }

  .toolbar {
    .toolbar-right .stats {
      display: none;
    }
  }

  .unlock-screen {
    padding: 1rem;
  }
}

@media (max-height: 600px) {
  .generator-area, .archive-area {
    padding: 1rem;
  }

  .area-header {
    margin-bottom: 1rem;
  }

  .area-body {
    gap: 1rem;
  }
}

/* === 动画 === */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.main-screen {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
