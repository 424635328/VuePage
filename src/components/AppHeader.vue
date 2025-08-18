<!-- src/components/AppHeader.vue -->

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useRedirect } from '@/composables/useRedirect'; // [NEW] 1. 导入 useRedirect
import AuthModal from '@/components/auth/AuthModal.vue';
import NavIcon from './common/NavIcon.vue';

// --- 核心依赖 ---
const authStore = useAuthStore();
const uiStore = useUiStore();
const route = useRoute();
const { redirectWithTip } = useRedirect(); // [NEW] 2. 实例化 redirect composable

// --- 响应式状态定义 ---
const isMobileMenuOpen = ref(false);
const isAuthModalActive = ref(false);
const isScrolled = ref(false);
const openDropdownMenu = ref(null);

// --- 导航配置中心 ---
const navLinks = ref([
  { text: '首页', to: '/', icon: 'house-door-fill' },
  { text: '商店', to: '/shop', icon: 'box-seam-fill' },
  { text: '保险库', to: '/vault', icon: 'safe-fill', auth: true },
  {
    text: '更多',
    children: [
      { text: '图片编辑器', to: '/editor', icon: 'pencil-square', auth: true },
      { text: '我的作品', to: '/projects', icon: 'lightbulb-fill' },
      { text: '开发者文档', to: '/docs', icon: 'book-half' },
      { text: '关于我们', to: '/about', icon: 'info-circle-fill' },
      { text: '联系我们', to: '/contact', icon: 'person-lines-fill' },
      { text: '服务条款', to: '/terms', icon: 'file-text-fill' },
      { text: '隐私政策', to: '/privacy', icon: 'shield-lock-fill' },
      { text: '帮助中心', to: '/help', icon: 'question-circle-fill' },
      { text: '404', to: '/404', icon: 'exclamation-triangle-fill' },
    ]
  }
]);

// --- 计算属性 (Computed Properties) ---
const isAuthenticated = computed(() => !!authStore.user);

const filteredNavLinks = computed(() => {
  const filterRecursive = (links) => {
    return links
      .filter(link => !link.auth || isAuthenticated.value)
      .map(link => {
        if (link.children) {
          return { ...link, children: filterRecursive(link.children) };
        }
        return link;
      });
  };
  return filterRecursive(navLinks.value);
});

const flatNavLinksForMobile = computed(() => {
  return filteredNavLinks.value.flatMap(link => link.children ? link.children : link);
});

const activeDropdown = computed(() => {
  return filteredNavLinks.value.find(
    link => link.children && link.children.some(child => route.path === child.to)
  );
});

// --- 方法 (Methods) ---

// [NEW] 3. 创建统一的导航处理函数
const handleNavClick = (to) => {
  // 如果移动端菜单是打开的，先关闭它
  if (isMobileMenuOpen.value) {
    closeMobileMenu();
  }
  // 使用我们的 redirect composable 来处理跳转
  redirectWithTip(to);
};

const toggleMobileMenu = () => isMobileMenuOpen.value = !isMobileMenuOpen.value;
const closeMobileMenu = () => isMobileMenuOpen.value = false;
const openAuthModal = () => {
  closeMobileMenu();
  isAuthModalActive.value = true;
};

// [MODIFIED] 4. 更新注销方法以使用跳转提示
const handleLogout = async () => {
  closeMobileMenu();
  // 先显示提示并开始导航到首页
  redirectWithTip('/', {
    loadingMessage: '正在为您安全注销...',
    successMessage: '您已成功注销！'
  });
  // 然后在后台执行实际的注销操作
  await authStore.signOut();
};

// --- 生命周期钩子和侦听器 ---
let scrollTimeout = null;
const handleScroll = () => {
  if (scrollTimeout === null) {
    scrollTimeout = setTimeout(() => {
      isScrolled.value = window.scrollY > 10;
      scrollTimeout = null;
    }, 100);
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('open-auth-modal', openAuthModal);
});
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('open-auth-modal', openAuthModal);
  if (scrollTimeout) clearTimeout(scrollTimeout);
  document.body.style.overflow = '';
});

