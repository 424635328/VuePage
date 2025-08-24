<!-- src/components/decoder/PasswordDecoder.vue -->

<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <button @click="closeModal" class="btn-close" aria-label="关闭">&times;</button>

        <div class="modal-content">
          <!-- 左侧：信息与标题 -->
          <div class="modal-info">
            <h3 class="modal-title-stylized">
              <span>密码</span>
              <span>解码</span>
              <span>器</span>
            </h3>
            <div class="info-group">
              <p class="info-label">输入</p>
              <p class="info-text">
                直接粘贴加密文件内容或纯加密字符串均可。
              </p>
            </div>
          </div>

          <!-- 右侧：表单与结果 -->
          <div class="modal-form">
            <div class="form-group">
              <textarea
                id="encrypted-text"
                v-model="encryptedText"
                rows="6"
                placeholder=" "
                :class="{ 'has-content': encryptedText }"
              ></textarea>
              <label for="encrypted-text">加密内容</label>
            </div>
            <div class="form-group">
              <input
                type="password"
                id="decryption-key"
                v-model="decryptionKey"
                placeholder=" "
                :class="{ 'has-content': decryptionKey }"
              />
               <label for="decryption-key">解密密码</label>
            </div>

            <button @click="handleDecrypt" class="decrypt-btn" :disabled="!encryptedText || !decryptionKey || isDecrypting">
              <div v-if="isDecrypting" class="spinner-small"></div>
              <span v-else>开始解码</span>
            </button>

            <transition name="result-fade" mode="out-in">
              <div v-if="error" class="result-panel error">
                <div class="result-icon"><BaseIcon name="alert-triangle" /></div>
                <div class="result-content">
                  <strong>解密失败</strong>
                  <p>{{ error }}</p>
                </div>
              </div>
              <div v-else-if="decryptedResult" class="result-panel success">
                <div class="result-icon"><BaseIcon name="check-shield" /></div>
                <div class="result-content">
                  <div class="result-header">
                    <strong>解密成功</strong>
                    <button @click="copyResult" class="copy-btn" title="复制到剪贴板">
                      <BaseIcon name="copy" /> {{ copyButtonText }}
                    </button>
                  </div>
                  <pre><code>{{ decryptedResult }}</code></pre>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'; // 移除了未使用的 computed
import { decryptData } from '@/utils/crypto';
import { useToast } from '@/composables/useToast';
import BaseIcon from '@/components/common/BaseIcon.vue';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['close']);
const { addToast } = useToast();

const encryptedText = ref('');
const decryptionKey = ref('');
const decryptedResult = ref(null);
const error = ref('');
const isDecrypting = ref(false);
const copyButtonText = ref('复制');

// --- 修复 1: 移除了未被使用的 'detectedFormat' computed 属性 ---
// const detectedFormat = computed(...) 已被删除

function resetState() {
  encryptedText.value = '';
  decryptionKey.value = '';
  decryptedResult.value = null;
  error.value = '';
  isDecrypting.value = false;
  copyButtonText.value = '复制';
}

function closeModal() {
  emit('close');
}

watch(() => props.show, (newVal) => {
  if (!newVal) {
    setTimeout(resetState, 300);
  }
});

async function handleDecrypt() {
  isDecrypting.value = true;
  error.value = '';
  decryptedResult.value = null;
  let textToDecrypt = encryptedText.value.trim();

  try {
    const parsedObject = JSON.parse(textToDecrypt);
    if (parsedObject && typeof parsedObject.encryptedData === 'string') {
      textToDecrypt = parsedObject.encryptedData;
    }
  } catch {
    // --- 修复 2 & 3: 为有意的空 catch 块添加注释，以满足 ESLint 规则 ---
    // 如果 JSON 解析失败，说明输入的是纯 Base64 字符串，这是正常情况，无需处理。
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const result = await decryptData(textToDecrypt, decryptionKey.value);

    try {
      const parsedJson = JSON.parse(result);
      decryptedResult.value = JSON.stringify(parsedJson, null, 2);
    } catch {
      // 同样，如果解密后的结果不是JSON，也静默处理，直接显示原文。
      decryptedResult.value = result;
    }

  } catch (e) {
    error.value = e.message || '文本格式无效或密码错误。';
  } finally {
    isDecrypting.value = false;
  }
}

