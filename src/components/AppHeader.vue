<!-- src/components/AppHeader.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/auth/AuthModal.vue'

const authStore = useAuthStore()
const route = useRoute()

const isMobileMenuOpen = ref(false)
const isAuthModalOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const isScrolled = ref(false)
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

// 根据当前路由判断是否在 Shop 页面
const isOnShopPage = computed(() => route.name === 'shop')

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header class="app-header" :class="{ scrolled: isScrolled }">
    <div class="container header-content">
      <RouterLink to="/" class="logo" @click="closeMobileMenu">
        <img src="/LOGO.jpeg" alt="公司 Logo" />
        <span>MHStudio</span>
      </RouterLink>

      <nav class="desktop-nav">
        <ul>
          <li><RouterLink to="/">首页</RouterLink></li>
          <li><RouterLink to="/projects">产品</RouterLink></li>
          <li><RouterLink to="/shop">商店</RouterLink></li>
          <li><RouterLink to="/contact">联系我们</RouterLink></li>
        </ul>
      </nav>

      <div class="header-actions">
        <!-- 桌面端的认证按钮 -->
        <template v-if="isOnShopPage">
          <button v-if="authStore.user" @click="authStore.signOut()" class="cta-button auth-button">
            注销
          </button>
          <button v-else @click="isAuthModalOpen = true" class="cta-button auth-button">
            登录
          </button>
        </template>
        <RouterLink v-else to="/contact" class="cta-button">立即咨询</RouterLink>

        <button class="hamburger" @click="toggleMobileMenu" aria-label="打开菜单" :aria-expanded="isMobileMenuOpen">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>

    <!-- 移动端导航 -->
    <transition name="slide-fade">
      <nav v-if="isMobileMenuOpen" class="mobile-nav">
        <ul>
          <li><RouterLink to="/" @click="toggleMobileMenu">首页</RouterLink></li>
          <li><RouterLink to="/projects" @click="toggleMobileMenu">产品</RouterLink></li>
          <li><RouterLink to="/shop" @click="toggleMobileMenu">商店</RouterLink></li>
          <li><RouterLink to="/contact" @click="toggleMobileMenu">联系我们</RouterLink></li>
          <li class="mobile-cta-item">
             <template v-if="isOnShopPage">
                <button v-if="authStore.user" @click="authStore.signOut(); closeMobileMenu();" class="cta-button-mobile">注销</button>
                <button v-else @click="isAuthModalOpen = true; closeMobileMenu();" class="cta-button-mobile">登录</button>
             </template>
             <RouterLink v-else to="/contact" class="cta-button-mobile" @click="toggleMobileMenu">
              立即咨询
            </RouterLink>
          </li>
        </ul>
      </nav>
    </transition>

    <!-- 认证模态框 -->
    <AuthModal v-model:active="isAuthModalOpen" />
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

/* 保持原有样式... */
.app-header {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  padding: 1rem 0;
  transition: background-color 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease, padding 0.3s ease;
  border-bottom: 1px solid transparent;
}

.app-header.scrolled {
  padding: 0.75rem 0;
  background-color: rgba(26, 26, 26, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: $header-height;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-heading);
  font-size: 1.5rem;
  font-weight: 600;
}
.logo img {
  width: 40px;
  height: 40px;
}

.desktop-nav ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
}
.desktop-nav a {
  color: var(--color-text);
  font-size: 1rem;
  padding: 0.5rem 0;
  position: relative;
}
.desktop-nav a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 0;
  background-color: var(--color-primary);
  transition: width 0.3s;
}
.desktop-nav a:hover,
.desktop-nav a.router-link-exact-active {
  color: var(--color-heading);
}
.desktop-nav a.router-link-exact-active::after {
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cta-button {
  display: inline-block;
  background-color: var(--color-primary);
  color: #1a1a1a;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: var(--color-primary-dark);
  }
}

.auth-button {
    background-color: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);

    &:hover {
        background-color: var(--color-primary);
        color: #1a1a1a;
    }
}

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 2000;
  .bar {
    display: block;
    width: 2rem;
    height: 3px;
    background-color: var(--color-heading);
    border-radius: 2px;
    transition: all 0.3s ease-in-out;
  }
}

.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(15px);
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1500;
  ul { list-style: none; padding: 0; text-align: center; }
  li { margin: 1.5rem 0; }
  a { color: var(--color-heading); font-size: 2rem; font-weight: bold; }
}

.mobile-cta-item {
  margin-top: 2.5rem !important;
}

.cta-button-mobile {
  display: inline-block;
  background: var(--color-primary);
  color: #1a1a1a;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  min-width: 150px;
  text-align: center;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (max-width: $breakpoint-md) {
  .desktop-nav, .header-actions .cta-button {
    display: none;
  }
  .hamburger {
    display: flex;
  }
  .mobile-nav {
    display: flex;
  }
}
</style>
