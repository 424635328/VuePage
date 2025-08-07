// src/stores/toast.js

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 定义一个用于管理全局 Toast 通知的 Pinia store。
 * 这个 store 允许应用中的任何组件或模块触发一个短暂的、自动消失的通知消息。
 * 这对于提供用户操作的即时反馈（如成功、失败、信息提示）非常有用。
 */
export const useToastStore = defineStore('toast', () => {
  // --- STATE ---
  // ref() 创建了响应式状态，当它们的值改变时，监听它们的组件会自动更新。

  // `message`: 要在 Toast 通知中显示的文本内容。
  const message = ref('')

  // `type`: Toast 通知的类型，主要用于UI组件决定其样式（如颜色）。
  // 默认为 'success'（成功，通常是绿色），也可以是 'error'（失败，通常是红色）等。
  const type = ref('success')

  // `visible`: 控制 Toast 通知的可见性。true 表示显示，false 表示隐藏。
  // UI组件会监听这个值的变化来执行显示/隐藏的动画。
  const visible = ref(false)

  // `timeoutId`: 一个普通的变量（不是 ref，因为它不需要是响应式的），用于存储 setTimeout 返回的ID。
  // 这对于管理和清除计时器至关重要。
  let timeoutId = null

  // --- ACTIONS ---

  /**
   * 显示一个 Toast 通知。
   * 这是该 store 的核心公共方法。
   *
   * @param {object} options - 配置对象
   * @param {string} options.msg - 要显示的消息文本。
   * @param {string} [options.toastType='success'] - 通知的类型 ('success' 或 'error')。
   * @param {number} [options.duration=3000] - 通知显示的持续时间（以毫秒为单位）。
   */
  function showToast({ msg, toastType = 'success', duration = 3000 }) {
    // 如果上一个 Toast 的隐藏计时器还在运行，则立即清除它。
    // 这可以防止新 Toast 被旧计时器过早地关闭。
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // 更新 store 的状态，这些变化会立即反映到监听此 store 的 UI 组件上。
    message.value = msg
    type.value = toastType
    visible.value = true

    // 设置一个新的计时器，在指定的 `duration` 后自动隐藏 Toast。
    timeoutId = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  // 返回 store 的公共 API，包括状态和可以调用的方法。
  return { message, type, visible, showToast }
})
