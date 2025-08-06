<!-- src/components/AppFooter.vue -->

<template>
  <!--
    通过 :class 动态绑定类名：
    - 'is-visible': 当 footer 应该显示时添加，触发淡入动画。
    - 'is-solid': 当页面滚动到底部时添加，触发背景色变为深色。
  -->
  <footer
    class="app-footer"
    :class="{ 'is-visible': isFooterVisible, 'is-solid': isAtPageBottom }"
  >
    <div class="container footer-content">
      <div class="footer-column brand-info">
        <div class="logo">
          <img src="/LOGO.jpeg" alt="公司 Logo" />
          <span>MHStudio</span>
        </div>
        <p>致力于提供领先的数字化解决方案，驱动行业创新。</p>
      </div>

      <div class="footer-column">
        <h4>产品</h4>
        <ul>
          <li><RouterLink to="/projects">核心产品A</RouterLink></li>
          <li><RouterLink to="/projects">创新产品B</RouterLink></li>
          <li><RouterLink to="/projects">企业套件</RouterLink></li>
        </ul>
      </div>

      <div class="footer-column">
        <h4>公司</h4>
        <ul>
          <li><RouterLink to="/">关于我们</RouterLink></li>
          <li><RouterLink to="/">招贤纳士</RouterLink></li>
          <li><RouterLink to="/">新闻中心</RouterLink></li>
        </ul>
      </div>

      <div class="footer-column">
        <h4>联系</h4>
        <ul>
          <li><RouterLink to="/contact">联系我们</RouterLink></li>
          <li><RouterLink to="/contact">获取报价</RouterLink></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© {{ new Date().getFullYear() }} MHStudio Inc. 保留所有权利。</p>
      <div class="legal-links">
        <a href="#">隐私政策</a>
        <a href="#">服务条款</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// 创建响应式变量来追踪 footer 的状态
const isFooterVisible = ref(false) // 控制 footer 是否可见 (用于淡入)
const isAtPageBottom = ref(false)  // 控制 footer 背景是否为深色

// 定义触发 footer 淡入的滚动距离阈值 (例如，滚动超过 300px 后出现)
const FADE_IN_THRESHOLD = 300

/**
 * 处理页面滚动的函数
 */
const handleScroll = () => {
  const scrollY = window.scrollY
  const viewportHeight = window.innerHeight
  const pageHeight = document.documentElement.scrollHeight

  // 1. 判断是否达到淡入阈值
  isFooterVisible.value = scrollY > FADE_IN_THRESHOLD

  // 2. 判断是否滚动到页面底部 (留出 5px 的容错空间)
  isAtPageBottom.value = viewportHeight + scrollY >= pageHeight - 5
}

// 在组件挂载后，添加全局滚动事件监听器
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始加载时也执行一次，以应对页面内容不足以滚动的情况
  handleScroll()
})

// 在组件卸载前，移除事件监听器，防止内存泄漏
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.app-footer {
  width: 100%;
  color: var(--color-text-light);
  padding: 4rem 0 2rem;

  // --- 核心优化部分 ---

  // 1. 初始状态：背景和边框透明，通过 opacity 和 transform 隐藏
  background-color: transparent;
  border-top: 1px solid transparent;
  opacity: 0;
  transform: translateY(30px); // 从下方轻微滑入，效果更佳

  // 2. 过渡动画：为所有将要改变的属性添加平滑的过渡效果
  transition:
    background-color 0.5s ease,
    border-color 0.5s ease,
    opacity 0.5s ease,
    transform 0.5s ease;

  // 3. 可见状态：当 .is-visible 类被添加时，footer 淡入并恢复位置
  &.is-visible {
    opacity: 1;
    transform: translateY(0);
    border-top-color: var(--color-border); // 边框也同步淡入
  }

  // 4. 滚动到底部状态：当 .is-solid 类被添加时，背景变为深色
  &.is-solid {
    background-color: var(--color-background-soft); // 使用您原有的背景色
  }
}

/* --- 以下是您原有的样式，无需修改 --- */

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer-column {
  flex: 1;
  min-width: 160px;
}

.brand-info {
  flex-basis: 25%;
  min-width: 240px;
  p {
    margin-top: 1rem;
    font-size: 0.95rem;
    line-height: 1.6;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  img {
    width: 32px;
    height: 32px;
  }
}

h4 {
  color: var(--color-heading);
  font-size: 1.1rem;
  margin-bottom: 1.25rem;
  font-weight: 500;
}

ul {
  list-style: none;
  li {
    margin-bottom: 0.75rem;
  }
  a {
    color: var(--color-text-light);
    &:hover {
      color: var(--color-primary);
    }
  }
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.legal-links a {
  color: var(--color-text-light);
  margin-left: 1.5rem;
  &:hover {
    color: var(--color-primary);
  }
}

@media (max-width: $breakpoint-md) {
  .footer-content {
    flex-direction: column;
    gap: 2.5rem;
  }
  .footer-bottom {
    flex-direction: column-reverse;
    align-items: center;
    text-align: center;
  }
  .legal-links {
    margin-bottom: 1rem;
  }
}
</style>
