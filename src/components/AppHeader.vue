<!-- src/components/AppHeader.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/auth/AuthModal.vue'

// --- 核心依赖和状态 ---
const authStore = useAuthStore()
const route = useRoute()

// --- 响应式状态定义 ---
const isMobileMenuOpen = ref(false)
const isAuthModalOpen = ref(false)
const isScrolled = ref(false)

// --- 计算属性 (Computed Properties for Clean Templates) ---

// **改动 1: 简化并重构计算属性，使其更符合新逻辑**

const currentRouteName = computed(() => route.name)
const isAuthenticated = computed(() => !!authStore.user)

// 控制是否显示登录/注销按钮的逻辑
const showAuthAction = computed(() => {
  return ['home', 'shop'].includes(currentRouteName.value)
})

// 控制主要 CTA 按钮的逻辑
const ctaAction = computed(() => {
  const name = currentRouteName.value
  if (name === 'projects') {
    // 在首页、商店、产品页，CTA 指向“关于我们”
    return { text: '关于我们', to: '/about' }
  }
  if (name === 'about') {
    // 在关于我们页，CTA 指向“联系我们”
    return { text: '联系我们', to: '/contact' }
  }
  // 在其他页面 (如/contact) 不显示 CTA 按钮
  return null
})

// --- 方法 (Methods) ---

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const openAuthModal = () => {
  closeMobileMenu()
  isAuthModalOpen.value = true
}

const handleLogout = () => {
  closeMobileMenu()
  authStore.signOut()
}

// ... 其余 script 部分保持不变 ...
let scrollTimeout = null
const handleScroll = () => {
  if (scrollTimeout === null) {
    scrollTimeout = setTimeout(() => {
      isScrolled.value = window.scrollY > 10
      scrollTimeout = null
    }, 100)
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})

watch(() => route.fullPath, () => {
  closeMobileMenu()
})

watch([isMobileMenuOpen, isAuthModalOpen], ([isMenuOpen, isModalOpen]) => {
  if (isMenuOpen || isModalOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="app-header" :class="{ scrolled: isScrolled, 'menu-open': isMobileMenuOpen }">
    <div class="container header-content">
      <RouterLink to="/" class="logo">
        <img src="/LOGO.jpeg" alt="公司 Logo" />
        <span>MHStudio</span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="主导航">
        <ul>
          <li><RouterLink to="/">首页</RouterLink></li>
          <li><RouterLink to="/shop">商店</RouterLink></li>
          <li><RouterLink to="/projects">产品</RouterLink></li>
        </ul>
      </nav>

      <div class="header-actions">

        <!-- 显示主要的 CTA 按钮 (如果 ctaAction 有值) -->
        <RouterLink v-if="ctaAction" :to="ctaAction.to" class="cta-button">
          {{ ctaAction.text }}
        </RouterLink>

        <!-- 显示登录/注册或注销按钮 (如果 showAuthAction 为 true) -->
        <template v-if="showAuthAction">
          <button v-if="isAuthenticated" @click="handleLogout" class="cta-button auth-button">
            注销
          </button>
          <button v-else @click="openAuthModal" class="cta-button auth-button">
            登录 / 注册
          </button>
        </template>

        <button class="hamburger" @click="toggleMobileMenu" :class="{ active: isMobileMenuOpen }" aria-label="切换导航菜单" :aria-expanded="isMobileMenuOpen" aria-controls="mobile-nav-list">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>

    <transition name="slide-fade">
      <nav v-if="isMobileMenuOpen" class="mobile-nav" aria-label="移动端导航">
        <ul id="mobile-nav-list">
          <li><RouterLink to="/">首页</RouterLink></li>
          <li><RouterLink to="/shop">商店</RouterLink></li>
          <li><RouterLink to="/projects">产品</RouterLink></li>
          <li><RouterLink to="/about">关于我们</RouterLink></li>
          <li><RouterLink to="/contact">联系我们</RouterLink></li>

          <!-- **改动 4: 同步移动端菜单的逻辑** -->
          <li class="mobile-cta-item">
            <!-- 移动端简化逻辑：只在需要登录的页面提供登录/注销快捷方式 -->
            <template v-if="showAuthAction">
              <button v-if="isAuthenticated" @click="handleLogout" class="cta-button-mobile">注销</button>
              <button v-else @click="openAuthModal" class="cta-button-mobile">登录 / 注册</button>
            </template>
            <!-- 在其他页面，可以显示一个主要的CTA，或者为了简洁而省略 -->
            <RouterLink v-else-if="ctaAction" :to="ctaAction.to" class="cta-button-mobile">
              {{ ctaAction.text }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </transition>

    <AuthModal v-model:active="isAuthModalOpen" @logged-in="isAuthModalOpen = false" />
  </header>
</template>


<style lang="scss" scoped>
/* 样式部分无需改动，保持和之前企业级版本一致 */
@use '@/assets/styles/index.scss' as *;

.app-header {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  padding: 0.75rem 0;
  transition: background-color 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease, padding 0.3s ease;
  border-bottom: 1px solid transparent;

  &.scrolled {
    padding: 0.5rem 0;
    background-color: rgba(26, 26, 26, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--color-border);
  }

  &.menu-open {
    background-color: transparent;
    backdrop-filter: none;
    border-bottom-color: transparent;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-heading);
  font-size: 1.5rem;
  font-weight: 600;
  text-decoration: none;
  flex-shrink: 0;
}
.logo img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.desktop-nav {
  @media (min-width: $breakpoint-md) {
    flex-grow: 1;
    display: flex;
    justify-content: center;
  }

  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem; /* 稍微减小间距以容纳更多项 */
  }
  a {
    color: var(--color-text);
    font-size: 1rem;
    padding: 0.5rem 0;
    position: relative;
    text-decoration: none;
  }
  a::after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-primary);
    transition: width 0.3s;
  }
  a:hover,
  a.router-link-exact-active {
    color: var(--color-heading);
  }
  a.router-link-exact-active::after {
    width: 100%;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-shrink: 0;
}

.cta-button {
  display: inline-block;
  background-color: var(--color-primary);
  color: #1a1a1a;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background-color: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.2);
  }
}

.auth-button {
    background-color: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    box-shadow: none;

    &:hover {
        background-color: var(--color-primary);
        color: #1a1a1a;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.2);
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
    transform-origin: center;
  }
  &.active .bar:nth-child(1) {
    transform: translateY(11px) rotate(45deg);
  }
  &.active .bar:nth-child(2) {
    opacity: 0;
    transform: translateX(-100%);
  }
  &.active .bar:nth-child(3) {
    transform: translateY(-11px) rotate(-45deg);
  }
}

.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: var(--color-background-soft-translucent);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1500;
  ul { list-style: none; padding: 0; text-align: center; }
  li { margin: 1.5rem 0; }
  a {
    color: var(--color-heading);
    font-size: 1.8rem;
    font-weight: bold;
    text-decoration: none;
    padding: 0.5rem 1rem;
    transition: color 0.3s;
    &:hover {
      color: var(--color-primary);
    }
  }
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
  min-width: 180px;
  text-align: center;
  text-decoration: none;
  &.auth-button {
    background-color: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
  }
}

.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.755, 0.05, 0.855, 0.06);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-30px);
  opacity: 0;
}

@media (max-width: $breakpoint-md) {
  .desktop-nav {
    display: none;
  }
  .header-actions .cta-button, .header-actions .auth-button {
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
