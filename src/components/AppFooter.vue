<!-- src/components/AppFooter.vue -->

<script setup>
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// --- 交互状态 ---
const isAtPageBottom = ref(false)

// --- 滚动事件处理器 ---
let scrollTimeout = null;
const handleScroll = () => {
  if (scrollTimeout === null) {
    scrollTimeout = setTimeout(() => {
      const buffer = 5;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - buffer;
      if (isAtPageBottom.value !== atBottom) {
        isAtPageBottom.value = atBottom;
      }
      scrollTimeout = null;
    }, 100);
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // 初始检查
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});


// --- 轻量级图标渲染组件 ---
const Icon = (props) => {
  const icons = {
    github: `<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>`,
    twitter: `<path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>`,
    juejin: `<path fill-rule="evenodd" d="M5.44.825a.75.75 0 0 1 .788.084l6.644 4.429a.75.75 0 0 1 .098.98l-6.645 8.86a.75.75 0 0 1-1.124-.842l6.027-8.036-6.027-4.018a.75.75 0 0 1 .24-.962Z" clip-rule="evenodd"/>`,
    // --- FIX: Corrected the invalid SVG path data below ("..062" is now ".062") ---
    discord: `<path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.01-.062c.018-.013.038-.025.056-.037a11.616 11.616 0 0 0 6.56 0c.019.012.038.024.057.037a.05.05 0 0 1-.009.063 8.995 8.995 0 0 1-1.248.595.05.05 0 0 0-.01.059c.236.466.51.899.818 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.125a.043.043 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>`
  };
  return h('svg', { innerHTML: icons[props.name] || '', width: '1em', height: '1em', fill: 'currentColor', viewBox: '0 0 16 16' });
};

// --- Footer 配置中心 ---
const footerConfig = ref({
  columns: [
    { title: '导航', links: [{ text: '首页', to: '/' }, { text: '产品', to: '/projects' }, { text: '商店', to: '/shop' }, { text: '关于我们', to: '/about' },], },
    { title: '资源', links: [{ text: '帮助中心', to: '/help' }, { text: '开发者文档', to: '/docs', isExternal: false }, { text: '状态页', href: '/status', isExternal: true },], },
    { title: '法律', links: [{ text: '隐私政策', to: '/privacy' }, { text: '服务条款', to: '/terms' },], },
  ],
  socials: [
    { name: 'GitHub', icon: 'github', url: 'https://github.com/424635328', label: '访问我们的 GitHub' },
    { name: 'Twitter', icon: 'twitter', url: 'https://twitter.com', label: '关注我们的 Twitter' },
    { name: '稀土掘金', icon: 'juejin', url: 'https://juejin.cn', label: '查看我们的稀土掘金' },
    { name: 'Discord', icon: 'discord', url: 'https://discord.gg', label: '加入我们的 Discord' },
  ],
  brandName: 'MHStudio',
  slogan: '打造卓越的数字体验。',
});

// --- 计算属性 ---
const currentYear = new Date().getFullYear();
const copyrightText = computed(() => `© ${currentYear} ${footerConfig.value.brandName}. All Rights Reserved.`);
</script>

<template>
  <footer class="app-footer" :class="{ 'at-bottom': isAtPageBottom }">
    <div class="container">
      <div class="footer-main">
        <div class="footer-brand">
          <RouterLink to="/" class="footer-logo">
            <img src="/LOGO.jpeg" alt="公司 Logo" />
            <span>{{ footerConfig.brandName }}</span>
          </RouterLink>
          <p class="footer-slogan">{{ footerConfig.slogan }}</p>
          <div class="footer-socials">
            <a v-for="social in footerConfig.socials" :key="social.name" :href="social.url" target="_blank" rel="noopener noreferrer" :aria-label="social.label" class="social-link" >
              <Icon :name="social.icon" />
            </a>
          </div>
        </div>
        <div class="footer-links-grid">
          <div v-for="column in footerConfig.columns" :key="column.title" class="footer-column" >
            <h4 class="footer-column-title">{{ column.title }}</h4>
            <nav :aria-label="`${column.title}导航`">
              <ul>
                <li v-for="link in column.links" :key="link.text">
                  <a v-if="link.isExternal" :href="link.href" target="_blank" rel="noopener noreferrer">
                    {{ link.text }}
                  </a>
                  <RouterLink v-else :to="link.to">
                    {{ link.text }}
                  </RouterLink>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ copyrightText }}</p>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.app-footer {
  /* --- FIX: Start --- */
  /* 提升堆叠上下文，确保 Footer 在 HomePage 的 fixed 背景元素之上，从而可以被点击 */
  position: relative;
  z-index: 50;
  /* --- FIX: End --- */

  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);

  // 平滑过渡效果依然保留
  transition: background-color 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease;

  // --- 原始样式 ---
  margin-top: auto; //  flex 布局中，这可以进一步确保 footer 被推到底部
  color: var(--color-text-light);
  padding: 4rem 0 2rem;
  font-size: 0.95rem;

  // 当页面可以滚动，且我们 *未* 触底时，应用毛玻璃效果
  &:not(.at-bottom) {
    background-color: var(--color-background-soft-translucent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top-color: transparent;
  }
}

.footer-main {
  display: flex;
  justify-content: space-between;
  gap: 4rem;
  padding-bottom: 3rem;

  @media (max-width: $breakpoint-lg) {
    gap: 2rem;
  }
  @media (max-width: $breakpoint-md) {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
}

.footer-brand {
  max-width: 300px;
  flex-shrink: 0;

  @media (max-width: $breakpoint-md) {
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-heading);
  font-size: 1.5rem;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 1rem;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
}

.footer-slogan {
  color: var(--color-text);
  line-height: 1.6;
}

.footer-socials {
  display: flex;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.social-link {
  color: var(--color-text);
  font-size: 1.5rem;
  transition: color 0.3s ease, transform 0.3s ease;

  &:hover {
    color: var(--color-primary);
    transform: translateY(-3px);
  }
}

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;

  @media (max-width: $breakpoint-lg) {
    gap: 2rem;
  }
  @media (max-width: $breakpoint-sm) {
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
    text-align: left;
  }
}

.footer-column-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 1.25rem;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.footer-column a {
  color: var(--color-text);
  text-decoration: none;
  position: relative;
  transition: color 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 1px;
    bottom: -3px;
    left: 0;
    background-color: var(--color-primary);
    transition: width 0.3s ease;
  }

  &:hover {
    color: var(--color-primary);
    &::after {
      width: 100%;
    }
  }
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
  text-align: center;

  p {
    margin: 0;
    color: var(--color-text-light);
  }
}
</style>