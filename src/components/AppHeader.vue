<!-- src/components/AppHeader.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const isScrolled = ref(false)
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

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
      <RouterLink to="/" class="logo" @click="isMobileMenuOpen = false">
        <img src="/LOGO.jpeg" alt="公司 Logo" />
        <span>YourBrand</span>
      </RouterLink>

      <nav class="desktop-nav">
        <ul>
          <li><RouterLink to="/">首页</RouterLink></li>
          <li><RouterLink to="/projects">产品</RouterLink></li>
          <li><RouterLink to="/contact">联系我们</RouterLink></li>
        </ul>
      </nav>

      <div class="header-actions">
        <RouterLink to="/contact" class="cta-button">立即咨询</RouterLink>

        <button class="hamburger" @click="toggleMobileMenu" aria-label="打开菜单" :aria-expanded="isMobileMenuOpen">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>

    <transition name="slide-fade">
      <nav v-if="isMobileMenuOpen" class="mobile-nav">
        <ul>
          <li><RouterLink to="/" @click="toggleMobileMenu">首页</RouterLink></li>
          <li><RouterLink to="/projects" @click="toggleMobileMenu">产品</RouterLink></li>
          <li><RouterLink to="/contact" @click="toggleMobileMenu">联系我们</RouterLink></li>
          <li class="mobile-cta-item">
            <RouterLink to="/contact" class="cta-button-mobile" @click="toggleMobileMenu">
              立即咨询
            </RouterLink>
          </li>
        </ul>
      </nav>
    </transition>
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

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

/* 这个样式现在会同时作用于 button 和 router-link */
.cta-button {
  display: inline-block; /* 确保 router-link 表现得像个按钮 */
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
  margin-top: 2.5rem !important; /* 与其他链接拉开距离 */
}

/* 移动端的按钮式链接 */
.cta-button-mobile {
  display: inline-block;
  background: var(--color-primary);
  color: #1a1a1a;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border-radius: 12px;
  font-weight: 600;
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
  .desktop-nav, .cta-button {
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
