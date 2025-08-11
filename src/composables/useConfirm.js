// src/composables/useConfirm.js

import { ref, readonly } from 'vue'

// --- State (Singleton) ---
// 这些状态定义在函数外部，因此它们在整个应用中是共享的，只创建一次。
const isShowing = ref(false)
const title = ref('')
const message = ref('')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')

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
   * @returns {Promise<boolean>} - 用户点击确认时解析为 true，点击取消或关闭时解析为 false
   */
  const showConfirm = (options) => {
    isShowing.value = true
    title.value = options.title
    message.value = options.message
    confirmText.value = options.confirmText || 'Confirm'
    cancelText.value = options.cancelText || 'Cancel'

    // 返回一个 Promise，等待用户的操作
    return new Promise((resolve) => {
      promiseResolver = resolve
    })
  }

  // --- Internal handlers ---
  // 这些函数将被 ConfirmDialog.vue 组件调用

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
    promiseResolver = null
  }

  return {
    // 将状态作为 readonly 暴露，以防止外部直接修改
    isShowing: readonly(isShowing),
    title: readonly(title),
    message: readonly(message),
    confirmText: readonly(confirmText),
    cancelText: readonly(cancelText),

    // 暴露给外部使用的方法
    showConfirm,

    // 暴露给 ConfirmDialog.vue 组件内部使用的方法
    handleConfirm,
    handleCancel,
  }
}
