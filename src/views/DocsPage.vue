<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/atom-one-dark.css';

// 按需导入您需要的语言
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);

// --- 状态管理 ---
const searchQuery = ref('');
const activeSectionId = ref('introduction'); // 默认高亮第一部分
const sectionRefs = ref({}); // 用于存储每个section的DOM引用
const mainContentRef = ref(null); // 对主内容区域的引用

// --- 内容中心 ---
// 所有文档内容都在这里管理，占位符已替换为您的项目信息
const docsContent = ref([
  {
    id: 'introduction',
    title: '简介',
    content: [
      { type: 'p', text: '欢迎来到 MHStudio 的开发者文档中心。本文档旨在为您提供开始使用我们平台所需的所有信息，从项目设置到后端部署和前端集成。' },
      { type: 'p', text: '本项目是一个基于 Vue 3、Vite、Pinia 和 Supabase 构建的全栈式电子商务/作品集展示平台，旨在展示企业级的代码架构和现代化的工程实践。' },
    ],
  },
  {
    id: 'setup',
    title: '项目设置',
    content: [
      { type: 'p', text: '在开始之前，请确保您的本地环境已安装 Node.js (LTS 版本)、npm/yarn 以及 Supabase CLI。' },
      { type: 'p', text: '第一步，克隆您的代码仓库并安装依赖：' },
      {
        type: 'code',
        lang: 'bash',
        code: `git clone https://github.com/424635328/MHStudio.git
cd MHStudio
npm install`
      },
      { type: 'p', text: '接下来，在项目根目录创建一个 `.env` 文件，并从您的 Supabase 项目设置的 API 面板中找到并填入 API URL 和 Anon Key：' },
      {
        type: 'code',
        lang: 'bash',
        code: `VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"`
      },
    ],
  },
  {
    id: 'database',
    title: '数据库设置 (PostgreSQL)',
    content: [
      { type: 'p', text: '我们的后端性能优化的核心之一是高效的数据库设计。我们使用 PostgreSQL 视图（View）来预聚合数据，以解决 "N+1" 查询问题。' },
      { type: 'p', text: '请将 `supabase/migrations/` 目录下的 SQL 脚本在您 Supabase 项目的 SQL 编辑器中执行。这会创建所有必需的表、视图和行级安全策略（RLS）。' },
      {
        type: 'code',
        lang: 'sql',
        code: `/* 示例：创建商品详情视图 */
CREATE OR REPLACE VIEW public.product_details
AS
SELECT
  p.id,
  p.public_id,
  p.name,
  p.description,
  p.price,
  p.created_at,
  p.user_id,
  (
    SELECT json_agg(json_build_object('id', i.id, 'url', i.url))
    FROM product_images i
    WHERE i.product_id = p.id
  ) AS images
FROM
  products p;`
      },
      { type: 'p', text: '此外，我们为关键数据表启用了行级安全策略（RLS），以确保用户只能访问和修改自己的数据。' },
    ],
  },
  {
    id: 'api',
    title: 'API (Edge Functions)',
    content: [
      { type: 'p', text: '为了提供高性能、可缓存的公共API，我们使用了 Supabase Edge Functions。这些是全球分布式的 Deno Serverless 函数。' },
      { type: 'p', text: '在部署之前，您需要使用 Supabase CLI 登录并链接到您的远程项目。您的 <code>&lt;YOUR_PROJECT_REF&gt;</code> 可以在 Supabase 控制台的 URL 中找到（例如 <code>https://app.supabase.com/project/YOUR_PROJECT_REF</code>）。' },
      {
        type: 'code',
        lang: 'bash',
        code: `# 登录并链接您的项目
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>

# 部署函数，并禁用JWT验证，使其成为公开API
npx supabase functions deploy get-product-details --no-verify-jwt`
      },
      { type: 'p', text: '在函数内部，我们设置了 `Cache-Control` 响应头，以利用 CDN 缓存，将 QPS 性能提升至 ~140。' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// In functions/get-product-details/index.ts
return new Response(
  JSON.stringify(data),
  {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      // 缓存10分钟，让CDN边缘节点处理高并发请求
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  }
)`
      },
    ],
  },
  {
    id: 'frontend',
    title: '前端集成 (Pinia)',
    content: [
      { type: 'p', text: '前端状态管理由 Pinia 负责。我们为每个功能模块（如商品、图片编辑器）创建了独立的 store。' },
      { type: 'p', text: '商品 store (`stores/products.js`) 封装了所有与商品相关的 CRUD 异步操作，并实现了高效的分页逻辑以支持无限滚动。' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// stores/products.js
import { defineStore } from 'pinia';
// ...
export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [],
    loading: false,
    loadingMore: false,
    hasMore: true,
    page: 0,
    pageSize: 10,
  }),
  actions: {
    async fetchInitialProducts() { /* ... */ },
    async fetchMoreProducts() { /* ... */ },
    async createProduct(productData) { /* ... */ },
  }
});`
      },
    ],
  },
]);

// --- 计算属性 ---
const filteredSections = computed(() => {
  if (!searchQuery.value.trim()) {
    return docsContent.value;
  }
  const query = searchQuery.value.toLowerCase();
  return docsContent.value.filter(
    (section) =>
      section.title.toLowerCase().includes(query) ||
      section.content.some((item) => item.text?.toLowerCase().includes(query))
  );
});

// --- 方法 ---
const highlightAllCodeBlocks = () => {
  nextTick(() => {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  });
};

