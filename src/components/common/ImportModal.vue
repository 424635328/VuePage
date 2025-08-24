<!-- src/components/common/ImportModal.vue -->

<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <header class="modal-header">
          <h3><BaseIcon name="upload" /> 导入密码</h3>
          <button @click="closeModal" class="btn-close" aria-label="关闭">&times;</button>
        </header>

        <section class="modal-body">
          <div v-if="!processing">
            <!-- 1. 文件拖拽区域 -->
            <div
              class="drop-zone"
              :class="{ 'drag-over': isDraggingOver }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <input
                type="file"
                id="file-upload"
                ref="fileInput"
                @change="handleFileChange"
                accept=".json,.csv"
                class="file-input"
              />
              <label for="file-upload" class="drop-zone-label">
                <BaseIcon name="folder-open" class="drop-zone-icon" />
                <span v-if="isDraggingOver">松开即可上传</span>
                <span v-else-if="fileName" class="file-name-display">{{ fileName }}</span>
                <span v-else>
                  <strong>点击选择文件</strong> 或拖拽到此处
                </span>
                <small>支持 .json 和 .csv 格式</small>
              </label>
            </div>

            <div v-if="isFileEncrypted" class="password-section-wrapper">
               <input
                type="password"
                v-model="decryptionKey"
                placeholder="请输入解密密码"
                class="password-input"
                ref="passwordInput"
              />
            </div>
          </div>

          <!-- 2. 优化的处理中状态 -->
          <div v-if="processing" class="processing-state">
            <div class="spinner"></div>
            <p class="status-message">{{ statusMessage }}</p>
          </div>

          <!-- 3. 优化的错误提示 -->
          <div v-if="error" class="error-message">
             <BaseIcon name="alert-triangle" />
            <p><strong>导入失败:</strong> {{ error }}</p>
          </div>
        </section>

        <footer class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">取消</button>
          <button type="button" class="btn-primary" @click="handleImport" :disabled="!file || processing">
            {{ processing ? '正在导入...' : '开始导入' }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { usePasswordStore } from '@/stores/password';
import { useToast } from '@/composables/useToast';
import ImportWorker from '@/workers/import.worker.js?worker';
import BaseIcon from '@/components/common/BaseIcon.vue';

// 修复 1: 直接调用 defineProps，不赋值给未使用的 'props' 变量
defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);

const store = usePasswordStore();
const { addToast } = useToast();

const file = ref(null);
const fileName = ref('');
const decryptionKey = ref('');
const processing = ref(false);
const statusMessage = ref('');
const error = ref('');
const isDraggingOver = ref(false);
const isFileEncrypted = ref(false);

const fileInput = ref(null);
const passwordInput = ref(null);

let worker = null;

// --- Web Worker 生命周期管理 ---
onMounted(() => {
  worker = new ImportWorker();
  worker.onmessage = handleWorkerMessage;
  worker.onerror = handleWorkerError;
});

onUnmounted(() => {
  if (worker) {
    worker.terminate();
  }
});

// --- UI 状态和逻辑 ---
function closeModal() {
  resetState();
  emit('close');
}

function resetState() {
  file.value = null;
  fileName.value = '';
  decryptionKey.value = '';
  processing.value = false;
  statusMessage.value = '';
  error.value = '';
  isDraggingOver.value = false;
  isFileEncrypted.value = false;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

watch(file, async (newFile) => {
  if (!newFile) {
    isFileEncrypted.value = false;
    return;
  }

  if (newFile.name.toLowerCase().includes('encrypted')) {
    isFileEncrypted.value = true;
  } else if (newFile.name.endsWith('.json')) {
    try {
      const content = await newFile.text();
      const data = JSON.parse(content);
      isFileEncrypted.value = !!(data && data.encryptedData);
    } catch { // 修复 2: 捕获错误但未使用，直接省略变量 'e'
      isFileEncrypted.value = false;
    }
  } else {
    isFileEncrypted.value = false;
  }

  if (isFileEncrypted.value) {
    await nextTick();
    passwordInput.value?.focus();
  }
});

// --- 文件拖拽处理 ---
// 修复 3: 省略未使用的 'event' 参数
function handleDragOver() {
  isDraggingOver.value = true;
}

// 修复 3: 省略未使用的 'event' 参数
function handleDragLeave() {
  isDraggingOver.value = false;
}

function handleDrop(event) {
  isDraggingOver.value = false;
  const droppedFiles = event.dataTransfer.files;
  if (!droppedFiles || droppedFiles.length === 0) return;
  const selectedFile = droppedFiles[0];
  if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.csv')) {
    selectFile(selectedFile);
  } else {
    error.value = '文件类型不支持。请选择 .json 或 .csv 文件。';
  }
}

// --- 文件选择处理 ---
function handleFileChange(event) {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    selectFile(selectedFile);
  }
}

function selectFile(selectedFile) {
  error.value = '';
  file.value = selectedFile;
  fileName.value = selectedFile.name;
}

