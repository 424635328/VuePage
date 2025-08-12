<!-- src/components/AppHeader.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, h } from 'vue'
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
const isMoreMenuOpen = ref(false)

const navItems = ref([
  { text: '首页', to: '/', primary: true, icon: 'house-door-fill' },
  { text: '商品', to: '/shop', primary: true, icon: 'box-seam-fill' },
  { text: '存储', to: '/vault', primary: true, icon: 'safe-fill' },
  { text: '产品', to: '/projects', icon: 'lightbulb-fill' },
  { text: '编辑器', to: '/editor', icon: 'pencil-square' },
  { text: '关于我们', to: '/about', icon: 'info-circle-fill' },
  { text: '联系我们', to: '/contact', icon: 'person-lines-fill' },
  { text: '404', to: '/NotFoundPage', icon: 'exclamation-triangle-fill' },
])

// --- 计算属性 (Computed Properties) ---
const primaryNavItems = computed(() => navItems.value.filter(item => item.primary))
const moreNavItems = computed(() => navItems.value.filter(item => !item.primary))

const isMoreMenuActive = computed(() => {
  return moreNavItems.value.some(item => route.path === item.to)
})

const isAuthenticated = computed(() => !!authStore.user)

// --- 方法 (Methods) ---
const toggleMobileMenu = () => isMobileMenuOpen.value = !isMobileMenuOpen.value
const closeMobileMenu = () => isMobileMenuOpen.value = false
const openAuthModal = () => {
  closeMobileMenu()
  isAuthModalOpen.value = true
}
const handleLogout = () => {
  closeMobileMenu()
  authStore.signOut()
}

// 无需引入外部库，直接渲染 SVG 路径
const NavIcon = (props) => {
  const icons = {
    'house-door-fill': `<path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5z"/>`,
    'box-seam-fill': `<path d="M15.528 2.973a.5.5 0 0 1 .472.472l-1.835 8.81a.5.5 0 0 1-.472.472h-1.392a.5.5 0 0 1-.472-.472L10 2.973a.5.5 0 0 1 .472-.472h5.056zM10 2.25a.75.75 0 0 0-1.5 0v9.5a.75.75 0 0 0 1.5 0v-9.5zM6 2.973l-1.835 8.81a.5.5 0 0 1-.472.472H2.302a.5.5 0 0 1-.472-.472L.001 3.445a.5.5 0 0 1 .472-.472h5.056a.5.5 0 0 1 .472.472z"/>`,
    'safe-fill': `<path d="M7.06 1.076A1.5 1.5 0 0 1 8.5 1h1A1.5 1.5 0 0 1 11 2.5v1A1.5 1.5 0 0 1 9.5 5h-4A1.5 1.5 0 0 1 4 3.5v-1A1.5 1.5 0 0 1 5.5 1h1.56Z"/> <path d="M7.06 1.076a.5.5 0 0 0-.12-1.025A1.5 1.5 0 0 0 5.5 0h-1A1.5 1.5 0 0 0 3 1.5v1A1.5 1.5 0 0 0 4.5 4h7A1.5 1.5 0 0 0 13 2.5v-1A1.5 1.5 0 0 0 11.5 0h-1a1.5 1.5 0 0 0-1.44-1.076zM12.5 7a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zM5.5 7a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm2-3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zM1.5 6A1.5 1.5 0 0 0 0 7.5v7A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 6h-13zM5.5 9.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4z"/>`,
    'lightbulb-fill': `<path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5z"/>`,
    'pencil-square': `<path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/> <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11A1.5 1.5 0 0 0 15 13.5V6h-1.5v7.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V2.5a.5.5 0 0 1 .5-.5H9V1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>`,
    'info-circle-fill': `<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>`,
    'person-lines-fill': `<path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z"/>`,
    'exclamation-triangle-fill': `<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>`
  };
  return h('svg', {
    class: 'nav-item-icon',
    innerHTML: icons[props.name] || '',
    width: '1em', height: '1em', fill: 'currentColor', viewBox: '0 0 16 16'
  });
};

