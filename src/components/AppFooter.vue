<!-- src/components/AppFooter.vue -->

<template>
  <footer class="app-footer">
    <div class="container footer-content">
      <div class="footer-column brand-info">
        <div class="logo">
          <img src="/LOGO.jpeg" alt="公司 Logo" />
          <span>YourBrand</span>
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
      <p>© {{ new Date().getFullYear() }} YourBrand Inc. 保留所有权利。</p>
      <div class="legal-links">
        <a href="#">隐私政策</a>
        <a href="#">服务条款</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.app-footer {
  width: 100%;
  color: var(--color-text-light);
  background-color: var(--color-background-soft);
  padding: 4rem 0 2rem;
  border-top: 1px solid var(--color-border);
}

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