// --- 核心导入逻辑 ---
async function handleImport() {
  if (!file.value) return;
  if (isFileEncrypted.value && !decryptionKey.value) {
    error.value = '这是一个加密文件，请输入解密密码。';
    passwordInput.value?.focus();
    return;
  }

  processing.value = true;
  error.value = '';
  statusMessage.value = '正在读取文件...';

  try {
    const fileContent = await file.value.text();
    statusMessage.value = '文件已发送至后台处理...';
    worker.postMessage({
      type: 'IMPORT_DATA',
      payload: {
        fileContent,
        fileName: file.value.name,
        decryptionKey: decryptionKey.value,
      },
    });
  } catch (readError) {
    handleReadError(readError);
  }
}

// --- Worker 消息和错误处理 ---
async function handleWorkerMessage(event) {
  const { status, payload } = event.data;

  switch (status) {
    case 'progress':
      statusMessage.value = payload;
      break;

    case 'success': { // 修复 4: 为 case 块添加花括号创建作用域
      const itemsToImport = payload;
      statusMessage.value = `正在将 ${itemsToImport.length} 个项目写入数据库...`;
      try {
        const count = await store.batchAddPasswords(itemsToImport);
        addToast({ message: `成功导入 ${count} 个密码！`, type: 'success' });
        closeModal();
      } catch (storeError) {
        handleStoreError(storeError);
      }
      break;
    }

    case 'error':
      handleProcessingError(payload);
      break;
  }
}

function handleWorkerError(err) {
  console.error('An unhandled error occurred in the import worker:', err);
  error.value = '后台处理时发生未知错误。';
  processing.value = false;
}

// --- 细分的错误处理函数 ---
function handleReadError(err) {
  console.error("文件读取失败:", err);
  error.value = "无法读取文件内容。";
  addToast({ message: `导入失败: ${error.value}`, type: 'error' });
  processing.value = false;
}

function handleStoreError(err) {
  console.error("写入数据库失败:", err);
  error.value = "数据写入数据库时出错。";
  addToast({ message: `导入失败: ${error.value}`, type: 'error', duration: 5000 });
  processing.value = false;
}

function handleProcessingError(payload) {
  console.error("导入失败:", payload);
  error.value = payload;
  addToast({ message: `导入失败: ${error.value}`, type: 'error', duration: 5000 });
  processing.value = false;
}
</script>

<style lang="scss" scoped>
/* 模态框通用样式 */
.modal-backdrop {
  position: fixed; z-index: 1050; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0); /* 加深背景 */
  display: flex; justify-content: center; align-items: center;
}
.modal {
  border: 1px solid #334155;
  color: #cbd5e1;
  border-radius: 12px; width: 90%; max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  display: flex; flex-direction: column;
  overflow: hidden; /* 防止内容溢出圆角 */
}
.modal-header {
  padding: 1rem 1.5rem; border-bottom: 1px solid #334155;
  display: flex; justify-content: space-between; align-items: center;
  background-color: #293548;
  h3 { margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.75rem; color: #f1f5f9; }
}
.btn-close {
  background: none; border: none; font-size: 1.75rem;
  color: #94a3b8; cursor: pointer; padding: 0; line-height: 1;
  transition: color 0.2s, transform 0.2s;
  &:hover { color: #f1f5f9; transform: rotate(90deg); }
}
.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1rem 1.5rem; border-top: 1px solid #334155;
  display: flex; justify-content: flex-end; gap: 0.75rem;
  background-color: #293548;
}

/* 按钮样式 */
.btn-primary, .btn-secondary {
  padding: 0.6rem 1.2rem; border-radius: 8px; border: none;
  font-weight: 500; cursor: pointer; transition: all 0.2s ease-in-out;
}
.btn-primary {
  background-color: #22c55e; /* 更亮的绿色 */
  color: #ffffff;
  &:hover:not(:disabled) { background-color: #16a34a; transform: translateY(-2px); }
  &:disabled { background-color: #334155; color: #64748b; cursor: not-allowed; }
}
.btn-secondary {
  background-color: #475569;
  color: #cbd5e1;
  &:hover { background-color: #64748b; }
}

/* --- 拖拽区域样式 --- */
.drop-zone {
  border: 2px dashed #475569;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #293548;
  position: relative;

  &.drag-over {
    border-color: #22c55e;
    background-color: rgba(34, 197, 94, 0.1);
    transform: scale(1.02);
  }
  &:hover {
     border-color: #64748b;
  }
}
.file-input {
  display: none; /* 隐藏原生 input */
}
.drop-zone-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  cursor: pointer;

  .drop-zone-icon {
    width: 48px;
    height: 48px;
    color: #64748b;
    transition: color 0.2s;
  }
  .file-name-display {
    color: #f1f5f9;
    font-weight: 500;
    word-break: break-all;
    padding: 0 1rem;
  }
  strong {
    color: #e2e8f0;
  }
  small {
    font-size: 0.8rem;
  }
}
.drop-zone:hover .drop-zone-icon {
  color: #94a3b8;
}

/* 密码输入框 */
.password-section-wrapper {
  margin-top: 1.5rem;
}
.password-input {
  width: 100%; padding: 0.8rem 1rem;
  background: #334155;
  border: 1px solid #475569;
  color: #cbd5e1;
  border-radius: 8px; font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }
}

/* --- 状态显示样式 --- */
.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  min-height: 200px;
}
.spinner {
  width: 40px; height: 40px; margin-bottom: 1.5rem;
  border: 4px solid #475569;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.status-message {
  color: #94a3b8;
  font-size: 1rem;
}

.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #f87171;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  p { margin: 0; }
}

/* 过渡动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>