const copyCode = async (code, event) => {
  try {
    await navigator.clipboard.writeText(code);
    const button = event.target.closest('button');
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = '已复制!';
    button.classList.add('copied');
    setTimeout(() => {
      button.querySelector('span').textContent = originalText;
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('无法复制文本: ', err);
    const button = event.target.closest('button');
    button.querySelector('span').textContent = '复制失败';
    setTimeout(() => {
      button.querySelector('span').textContent = '复制';
    }, 2000);
  }
};

// --- 滚动侦测逻辑 ---
const handleScroll = () => {
  let currentSectionId = activeSectionId.value;
  const headerOffset = 100; // 偏移量，确保标题进入视野一段距离后才高亮

  for (const sectionId in sectionRefs.value) {
    const sectionEl = sectionRefs.value[sectionId];
    if (sectionEl) {
      const rect = sectionEl.getBoundingClientRect();
      if (rect.top <= headerOffset && rect.bottom > headerOffset) {
        currentSectionId = sectionId;
        break;
      }
    }
  }

  if (activeSectionId.value !== currentSectionId) {
    activeSectionId.value = currentSectionId;
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  highlightAllCodeBlocks();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="docs-page">
    <div class="container docs-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-sticky-content">
          <div class="search-wrapper">
            <input type="search" v-model="searchQuery" placeholder="搜索文档..." class="search-input" />
          </div>
          <nav class="docs-nav" aria-label="文档导航">
            <ul>
              <li v-for="section in filteredSections" :key="section.id">
                <a :href="`#${section.id}`" :class="{ 'is-active': activeSectionId === section.id }">
                  {{ section.title }}
                </a>
              </li>
              <li v-if="filteredSections.length === 0" class="no-results-nav">
                无匹配结果
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content" ref="mainContentRef">
        <article>
          <section
            v-for="section in docsContent"
            :key="section.id"
            :id="section.id"
            :ref="el => sectionRefs[section.id] = el"
            class="docs-section"
          >
            <h2 class="section-title">{{ section.title }}</h2>
            <div v-for="(item, index) in section.content" :key="index" class="content-block">
              <p v-if="item.type === 'p'" v-html="item.text"></p>
              <div v-else-if="item.type === 'code'" class="code-block-wrapper">
                <button @click="copyCode(item.code, $event)" class="copy-button" aria-label="复制到剪贴板">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                  <span>复制</span>
                </button>
                <pre><code :class="`language-${item.lang}`" v-text="item.code"></code></pre>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.docs-page {
  background-color: transparent;
  padding: 4rem 0;
  color: var(--color-text);
  min-height: 100vh;
}

.docs-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 4rem;
}

// 侧边栏
.sidebar {
  position: relative;
}
.sidebar-sticky-content {
  position: sticky;
  top: 100px; // 假设你的 Header 高度约为 80px
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 1rem;
}

.search-wrapper {
  margin-bottom: 2rem;
}
.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text);
  transition: all 0.3s ease;
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-translucent);
  }
}

.docs-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.docs-nav a {
  display: block;
  padding: 0.6rem 1rem;
  margin-bottom: 0.25rem;
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  border-radius: var(--border-radius-sm);
  border-left: 3px solid transparent;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: var(--color-background-mute);
    color: var(--color-heading);
  }

  &.is-active {
    color: var(--color-primary);
    background-color: var(--color-primary-translucent);
    border-left-color: var(--color-primary);
    font-weight: 600;
  }
}
.no-results-nav {
    padding: 0.6rem 1rem;
    color: var(--color-text-light);
    font-style: italic;
    font-size: 0.9rem;
}

// 主内容区
.main-content {
  line-height: 1.8;
  min-width: 0; // 防止内容过宽导致布局问题
}
.docs-section {
  padding-bottom: 4rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4rem;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-hover);
}

.content-block {
  margin-bottom: 1.5rem;
  font-size: 1.05rem;

  p {
    :deep(code) {
      background-color: var(--color-background-mute);
      padding: 0.2em 0.4em;
      margin: 0 0.1em;
      font-size: 90%;
      border-radius: var(--border-radius-sm);
      font-family: var(--font-family-mono);
      border: 1px solid var(--color-border);
    }
  }
}

.code-block-wrapper {
  position: relative;
  margin: 2rem 0;

  .copy-button {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 600;
    background-color: rgba(70, 70, 90, 0.6);
    color: var(--color-text-light);
    border: 1px solid var(--color-border-hover);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    opacity: 0.3;
    transition: all 0.3s ease;

    &.copied {
        background-color: var(--color-primary);
        color: var(--color-background);
        border-color: var(--color-primary);
        opacity: 1;
    }

    &:not(.copied):hover {
       background-color: rgba(90, 90, 110, 0.8);
       color: var(--color-heading);
    }
  }

  &:hover .copy-button {
    opacity: 1;
  }

  pre {
    margin: 0;
    padding: 1.5rem;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-border);
    overflow-x: auto;
    background-color: #282c34; // atom-one-dark 背景色

    code.hljs {
      padding: 0;
      background-color: transparent;
      color: #abb2bf;
    }
  }
}

// 响应式设计
@media (max-width: $breakpoint-lg) {
  .docs-layout {
    grid-template-columns: 220px 1fr;
    gap: 2rem;
  }
  .section-title {
    font-size: 2rem;
  }
}
@media (max-width: $breakpoint-md) {
  .docs-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: relative;
    .sidebar-sticky-content {
        position: static;
        height: auto;
        overflow-y: visible;
        padding-right: 0;
    }
  }
}
</style>
