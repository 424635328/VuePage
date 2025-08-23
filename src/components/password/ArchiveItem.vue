<!-- src/components/password/ArchiveItem.vue -->

<template>
  <div class="archive-item">
    <div class="item-main">
      <div class="item-info">
        <strong class="platform">{{ item.platform }}</strong>
        <span class="label">{{ item.label }}</span>
        <div class="password-field" @click="togglePasswordVisibility" title="点击显示/隐藏密码">
          <span v-if="!isPasswordVisible" class="password-masked">••••••••••••</span>
          <span v-else class="password-visible">{{ item.password }}</span>
        </div>
      </div>
      <div class="item-actions">
        <button @click.stop="copyItemPassword" :title="copied ? '已复制!' : '复制密码'">
          <i :class="['fas', copied ? 'fa-check' : 'fa-copy']"></i>
        </button>
        <button @click.stop="confirmDelete" class="delete-btn" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div v-if="item.notes" class="item-notes">
      <p><strong>备注:</strong> {{ item.notes }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePasswordStore } from '@/stores/password'
import { useClipboard } from '@vueuse/core'
import { useToast } from '@/composables/useToast' // 引入您的 useToast

const props = defineProps({
  item: { type: Object, required: true }
})

const store = usePasswordStore()
const { copy, copied } = useClipboard({ timeout: 2000 })
const { addToast } = useToast() // 获取 addToast 方法

const isPasswordVisible = ref(false)
let visibilityTimer = null

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value

  // 如果密码变为可见，设置一个计时器在5秒后自动隐藏
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

async function confirmDelete() {
  if (window.confirm(`确定要永久删除 "${props.item.platform} - ${props.item.label}" 的密码吗？此操作不可撤销。`)) {
    try {
      await store.deletePassword(props.item.id)
      addToast({ message: '密码已成功删除', type: 'info' })
    } catch (error) {
      addToast({ message: error.message || '删除失败，请重试。', type: 'error' })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 样式与前一版本完全相同，此处省略以保持简洁 */
.archive-item { background: #1e1e2f; border: 1px solid #4a4a6a; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; transition: background 0.2s, box-shadow 0.2s; &:hover { background: #252538; box-shadow: 0 4px 15px rgba(0,0,0,0.2); } }
.item-main { display: flex; justify-content: space-between; align-items: center; }
.item-info { display: flex; flex-direction: column; gap: 0.25rem; overflow: hidden; }
.platform { font-size: 1.1rem; color: #fff; font-weight: 600; }
.label { color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.password-field { cursor: pointer; }
.password-masked { font-family: 'Courier New', Courier, monospace; color: #888; font-size: 1.2rem; user-select: none; }
.password-visible { font-family: 'Courier New', Courier, monospace; color: #3ecf8e; font-size: 1.1rem; font-weight: bold; word-break: break-all; }
.item-actions { display: flex; gap: 0.75rem; flex-shrink: 0; margin-left: 1rem; }
.item-actions button { background: none; border: none; color: #aaa; cursor: pointer; font-size: 1rem; padding: 0.5rem; border-radius: 50%; width: 36px; height: 36px; display: grid; place-content: center; transition: all 0.2s; &:hover { color: #fff; background: #4a4a6a; } &.delete-btn:hover { color: #fff; background: #ff6b6b; } }
.item-notes { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #4a4a6a; }
.item-notes p { margin: 0; font-size: 0.9rem; color: #ccc; white-space: pre-wrap; word-break: break-all; }
</style>