// --- 生命周期钩子和侦听器 ---
let scrollTimeout = null
const handleScroll = () => {
  if (scrollTimeout === null) {
    scrollTimeout = setTimeout(() => {
      isScrolled.value = window.scrollY > 10
      scrollTimeout = null
    }, 100)
  }
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
  document.body.style.overflow = '' // 清理样式
})

watch(() => route.fullPath, () => closeMobileMenu())
watch([isMobileMenuOpen, isAuthModalOpen], ([isMenuOpen, isModalOpen]) => {
  document.body.style.overflow = (isMenuOpen || isModalOpen) ? 'hidden' : ''
}, { immediate: true })
</script>

<template>
  <header class="app-header" :class="{ scrolled: isScrolled, 'menu-open': isMobileMenuOpen }">
    <div class="container header-content">
      <RouterLink to="/" class="logo" @click="closeMobileMenu">
        <img src="/LOGO.jpeg" alt="公司 Logo" />
        <span>MHStudio</span>
      </RouterLink>

      <!-- 桌面端导航 -->
      <nav class="desktop-nav" aria-label="主导航">
        <ul>
          <li v-for="item in primaryNavItems" :key="item.to">
            <RouterLink :to="item.to">{{ item.text }}</RouterLink>
          </li>

          <!-- “更多”下拉菜单 -->
          <li v-if="moreNavItems.length > 0" class="more-menu-container" @mouseenter="isMoreMenuOpen = true" @mouseleave="isMoreMenuOpen = false">
            <button
              class="more-menu-button"
              :class="{ active: isMoreMenuActive }"
              aria-haspopup="true"
              :aria-expanded="isMoreMenuOpen"
            >
              更多
              <svg class="more-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
            <transition name="fade-down">
              <div v-if="isMoreMenuOpen" class="more-dropdown">
                <ul>
                  <li v-for="item in moreNavItems" :key="item.to">
                    <RouterLink :to="item.to">
                      <NavIcon :name="item.icon" />
                      <span>{{ item.text }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </div>
            </transition>
          </li>
        </ul>
      </nav>

      <!-- 右侧操作按钮 -->
      <div class="header-actions">
        <template v-if="isAuthenticated">
          <button @click="handleLogout" class="cta-button auth-button">注销</button>
        </template>
        <template v-else>
          <button @click="openAuthModal" class="cta-button">登录 / 注册</button>
        </template>

        <button class="hamburger" @click="toggleMobileMenu" :class="{ active: isMobileMenuOpen }" aria-label="切换导航菜单"
          :aria-expanded="isMobileMenuOpen" aria-controls="mobile-nav-list">
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        </button>
      </div>
    </div>

    <!-- 移动端导航 -->
    <transition name="slide-fade">
      <nav v-if="isMobileMenuOpen" class="mobile-nav" aria-label="移动端导航">
        <ul id="mobile-nav-list">
          <!-- 为列表项添加交错动画 -->
          <li v-for="(item, index) in navItems" :key="item.to" :style="{ '--delay': index * 0.05 + 's' }">
            <RouterLink :to="item.to">
              <NavIcon :name="item.icon" />
              <span>{{ item.text }}</span>
            </RouterLink>
          </li>

          <li class="mobile-cta-item" :style="{ '--delay': navItems.length * 0.05 + 's' }">
            <template v-if="isAuthenticated">
              <button @click="handleLogout" class="cta-button-mobile auth-button">注销</button>
            </template>
            <template v-else>
              <button @click="openAuthModal" class="cta-button-mobile">登录 / 注册</button>
            </template>
          </li>
        </ul>
      </nav>
    </transition>

    <AuthModal v-model:active="isAuthModalOpen" @logged-in="isAuthModalOpen = false" />
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// --- 动画 Keyframes ---
@keyframes menu-item-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// --- 基础样式 ---
.app-header {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  padding: 0.75rem 0;
  transition: background-color 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease, padding 0.4s ease, box-shadow 0.4s ease;
  border-bottom: 1px solid transparent;

  &.scrolled {
    padding: 0.5rem 0;
    background-color: var(--color-background-soft-translucent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
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
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
}

// --- 桌面导航样式 ---
.desktop-nav {
  @media (min-width: $breakpoint-md) {
    display: flex;
    justify-content: center;
    flex-grow: 1;
  }

  ul {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.5rem; // 减小gap，由padding控制间距
  }

  // “药丸”式导航链接
  a, .more-menu-button {
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    position: relative;
    text-decoration: none;
    border-radius: 8px;
    transition: color 0.3s ease, background-color 0.3s ease;

    &::after { content: none; } // 移除旧下划线

    &:hover {
      color: var(--color-heading);
      background-color: var(--color-background-mute);
    }

    &.router-link-exact-active {
      color: var(--color-primary);
      font-weight: 600;
      background-color: rgba(var(--color-primary-rgb), 0.1);
    }
  }
}

// --- “更多”下拉菜单 ---
.more-menu-container {
  position: relative;
}

.more-menu-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;

  .more-arrow {
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  // 当路由在“更多”菜单中时，按钮也高亮
  &.active {
    color: var(--color-primary);
    font-weight: 600;
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }
}

.more-menu-container:hover .more-menu-button .more-arrow {
  transform: rotate(180deg);
}

.more-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.75rem;
  background-color: var(--color-background-soft-translucent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  z-index: 10;
  width: max-content;
  min-width: 180px;

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
  }
  li { width: 100%; }

  a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    white-space: nowrap;
    text-align: left;
    font-weight: 500;

    // 继承父级a的样式，但移除背景色
    background-color: transparent !important;

    &:hover {
      background-color: var(--color-background-mute) !important;
      color: var(--color-heading);
    }

    &.router-link-exact-active {
      background-color: rgba(var(--color-primary-rgb), 0.1) !important;
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}

// --- 操作按钮 & 汉堡菜单 ---
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
  border: 1px solid transparent;
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
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: none;

  &:hover {
    background-color: var(--color-primary);
    color: #1a1a1a;
  }
}

.hamburger {
  display: none; flex-direction: column; justify-content: space-around; width: 2rem; height: 2rem; background: transparent; border: none; cursor: pointer; padding: 0; z-index: 2000;
  .bar { display: block; width: 2rem; height: 3px; background-color: var(--color-heading); border-radius: 2px; transition: all 0.3s ease-in-out; transform-origin: center; }
  &.active .bar:nth-child(1) { transform: translateY(11px) rotate(45deg); }
  &.active .bar:nth-child(2) { opacity: 0; transform: translateX(-100%); }
  &.active .bar:nth-child(3) { transform: translateY(-11px) rotate(-45deg); }
}

// --- 移动端导航 ---
.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100dvh; // 使用 dvh 避免移动端浏览器UI遮挡问题
  background-color: var(--color-background-soft-translucent);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1500;

  ul { list-style: none; padding: 0; text-align: center; }

  li {
    margin: 0.5rem 0; // 减小间距，更紧凑
    // 应用交错动画
    opacity: 0;
    animation: menu-item-fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    animation-delay: var(--delay);
  }

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--color-heading);
    font-size: 1.8rem;
    font-weight: bold;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    transition: color 0.3s, background-color 0.3s;

    &:hover, &.router-link-exact-active {
      color: var(--color-primary);
      background-color: var(--color-background-mute);
    }
  }
}

.mobile-cta-item {
  margin-top: 2rem !important;
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
  min-width: 220px;
  text-align: center;
  text-decoration: none;

  &.auth-button {
    background-color: transparent;
    border: 2px solid var(--color-primary);
    color: var(--color-primary);
  }
}

// --- 过渡动画 ---
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

.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

// --- 响应式断点 ---
@media (max-width: $breakpoint-md) {
  .desktop-nav,
  .header-actions .cta-button,
  .header-actions .auth-button {
    display: none;
  }

  .hamburger { display: flex; }
  .mobile-nav { display: flex; }
}

// 图标通用样式
:deep(.nav-item-icon) {
  font-size: 1.1em;
  opacity: 0.8;
  transition: opacity 0.3s;
}

:deep(a:hover .nav-item-icon),
:deep(a.router-link-exact-active .nav-item-icon) {
  opacity: 1;
}
</style>