watch(() => route.fullPath, () => closeMobileMenu());
watch([isMobileMenuOpen, isAuthModalActive], ([isMenuOpen, isModalOpen]) => {
  document.body.style.overflow = (isMenuOpen || isModalOpen) ? 'hidden' : '';
}, { immediate: true });
</script>

<template>
  <header class="app-header" :class="{ scrolled: isScrolled, 'menu-open': isMobileMenuOpen }">
    <div class="container header-content">
      <!-- [MODIFIED] 使用 custom v-slot 拦截点击事件 -->
      <RouterLink to="/" custom v-slot="{ href }">
        <a :href="href" @click.prevent="handleNavClick('/')" class="logo">
          <img src="/LOGO.jpeg" alt="MHStudio Logo" />
          <span>MHStudio</span>
        </a>
      </RouterLink>

      <!-- 桌面端导航 -->
      <nav class="desktop-nav" aria-label="主导航">
        <ul>
          <li v-for="link in filteredNavLinks" :key="link.text">
            <!-- [MODIFIED] 使用 custom v-slot 拦截点击事件 -->
            <RouterLink v-if="!link.children" :to="link.to" custom v-slot="{ href, isExactActive }">
              <a :href="href" @click.prevent="handleNavClick(link.to)" :class="{ 'router-link-exact-active': isExactActive }">
                {{ link.text }}
              </a>
            </RouterLink>
            <div v-else class="dropdown-container" @mouseenter="openDropdownMenu = link.text" @mouseleave="openDropdownMenu = null">
              <button
                class="dropdown-button"
                :class="{ active: activeDropdown && activeDropdown.text === link.text }"
                aria-haspopup="true"
                :aria-expanded="openDropdownMenu === link.text"
              >
                {{ link.text }}
                <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>
              </button>
              <transition name="dropdown-fade">
                <div v-if="openDropdownMenu === link.text" class="dropdown-menu">
                  <transition-group tag="ul" name="staggered-item-fade" appear>
                    <li v-for="(child, index) in link.children" :key="child.to" :data-index="index">
                      <!-- [MODIFIED] 使用 custom v-slot 拦截点击事件 -->
                      <RouterLink :to="child.to" custom v-slot="{ href, isExactActive }">
                        <a :href="href" @click.prevent="handleNavClick(child.to)" :class="{ 'router-link-exact-active': isExactActive }">
                          <NavIcon :name="child.icon" />
                          <span>{{ child.text }}</span>
                        </a>
                      </RouterLink>
                    </li>
                  </transition-group>
                </div>
              </transition>
            </div>
          </li>
        </ul>
      </nav>

      <!-- 右侧操作按钮 (注销按钮已通过修改 handleLogout 方法来支持) -->
      <div class="header-actions">
        <template v-if="isAuthenticated">
          <button @click="handleLogout" class="cta-button auth-button">注销</button>
        </template>
        <template v-else>
          <button @click="openAuthModal" class="cta-button">登录 / 注册</button>
        </template>

        <button
          class="icon-button"
          @click="uiStore.toggleConfigPanel"
          aria-label="切换背景配置"
          title="显示/隐藏背景配置"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311a1.464 1.464 0 0 1-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c-1.4-.413-1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
          </svg>
        </button>

        <button class="hamburger" @click="toggleMobileMenu" :class="{ active: isMobileMenuOpen }" aria-label="切换导航菜单" :aria-expanded="isMobileMenuOpen" aria-controls="mobile-nav-list">
          <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        </button>
      </div>
    </div>

    <!-- 移动端导航 -->
    <transition name="slide-fade">
      <nav v-if="isMobileMenuOpen" class="mobile-nav" aria-label="移动端导航">
        <ul id="mobile-nav-list">
          <li v-for="(item, index) in flatNavLinksForMobile" :key="item.to" :style="{ '--delay': index * 0.05 + 's' }">
            <!-- [MODIFIED] 使用 custom v-slot 拦截点击事件 -->
            <RouterLink :to="item.to" custom v-slot="{ href, isExactActive }">
              <a :href="href" @click.prevent="handleNavClick(item.to)" :class="{ 'router-link-exact-active': isExactActive }">
                <NavIcon :name="item.icon" />
                <span>{{ item.text }}</span>
              </a>
            </RouterLink>
          </li>
          <li class="mobile-cta-item" :style="{ '--delay': flatNavLinksForMobile.length * 0.05 + 's' }">
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

    <AuthModal v-model:active="isAuthModalActive" />
  </header>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

