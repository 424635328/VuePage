// src/store/ui.js

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // state
  const isMobileMenuOpen = ref(false)

  // actions
  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  return { isMobileMenuOpen, toggleMobileMenu }
})
