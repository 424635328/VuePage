<!-- src/components/common/ExportModal.vue -->

<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <header class="modal-header">
          <h3><BaseIcon name="download" /> 导出密码</h3>
          <button @click="$emit('close')" class="btn-close">&times;</button>
        </header>

        <section class="modal-body">
          <p class="info-text">选择导出格式。为了安全起见，建议使用加密格式进行备份。</p>

          <div class="format-options">
            <div class="radio-wrapper">
              <input type="radio" id="plain" value="plain" v-model="exportFormat" />
              <label for="plain">明文 JSON</label>
              <small>兼容性好，但文件内容未加密。</small>
            </div>
            <div class="radio-wrapper">
              <input type="radio" id="encrypted" value="encrypted" v-model="exportFormat" />
              <label for="encrypted">加密 JSON</label>
              <small>安全备份，需要设置密码。</small>
            </div>
          </div>

          <transition name="fade">
            <div v-if="exportFormat === 'encrypted'" class="password-section">
              <input
                type="password"
                v-model="encryptionKey"
                placeholder="设置一个强大的加密密码"
                class="password-input"
              />
               <input
                type="password"
                v-model="confirmKey"
                placeholder="确认加密密码"
                class="password-input"
              />
              <p v-if="keysMismatch" class="error-text">密码不匹配。</p>
            </div>
          </transition>

        </section>

        <footer class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">取消</button>
          <button type="button" class="btn-primary" @click="handleExport" :disabled="isExportDisabled">
            <span v-if="exporting">正在导出...</span>
            <span v-else>导出文件</span>
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'; // 引入 onMounted 和 onUnmounted
import { usePasswordStore } from '@/stores/password';
import { useToast } from '@/composables/useToast';
// 导入 Worker 脚本。Vite/Webpack 会自动处理这个 `?worker` 后缀。
import ExportWorker from '@/workers/export.worker.js?worker';
import BaseIcon from '@/components/common/BaseIcon.vue';

defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);

const store = usePasswordStore();
const { addToast } = useToast();

const exportFormat = ref('encrypted');
const encryptionKey = ref('');
const confirmKey = ref('');
const exporting = ref(false);

// 定义一个变量来持有 Worker 实例
let worker = null;

// 在组件挂载时初始化 Worker
onMounted(() => {
  worker = new ExportWorker();

  // 设置监听器，接收来自 Worker 的消息
  worker.onmessage = (event) => {
    const { status, payload } = event.data;

    if (status === 'success') {
      const fileContent = payload;
      const isEncrypted = exportFormat.value === 'encrypted';
      const filename = isEncrypted ? 'passwords_export.encrypted.json' : 'passwords_export.json';

      // Worker 完成任务后，在主线程触发文件下载
      downloadFile(fileContent, filename, 'application/json');

      addToast({
        message: isEncrypted ? '加密密码库已成功导出！' : '明文密码已导出。',
        type: isEncrypted ? 'success' : 'warning'
      });
      emit('close');
    } else { // status === 'error'
      addToast({ message: `导出失败: ${payload}`, type: 'error' });
      console.error('Export failed in worker:', payload);
    }

    // 不论成功或失败，都在主线程重置状态
    // `finally` 块的逻辑移到这里
    exporting.value = false;
    encryptionKey.value = '';
    confirmKey.value = '';
  };

  // 监听 Worker 内部发生的未捕获错误
  worker.onerror = (error) => {
    console.error('An error occurred in the export worker:', error);
    addToast({ message: '导出过程中发生未知错误，请检查控制台。', type: 'error' });
    exporting.value = false;
  };
});

// 在组件卸载时，终止 Worker 以释放资源，避免内存泄漏
onUnmounted(() => {
  if (worker) {
    worker.terminate();
  }
});


const keysMismatch = computed(() => {
  return exportFormat.value === 'encrypted' && encryptionKey.value && confirmKey.value && encryptionKey.value !== confirmKey.value;
});

const isExportDisabled = computed(() => {
  if (exporting.value) return true;
  if (exportFormat.value === 'encrypted') {
    // 确保两个密码框都有值
    return !encryptionKey.value || !confirmKey.value || keysMismatch.value;
  }
  return false;
});

function downloadFile(content, filename, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  document.body.appendChild(a); // 兼容 Firefox
  a.click();
  document.body.removeChild(a); // 清理
  URL.revokeObjectURL(a.href);
}

// 这是重构后的核心函数
async function handleExport() {
  // 1. 立刻更新UI状态。因为主线程没有被阻塞，这个更新会立即生效。
  exporting.value = true;

  // 2. 将数据发送给 Worker。
  // 注意：我们传递的是 store.archive 的一个纯净、可序列化的副本。
  // Web Worker 之间通过结构化克隆算法传递数据，不能直接传递复杂的代理对象（如Pinia的state）。
  worker.postMessage({
    type: 'EXPORT_DATA',
    payload: {
      data: JSON.parse(JSON.stringify(store.archive)),
      format: exportFormat.value,
      key: encryptionKey.value,
    },
  });

  // 3. handleExport 函数到此结束！主线程现在是自由的，可以响应用户操作。
  // 后续的文件下载、提示、关闭弹窗等逻辑，都在 onmessage 监听器中异步处理。
}
</script>

<style lang="scss" scoped>
/* 样式部分无任何改动 */
.modal-backdrop {
  position: fixed; z-index: 1050; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
}
.modal {
  background: rgba(30, 41, 59, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  color: #C7C7E1;
  border-radius: 12px; width: 90%; max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  display: flex; flex-direction: column;
}
.modal-header {
  padding: 1rem 1.5rem; border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  display: flex; justify-content: space-between; align-items: center;
  h3 { margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.75rem; color: #fff; }
}
.btn-close {
  background: none; border: none; font-size: 1.75rem;
  color: #737288; cursor: pointer; padding: 0; line-height: 1;
  &:hover { color: #fff; }
}
.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1rem 1.5rem; border-top: 1px solid rgba(148, 163, 184, 0.2);
  display: flex; justify-content: flex-end; gap: 0.75rem;
}
.btn-primary, .btn-secondary {
  padding: 0.6rem 1.2rem; border-radius: 8px; border: none;
  font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.btn-primary { background-color: #29D47A; color: #1A1926; &:hover:not(:disabled) { filter: brightness(1.1); } }
.btn-secondary { background-color: #313042; color: #C7C7E1; &:hover { background-color: #393850; } }
.btn-primary:disabled { background-color: #313042; color: #5C5B77; cursor: not-allowed; }

.info-text { margin: 0 0 1.5rem 0; color: #A9A8B8; line-height: 1.5; font-size: 0.9rem; }

.format-options {
  display: flex; flex-direction: column; gap: 1rem;
}
.radio-wrapper {
  padding: 1rem; border: 1px solid #313042; border-radius: 8px;
  cursor: pointer;
  input[type="radio"] { display: none; }
  label { font-weight: 500; color: #fff; }
  small { display: block; color: #A9A8B8; margin-top: 0.25rem; }

  input[type="radio"]:checked + label + small {
    color: #29D47A;
  }
  &:has(input:checked) {
    border-color: #29D47A;
    background-color: rgba(41, 212, 122, 0.1);
  }
}
.password-section {
  margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;
}
.password-input {
  width: 100%; padding: 0.8rem 1rem;
  background: #2E2D3D; border: 1px solid #313042; color: #C7C7E1;
  border-radius: 8px; font-size: 1rem;
  &:focus { outline: none; border-color: #29D47A; }
}
.error-text {
  color: #E55353; font-size: 0.875rem; margin-top: 0.25rem;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