function copyResult() {
  if (!decryptedResult.value) return;
  navigator.clipboard.writeText(decryptedResult.value).then(() => {
    copyButtonText.value = '已复制!';
    addToast({ message: '结果已复制到剪贴板', type: 'info' });
    setTimeout(() => {
      copyButtonText.value = '复制';
    }, 2000);
  });
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

/* --- 1. 整体设计与质感 --- */
.modal-backdrop {
  position: fixed; z-index: 1050; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(10, 10, 20, 0.7); /* 更深的背景，增加沉浸感 */
  backdrop-filter: blur(10px) saturate(120%); /* 增加饱和度，背景更生动 */
  display: flex; justify-content: center; align-items: center;
  padding: 1.5rem;
}

.modal {
  position: relative;
  width: 100%;
  max-width: 800px;
  border-radius: 16px;
  color: var(--text-primary, #e2e8f0);

  /* 核心：增加背景质感和辉光边框 */
  background: radial-gradient(circle at 50% 0%, #293548, #1e293b 70%);
  border: 1px solid var(--border-medium, #334155);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05) inset, /* 内发光 */
              0 25px 50px -12px rgba(0, 0, 0, 0.5); /* 更柔和深邃的阴影 */

  /* 伪元素模拟边框辉光 */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}

.btn-close {
  position: absolute; top: 1.25rem; right: 1.5rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  width: 32px; height: 32px;
  display: flex; justify-content: center; align-items: center;
  font-size: 1.5rem; line-height: 1;
  color: var(--text-secondary, #94a3b8); cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
  &:hover {
    color: var(--text-primary, #f1f5f9);
    background: rgba(255,255,255,0.1);
    transform: rotate(90deg) scale(1.1);
    box-shadow: 0 0 15px rgba(129, 140, 248, 0.3); /* 淡紫色辉光 */
  }
}

.modal-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr; /* 使用Grid布局更现代 */
  padding: 3rem;
  gap: 3.5rem; /* 增加间距，更有呼吸感 */
}

/* --- 2. 左侧信息区 - 视觉焦点 --- */
.modal-info {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中内容 */
  border-right: 1px solid var(--border-medium, #334155); /* 添加分隔线 */
  padding-right: 3.5rem;
}

.modal-title-stylized {
  font-weight: 800; /* 更粗的字重 */
  margin: 0;
  span {
    display: block;
    font-size: 3rem;
    line-height: 1.1;
    letter-spacing: 0.1em;
    /* 核心：文字渐变，打造视觉焦点 */
    background: linear-gradient(135deg, #a5b4fc, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
  }
}

.info-group {
  margin-top: 2rem;
  .info-label {
    font-weight: 600;
    color: var(--text-secondary, #94a3b8);
    text-transform: uppercase; /* 大写 + 字母间距，更具设计感 */
    letter-spacing: 0.05em;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
  .info-text {
    color: var(--text-secondary, #94a3b8);
    font-size: 0.95rem; /* 稍大一点更易读 */
    line-height: 1.7;
  }
}

/* --- 3. 右侧表单区 - 交互优化 --- */
.modal-form {
  display: flex; flex-direction: column; gap: 1.5rem;
}

.form-group {
  position: relative;

  input, textarea {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
    border-radius: 8px;
    resize: vertical;
    color: var(--text-primary, #e2e8f0);
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    transition: all 0.25s ease;

    /* 核心：改为暗色输入框，与整体风格统一 */
    background-color: rgba(15, 23, 42, 0.5); /* 半透明深色背景 */
    border: 1px solid var(--border-medium, #334155);

    &:focus {
      outline: none;
      background-color: rgba(15, 23, 42, 0.8);
      /* 焦点辉光效果 */
      border-color: var(--primary-light, #818cf8);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
  }
  textarea { min-height: 120px; }

  label {
    position: absolute;
    left: 1rem;
    top: 1rem;
    color: var(--text-secondary, #94a3b8);
    pointer-events: none;
    transition: all 0.25s ease;
    /* 核心：背景色与modal背景一致，实现完美"剪切"效果 */
    background-color: var(--bg-secondary, #1e293b);
    padding: 0 0.35rem;
  }

  input:focus + label,
  input.has-content + label,
  textarea:focus + label,
  textarea.has-content + label {
    transform: translateY(-1.85rem) scale(0.85);
    color: var(--primary-light, #a5b4fc);
    /* 核心：由于背景色变化，需要确保label背景和新的渐变背景融合 */
    background-image: linear-gradient(to bottom, #293548, #1e293b);
  }
}

.decrypt-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  padding: 1rem 1.5rem; border: none; border-radius: 8px;
  font-weight: 600; cursor: pointer; transition: all 0.3s ease;
  font-size: 1rem; color: #fff;
  margin-top: 0.5rem;

  /* 核心：渐变按钮 + 悬停效果 */
  background-image: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 15px -5px rgba(139, 92, 246, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 7px 20px -5px rgba(139, 92, 246, 0.6);
  }
  &:active:not(:disabled) {
    transform: translateY(-1px) scale(0.99);
  }
  &:disabled {
    cursor: not-allowed;
    background-image: none;
    background-color: #374151;
    opacity: 0.6;
    box-shadow: none;
  }
}
.spinner-small { /* 无需改动 */ }

/* --- 4. 结果面板 --- */
.result-panel {
  display: flex; gap: 1rem; padding: 1.25rem;
  border-radius: 12px; border-width: 1px; border-style: solid;
  margin-top: 1rem;

  .result-icon { /* 无需改动 */ }
  .result-content { flex-grow: 1; }
  strong { font-weight: 600; }

  &.error { /* 颜色微调 */
    background-color: rgba(248, 113, 113, 0.05);
    border-color: rgba(248, 113, 113, 0.3);
    color: #fca5a5;
    .result-icon { background-color: rgba(248, 113, 113, 0.1); color: #f87171; }
  }
  &.success { /* 颜色微调 */
    background-color: rgba(52, 211, 153, 0.05);
    border-color: rgba(52, 211, 153, 0.3);
    color: var(--text-primary);
    .result-icon { background-color: rgba(52, 211, 153, 0.1); color: #34d399; }
  }

  .result-header { /* 无需改动 */ }
  pre {
    background-color: rgba(15, 23, 42, 0.7); /* 与输入框背景统一 */
    border: 1px solid var(--border-medium, #334155);
    /* 更多细节 */
    padding: 1rem; border-radius: 8px; max-height: 150px; overflow-y: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.9rem;
    white-space: pre-wrap; word-break: break-all;
  }
  .copy-btn { /* 样式微调 */
    background: transparent; border: 1px solid var(--border-medium);
    color: var(--text-secondary); padding: 0.25rem 0.75rem; border-radius: 6px;
    cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
    transition: all 0.2s ease;
    &:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      border-color: var(--border-light);
    }
  }
}

/* --- 5. 动画与响应式 --- */
@media (max-width: 768px) {
  .modal-content {
    grid-template-columns: 1fr; /* 切换为单列 */
    padding: 2rem 1.5rem; gap: 2rem;
  }
  .modal-info {
    border-right: none; /* 移除竖线 */
    border-bottom: 1px solid var(--border-medium, #334155); /* 改为横线 */
    padding-right: 0; padding-bottom: 2rem;
    align-items: center; text-align: center;
  }
  .modal-title-stylized span { font-size: 2.5rem; }
}

/* 优化过渡效果 */
.modal-fade-enter-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-fade-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

.result-fade-enter-active { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.result-fade-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.result-fade-enter-from { opacity: 0; transform: translateY(15px); }
.result-fade-leave-to { opacity: 0; transform: translateY(-10px); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
