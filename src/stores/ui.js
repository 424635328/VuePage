// src/stores/ui.js

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // --- State ---
  const isMobileMenuOpen = ref(false)

  // [新增] 背景配置面板的可见性状态
  const isConfigPanelVisible = ref(false)

  // --- Actions ---
  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  // [新增] 切换背景配置面板的可见性
  function toggleConfigPanel() {
    isConfigPanelVisible.value = !isConfigPanelVisible.value
  }

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    // [新增] 导出新的状态和方法
    isConfigPanelVisible,
    toggleConfigPanel,
  }
})
