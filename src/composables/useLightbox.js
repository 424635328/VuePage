// src/composables/useLightbox.js

import { ref, watch, computed, nextTick } from 'vue';

export function useLightbox(images) {
  const isLightboxOpen = ref(false);
  const activeIndex = ref(0);
  const lightboxRef = ref(null); // Ref to the lightbox root element

  const currentImage = computed(() => {
    if (!isLightboxOpen.value || !images.value[activeIndex.value]) return null;
    return images.value[activeIndex.value];
  });

  // --- Image Preloading ---
  const preloadImage = (index) => {
    if (index < 0 || index >= images.value.length) return;
    const img = new Image();
    img.src = images.value[index].image_url;
  };

  // --- Focus Trap ---
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let firstFocusableEl = null;
  let lastFocusableEl = null;

  const handleFocusTrap = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus();
        e.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  };

  // --- Core Functions ---
  const open = (startIndex) => {
    activeIndex.value = startIndex;
    isLightboxOpen.value = true;
  };

  const close = () => {
    isLightboxOpen.value = false;
  };

  const next = () => {
    if (images.value.length < 2) return;
    activeIndex.value = (activeIndex.value + 1) % images.value.length;
  };

  const prev = () => {
    if (images.value.length < 2) return;
    activeIndex.value = (activeIndex.value - 1 + images.value.length) % images.value.length;
  };

  // --- Event Handling and Lifecycle ---
  const handleKeydown = (e) => {
    if (!isLightboxOpen.value) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  watch(isLightboxOpen, async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeydown);

      // Preload next and previous images
      preloadImage(activeIndex.value + 1);
      preloadImage(activeIndex.value - 1);

      // Setup focus trap
      await nextTick(); // Wait for DOM to be ready
      if (lightboxRef.value) {
        const focusables = lightboxRef.value.querySelectorAll(focusableElements);
        firstFocusableEl = focusables[0];
        lastFocusableEl = focusables[focusables.length - 1];
        firstFocusableEl?.focus();
        lightboxRef.value.addEventListener('keydown', handleFocusTrap);
      }
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeydown);
      if (lightboxRef.value) {
        lightboxRef.value.removeEventListener('keydown', handleFocusTrap);
      }
    }
  });

  watch(activeIndex, (newIndex, oldIndex) => {
      // Preload the next image in the direction of navigation
      if(newIndex > oldIndex) {
          preloadImage(newIndex + 1);
      } else {
          preloadImage(newIndex - 1);
      }
  });


  return {
    isLightboxOpen,
    activeIndex,
    currentImage,
    lightboxRef,
    open,
    close,
    next,
    prev,
  };
}
