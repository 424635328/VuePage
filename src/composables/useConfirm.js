// src/composables/useConfirm.js

import { ref, readonly } from 'vue'

// --- State (Singleton) ---
const isShowing = ref(false)
const title = ref('')
const message = ref('')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')
const type = ref('default') // ✨ 新增: 用于控制对话框类型 ('default', 'danger')

// 用于解决 Promise 的函数
let promiseResolver = null

// --- The Composable Function ---
export function useConfirm() {
  /**
   * 显示确认模态框。
   * @param {object} options - 配置对象
   * @param {string} options.title - 模态框的标题
   * @param {string} options.message - 模态框的消息文本
   * @param {string} [options.confirmText='Confirm'] - 确认按钮的文本
   * @param {string} [options.cancelText='Cancel'] - 取消按钮的文本
   * @param {'default'|'danger'} [options.type='default'] - 对话框的类型，影响样式和图标
   */
  const showConfirm = (options) => {
    isShowing.value = true
    title.value = options.title
    message.value = options.message
    confirmText.value = options.confirmText || 'Confirm'
    cancelText.value = options.cancelText || 'Cancel'
    type.value = options.type || 'default' // ✨ 新增: 从选项中设置类型

    // 返回一个 Promise，等待用户的操作
    return new Promise((resolve) => {
      promiseResolver = resolve
    })
  }

  // --- Internal handlers ---
  const handleConfirm = () => {
    if (promiseResolver) {
      promiseResolver(true)
    }
    resetState()
  }

  const handleCancel = () => {
    if (promiseResolver) {
      promiseResolver(false)
    }
    resetState()
  }

  const resetState = () => {
    isShowing.value = false
    title.value = ''
    message.value = ''
    confirmText.value = 'Confirm'
    cancelText.value = 'Cancel'
    type.value = 'default' // ✨ 新增: 重置类型状态
    promiseResolver = null
  }

  return {
    // 将状态作为 readonly 暴露
    isShowing: readonly(isShowing),
    title: readonly(title),
    message: readonly(message),
    confirmText: readonly(confirmText),
    cancelText: readonly(cancelText),
    type: readonly(type), // ✨ 新增: 暴露 type 状态

    // 暴露给外部使用的方法
    showConfirm,

    // 暴露给 ConfirmDialog.vue 组件内部使用的方法
    handleConfirm,
    handleCancel,
  }
}
