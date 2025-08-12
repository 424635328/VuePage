<!-- src/App.vue -->

<script setup>
import { onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './stores/auth';

// 导入所有需要的 UI 组件
import AuroraBackground from './components/AuroraBackground.vue';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import AppToast from './components/common/AppToast.vue';
import ConfirmDialog from './components/global/ConfirmDialog.vue';

// 初始化 Pinia store 和 Vue Router
const authStore = useAuthStore();
const router = useRouter();

// onMounted 钩子会在组件挂载后执行，是执行初始化逻辑的最佳位置。
onMounted(() => {
  /**
   * 1. 检查用户初始状态
   *    在应用加载时立即调用，尝试从 localStorage 或有效的 cookie 中恢复会话，
   *    确保刷新页面后用户仍保持登录状态。
   */
  authStore.checkUser();

  /**
   * 2. 设置 Supabase 认证状态变化监听器
   *    这是一个实时监听器，当任何认证事件发生时（如登录、登出、密码重置等），
   *    它都会被触发。
   */
  supabase.auth.onAuthStateChange((event, session) => {
    // 任何情况下，都将最新的 session 信息同步到 Pinia store，保持状态一致
    authStore.setSession(session);

    if (event === 'PASSWORD_RECOVERY') {
      console.log('检测到密码恢复事件，正在重定向到密码更新页面...');
      // 当用户通过邮件链接访问时，Supabase 会触发此事件。
      // 我们捕获到这个事件后，立即将用户导航到我们为此创建的专门页面。
      router.push({ name: 'update-password' });
    }
  });
});
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
  </div>
</template>

<style lang="scss">
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* 背景色通常在全局样式（如 main.scss）的 body 或 html 标签上设置 */
}

.main-content {
  /*
   * 这是实现“粘性页脚”布局的关键。
   * flex-grow: 1;（或者简写为 flex: 1;）
   * 它告诉 main 元素占据父容器（.app-container）中所有可用的剩余垂直空间。
   * 这会将 AppFooter “推”到页面的最底部，无论 main 的内容是多是少。
  */
  flex-grow: 1;
  width: 100%; // 保持宽度为100%
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
