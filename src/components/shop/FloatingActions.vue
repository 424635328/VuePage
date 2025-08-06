<!-- src/components/shop/FloatingActions.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineEmits(['add']);

const showScrollTop = ref(false);

const handleScroll = () => {
  // 当滚动超过半屏时显示按钮
  showScrollTop.value = window.scrollY > window.innerHeight / 2;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const scrollToBottom = () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="floating-action-group">
    <transition name="fab-fade">
      <button v-if="showScrollTop" @click="scrollToTop" class="fab" aria-label="滚动到顶部">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
      <button v-else @click="scrollToBottom" class="fab" aria-label="滚动到底部">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </button>
    </transition>
    <button @click="$emit('add')" class="fab add-fab" aria-label="新增商品">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14m-7-7h14" />
      </svg>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.floating-action-group {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  /* <-- 这是唯一的改动 */
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background-color: var(--color-background-soft);
  color: var(--color-heading);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
}

.add-fab {
  background-color: var(--color-primary);
  color: #1a1a1a;
}

.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