// --- 动画 Keyframes ---
@keyframes menu-item-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

// --- 基础样式 ---
.app-header {
  position: sticky; top: 0; width: 100%; z-index: 1000;
  padding: 0.75rem 0;
  transition: background-color 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease, padding 0.4s ease, box-shadow 0.4s ease;
  border-bottom: 1px solid transparent;
  &.scrolled {
    padding: 0.5rem 0;
    background-color: var(--color-background-soft-translucent);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }
}

.header-content { display: flex; justify-content: space-between; align-items: center; }

.logo {
  display: flex; align-items: center; gap: 0.75rem;
  color: var(--color-heading); font-size: 1.5rem; font-weight: 600; text-decoration: none; flex-shrink: 0;
  transition: transform 0.3s ease;
  &:hover { transform: scale(1.05); }
  img { width: 40px; height: 40px; border-radius: 50%; }
}

// --- 桌面导航 ---
.desktop-nav {
  @media (min-width: $breakpoint-md) { display: flex; justify-content: center; flex-grow: 1; }
  ul { display: flex; align-items: center; list-style: none; margin: 0; padding: 0; gap: 0.5rem; }
  a, .dropdown-button {
    color: var(--color-text); font-size: 1rem; font-weight: 500;
    padding: 0.5rem 1rem; position: relative; text-decoration: none; border-radius: 8px;
    transition: color 0.3s ease, background-color 0.3s ease;
    cursor: pointer; /* [MODIFIED] 确保 a 标签有指针手势 */
    &:hover { color: var(--color-heading); background-color: var(--color-background-mute); }
    &.router-link-exact-active {
      color: var(--color-primary); font-weight: 600; background-color: var(--color-primary-translucent);
    }
  }
}

// --- 下拉菜单 [美化] ---
.dropdown-container { position: relative; }
.dropdown-button {
  display: flex; align-items: center; gap: 0.25rem;
  background: none; border: none; font-family: inherit; cursor: pointer;
  .dropdown-arrow { width: 1em; height: 1em; fill: currentColor; transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
  &.active { color: var(--color-primary); font-weight: 600; background-color: var(--color-primary-translucent); }
}
.dropdown-container:hover .dropdown-button .dropdown-arrow { transform: rotate(180deg); }
.dropdown-menu {
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  margin-top: 1rem; /* 增加与按钮的距离 */
  background-color: rgba(var(--color-background-soft-rgb), 0.7); /* 半透明背景 */
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  padding: 0.5rem; z-index: 10; width: max-content; min-width: 220px;

  /* 小箭头 */
  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid var(--color-border);
  }

  ul {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.25rem;
    align-items: flex-start;
  }
  li { width: 100%; }
  a {
    display: flex; align-items: center; gap: 0.75rem; width: 100%;
    padding: 0.75rem 1rem; text-align: left; white-space: nowrap;
    background-color: transparent !important;
    &:hover { background-color: var(--color-background-mute) !important; }
    &.router-link-exact-active { background-color: var(--color-primary-translucent) !important; color: var(--color-primary); }
  }
}

