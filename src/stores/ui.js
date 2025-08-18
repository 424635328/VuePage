// src/stores/ui.js

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // --- State ---

  // 原有状态
  const isMobileMenuOpen = ref(false)
  const isConfigPanelVisible = ref(false)

  const isRedirecting = ref(false)
  const redirectMessage = ref('')
  // 使用 'loading', 'success', 'error' 来管理不同状态的样式和图标
  const redirectStatus = ref('loading') // 'loading' | 'success' | 'error'
  // 用于存储 setTimeout 的 ID，以便在连续触发时清除上一个定时器
  let hideTimeout = null

  // --- Actions ---

  // 原有方法
  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function toggleConfigPanel() {
    isConfigPanelVisible.value = !isConfigPanelVisible.value
  }


  /**
   * 开始一个带提示的跳转
   * @param {string} message - 加载时显示的提示语
   */
  function startRedirect(message = '正在跳转，请稍候...') {
    clearTimeout(hideTimeout) // 如果上次的消失定时器还在，先清除
    isRedirecting.value = true
    redirectStatus.value = 'loading'
    redirectMessage.value = message
  }

  /**
   * 跳转成功后调用
   * @param {string} message - 成功时显示的提示语
   */
  function endRedirectSuccess(message = '操作成功，已跳转') {
    isRedirecting.value = true // 确保提示框仍然可见
    redirectStatus.value = 'success'
    redirectMessage.value = message

    // 1.5秒后自动隐藏
    hideTimeout = setTimeout(() => {
      hideRedirect()
    }, 1500)
  }

  /**
   * 跳转失败后调用
   * @param {string} message - 失败时显示的提示语
   */
  function endRedirectError(message = '跳转失败，请重试') {
    isRedirecting.value = true // 确保提示框仍然可见
    redirectStatus.value = 'error'
    redirectMessage.value = message

    // 2.5秒后自动隐藏
    hideTimeout = setTimeout(() => {
      hideRedirect()
    }, 2500)
  }

  /**
   * 隐藏提示框并重置状态
   */
  function hideRedirect() {
    isRedirecting.value = false
    // 延迟重置文本内容，避免在淡出动画中内容突然消失
    setTimeout(() => {
      redirectMessage.value = ''
      redirectStatus.value = 'loading'
    }, 300) // 300ms 应与 CSS 过渡时间一致
  }

  return {
    // 原有导出
    isMobileMenuOpen,
    toggleMobileMenu,
    isConfigPanelVisible,
    toggleConfigPanel,

    isRedirecting,
    redirectMessage,
    redirectStatus,
    startRedirect,
    endRedirectSuccess,
    endRedirectError,
    hideRedirect,
  }
})
