// src/stores/toast.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const type = ref('success') // 'success' or 'error'
  const visible = ref(false)
  let timeoutId = null

  function showToast({ msg, toastType = 'success', duration = 3000 }) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    message.value = msg
    type.value = toastType
    visible.value = true

    timeoutId = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  return { message, type, visible, showToast }
})