// --- 操作按钮 & 汉堡菜单 ---
.header-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.cta-button {
  display: inline-block; background-color: var(--color-primary); color: #1a1a1a;
  border: 1px solid transparent; padding: 0.75rem 1.5rem; border-radius: 8px;
  font-weight: 600; cursor: pointer; transition: all 0.3s; text-decoration: none; white-space: nowrap;
  &:hover {
    background-color: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.2);
  }
}
.auth-button {
  background-color: transparent; border-color: var(--color-primary); color: var(--color-primary); box-shadow: none;
  &:hover { background-color: var(--color-primary); color: #1a1a1a; }
}
.hamburger {
  display: none; flex-direction: column; justify-content: space-around;
  width: 2rem; height: 2rem; background: transparent; border: none; cursor: pointer; padding: 0; z-index: 2000;
  .bar { display: block; width: 2rem; height: 3px; background-color: var(--color-heading); border-radius: 2px; transition: all 0.3s ease-in-out; }
  &.active .bar:nth-child(1) { transform: translateY(11px) rotate(45deg); }
  &.active .bar:nth-child(2) { opacity: 0; }
  &.active .bar:nth-child(3) { transform: translateY(-11px) rotate(-45deg); }
}

.icon-button {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; padding: 0.6rem; border-radius: 50%;
  cursor: pointer; color: var(--color-text);
  transition: color 0.3s ease, background-color 0.3s ease, transform 0.3s ease;
  &:hover {
    color: var(--color-heading); background-color: var(--color-background-mute);
    transform: rotate(45deg);
  }
}

// --- 移动端导航 ---
.mobile-nav {
  display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100dvh;
  background-color: rgba(var(--color-background-rgb), 0.8);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  justify-content: center; align-items: center; flex-direction: column;
  z-index: 1500;
  ul { list-style: none; padding: 0; text-align: center; }
  li {
    margin: 0.5rem 0; opacity: 0;
    animation: menu-item-fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    animation-delay: var(--delay);
  }
  a {
    display: flex; align-items: center; justify-content: center; gap: 1rem;
    color: var(--color-heading); font-size: 1.8rem; font-weight: bold; text-decoration: none;
    padding: 0.75rem 1.5rem; border-radius: 12px;
    transition: color 0.3s, background-color 0.3s;
    &:hover, &.router-link-exact-active {
      color: var(--color-primary); background-color: var(--color-background-mute);
    }
  }
}
.mobile-cta-item { margin-top: 2rem !important; }
.cta-button-mobile {
  display: inline-block; background: var(--color-primary); color: #1a1a1a; border: none;
  padding: 1rem 2rem; font-size: 1.5rem; border-radius: 12px; font-weight: 600;
  min-width: 220px; text-align: center; text-decoration: none;
  &.auth-button { background-color: transparent; border: 2px solid var(--color-primary); color: var(--color-primary); }
}

// --- 过渡动画 [美化] ---
.slide-fade-enter-active { transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
.slide-fade-leave-active { transition: all 0.3s cubic-bezier(0.755, 0.05, 0.855, 0.06); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-30px); opacity: 0; }

/* 下拉菜单容器动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) translateX(-50%);
}
/* 下拉菜单项交错动画 */
.staggered-item-fade-enter-active,
.staggered-item-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  transition-delay: calc(0.04s * var(--data-index, 1));
}
.staggered-item-fade-enter-from,
.staggered-item-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.staggered-item-fade-leave-active {
  position: absolute; /* 离开时避免塌陷 */
}


// --- 响应式断点 ---
@media (max-width: $breakpoint-md) {
  .desktop-nav, .header-actions .cta-button, .header-actions .auth-button, .header-actions .icon-button { display: none; }
  .hamburger { display: flex; }
  .mobile-nav { display: flex; }
}

// --- 图标通用样式 ---
:deep(.nav-item-icon) {
  font-size: 1.1em;
  opacity: 0.8;
  transition: opacity 0.3s;
}
:deep(a:hover .nav-item-icon), :deep(a.router-link-exact-active .nav-item-icon) {
  opacity: 1;
}
</style>
