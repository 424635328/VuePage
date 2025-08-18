<!-- src/App.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue' // 导入 ref 和 onUnmounted
import { RouterView, useRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'
import { useAuthStore } from './stores/auth'

// 导入所有需要的 UI 组件
import AuroraBackground from './components/AuroraBackground.vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AppToast from './components/common/AppToast.vue'
import ConfirmDialog from './components/global/ConfirmDialog.vue'
import AuthModal from './components/auth/AuthModal.vue'
// --- [新增] 1. 导入新的全局跳转提示组件 ---
import GlobalRedirectingTip from './components/GlobalRedirectingTip.vue'

// 初始化 Pinia store 和 Vue Router
const authStore = useAuthStore()
const router = useRouter()

// AuthModal 的状态控制
const isAuthModalActive = ref(false)

const handleOpenAuthModal = () => {
  isAuthModalActive.value = true
}

const handleCloseAuthModal = () => {
  isAuthModalActive.value = false
}

onMounted(() => {
  // 检查用户初始状态
  authStore.checkUser()

  // 设置 Supabase 认证状态变化监听器
  supabase.auth.onAuthStateChange((event, session) => {
    authStore.setSession(session)

    if (event === 'SIGNED_IN') {
      handleCloseAuthModal()
    }

    if (event === 'PASSWORD_RECOVERY') {
      console.log('检测到密码恢复事件，正在重定向到密码更新页面...')
      router.push({ name: 'update-password' })
    }
  })

  // 添加全局事件监听器
  window.addEventListener('open-auth-modal', handleOpenAuthModal)
})

onUnmounted(() => {
  // 在组件卸载时移除监听器，防止内存泄漏
  window.removeEventListener('open-auth-modal', handleOpenAuthModal)
})
</script>

<template>
  <div class="app-container">
    <AuroraBackground />
    <AppHeader />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <AppFooter />

    <!-- 全局UI组件层 -->
    <!-- 这些组件不属于任何特定页面，而是为整个应用提供服务 -->

    <!-- 现有的 Toast 通知组件 -->
    <AppToast />

    <!-- ConfirmDialog 组件 -->
    <ConfirmDialog />

    <!-- AuthModal 组件 -->
    <AuthModal
      :active="isAuthModalActive"
      @update:active="isAuthModalActive = $event"
      @close="handleCloseAuthModal"
    />

    <!-- --- [新增] 2. 渲染全局跳转提示组件 --- -->
    <!-- 该组件会监听 uiStore 的状态，并在需要时自动显示/隐藏 -->
    <GlobalRedirectingTip />
  </div>
</template>

<style lang="scss">
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  width: 100%;
}

/* 页面切换过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
