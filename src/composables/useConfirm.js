// src/composables/useConfirm.js
import { ref, readonly } from 'vue'

// Singleton state - one dialog instance for the entire app
const isShowing = ref(false)
const title = ref('')
const message = ref('')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')
const type = ref('info') // 'info' (default) or 'danger'

let promiseResolver = null

export function useConfirm() {
  /**
   * Shows the confirmation dialog.
   * @param {object} options - The configuration for the dialog.
   * @param {string} options.title - The title of the dialog.
   * @param {string} options.message - The message content. Can include HTML.
   * @param {string} [options.confirmText='Confirm'] - Text for the confirm button.
   * @param {string} [options.cancelText='Cancel'] - Text for the cancel button.
   * @param {'info'|'danger'} [options.type='info'] - The type of dialog, affects styling.
   * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
   */
  const showConfirm = (options) => {
    isShowing.value = true
    title.value = options.title
    message.value = options.message
    confirmText.value = options.confirmText || 'Confirm'
    cancelText.value = options.cancelText || 'Cancel'
    type.value = options.type || 'info'

    return new Promise((resolve) => {
      promiseResolver = resolve
    })
  }

  const resetState = () => {
    // We don't hide it immediately. The component will hide itself after the leave animation.
    title.value = ''
    message.value = ''
    confirmText.value = 'Confirm'
    cancelText.value = 'Cancel'
    type.value = 'info'
    promiseResolver = null
  }

  const handleConfirm = () => {
    if (promiseResolver) {
      promiseResolver(true)
    }
    isShowing.value = false // Trigger the leave animation
  }

  const handleCancel = () => {
    if (promiseResolver) {
      promiseResolver(false)
    }
    isShowing.value = false // Trigger the leave animation
  }

  // This will be called by the component after the leave transition ends
  const onAfterLeave = () => {
    resetState()
  }

  return {
    // Readonly state for the component
    isShowing: readonly(isShowing),
    title: readonly(title),
    message: readonly(message),
    confirmText: readonly(confirmText),
    cancelText: readonly(cancelText),
    type: readonly(type),

    // Method to be called from anywhere in the app
    showConfirm,

    // Methods for the component's internal use
    handleConfirm,
    handleCancel,
    onAfterLeave,
  }
}
