// src/composables/useToast.js

import { ref, readonly } from 'vue'
import { v4 as uuidv4 } from 'uuid'

// --- State (Singleton) ---
// 使用一个数组来存储所有当前显示的 Toast 通知
const toasts = ref([])

// --- The Composable Function ---
export function useToast() {
  /**
   * 添加一个新的 Toast 通知。
   * @param {object} options - 配置对象
   * @param {string} options.message - Toast 的消息文本
   * @param {string} [options.type='info'] - Toast 类型 ('success', 'error', 'info', 'warning')
   * @param {number} [options.duration=3000] - 显示时长 (毫秒)
   */
  const addToast = (options) => {
    const id = uuidv4() // 为每个 Toast 生成唯一 ID
    const toast = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
    }

    toasts.value.unshift(toast) // 将新 Toast 添加到数组顶部

    // 设置一个计时器，在指定时长后自动移除该 Toast
    setTimeout(() => {
      removeToast(id)
    }, toast.duration)
  }

  /**
   * 通过 ID 移除一个 Toast 通知。
   * @param {string} id - 要移除的 Toast 的 ID
   */
  const removeToast = (id) => {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  return {
    // 将 toasts 数组作为 readonly 暴露，以供 AppToast.vue 使用
    toasts: readonly(toasts),

    // 暴露给外部使用的方法
    addToast,
    removeToast,
  }
}
