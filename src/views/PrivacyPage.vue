<!-- src/views/PrivacyPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// --- 状态管理 ---
const activeSectionId = ref('disclaimer'); // 默认高亮第一部分
const sectionRefs = ref({}); // 存储每个section的DOM引用

// --- 内容中心 ---
// 所有隐私政策内容在此管理，结构清晰，并针对项目特性进行了解释
const privacyContent = ref([
  {
    id: 'disclaimer',
    title: '重要免责声明',
    content: [
      { type: 'p', text: '<strong>请注意：</strong> MHStudio 是一个用于技术展示和个人学习的演示项目。以下“隐私政策”仅为模拟真实世界企业级应用的标准实践而创建，内容仅供参考，<strong>不具备任何法律约束力</strong>。我们不会将收集到的任何信息用于商业目的。' },
    ],
  },
  {
    id: 'introduction',
    title: '1. 引言',
    content: [
      { type: 'p', text: '欢迎来到 MHStudio。我们尊重您的隐私，并致力于保护您的个人数据。本隐私政策将告知您，当您访问我们的服务时，我们如何处理您的个人数据，并告知您所享有的隐私权以及法律如何保护您。' },
    ],
  },
  {
    id: 'data-we-collect',
    title: '2. 我们收集的数据',
    content: [
      { type: 'p', text: '我们收集和处理以下几类关于您的数据：' },
      { type: 'p', text: '<strong>2.1 您直接向我们提供的数据：</strong>' },
      {
        type: 'ul',
        items: [
          '<strong>身份和联系数据：</strong> 当您使用邮箱/密码注册时，我们会收集您的电子邮件地址。',
          '<strong>用户生成内容 (UGC)：</strong> 您通过本服务创建和上传的所有内容，包括但不限于商品信息（名称、描述、价格）、您上传的图片，以及您存储在“文件保险库”中的任何文件。',
        ],
      },
       { type: 'p', text: '<strong>2.2 我们从第三方获得的数据：</strong>' },
      {
        type: 'ul',
        items: [
         '当您选择通过 <strong>GitHub</strong> 登录时，我们会根据您的 GitHub 账户隐私设置，接收您的部分公开个人资料信息，通常包括您的用户名、公开邮箱地址和头像URL。',
        ],
      },
       { type: 'p', text: '<strong>2.3 我们自动收集的数据：</strong>' },
       {
        type: 'ul',
        items: [
         '<strong>会话管理 Cookies：</strong> 我们的后端服务提供商 Supabase 使用必要的 cookies 来安全地管理您的登录会话。这些 cookies 对于身份验证至关重要，是服务正常运行所必需的。除此以外，我们不会使用追踪或分析性 cookies。',
        ],
      },
    ],
  },
  {
    id: 'how-we-use-data',
    title: '3. 我们如何使用您的数据',
    content: [
      { type: 'p', text: '我们仅在法律允许的情况下使用您的个人数据。最常见的情况是：' },
      {
        type: 'ul',
        items: [
          '<strong>提供和管理您的账户：</strong> 用于验证您的身份，允许您登录和使用服务。',
          '<strong>托管和展示您的内容：</strong> 存储和提供您上传的商品、图片和文件。',
          '<strong>与您沟通：</strong> 向您发送必要的服务相关邮件，例如账户确认和密码重置请求。',
          '<strong>维护服务安全：</strong> 保护我们的平台免受欺诈和滥用。',
        ],
      },
    ],
  },
  {
    id: 'data-sharing',
    title: '4. 数据共享与披露',
    content: [
      { type: 'p', text: '我们郑重承诺，绝不向任何第三方出售、交易或出租您的个人身份信息。' },
      { type: 'p', text: '您的数据共享仅限于以下情况：' },
      {
        type: 'ul',
        items: [
          '<strong>服务提供商：</strong> 您的所有数据，包括个人信息和用户内容，都存储和处理于我们的后端即服务（BaaS）提供商 <strong>Supabase</strong> 的服务器上。Supabase 遵循行业领先的安全标准来保护您的数据。您可以查阅 <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" class="inline-link">Supabase 的隐私政策</a>。',
          '<strong>法律要求：</strong> 如果法律要求或为响应有效的法律程序，我们可能会披露您的信息。',
        ],
      },
    ],
  },
  {
    id: 'data-security',
    title: '5. 数据安全',
    content: [
      { type: 'p', text: '我们非常重视您的数据安全。我们利用 Supabase 提供的强大安全功能，并在此基础上实施了额外的安全措施，例如在数据库层面启用<strong>行级安全策略（RLS）</strong>，以确保您只能访问到属于您自己的数据，从而防止数据泄露和越权访问。' },
      { type: 'p', text: '然而，请理解，没有任何通过互联网的传输方法或电子存储方法是100%安全的。' },
    ],
  },
  {
    id: 'your-rights',
    title: '6. 您的权利',
    content: [
      { type: 'p', text: '您对您的个人数据拥有以下权利：' },
      {
        type: 'ul',
        items: [
          '<strong>访问和更新权：</strong> 您可以随时登录您的账户来访问和更新您的基本信息。',
          '<strong>删除权：</strong> 您可以通过应用界面删除您上传的商品和文件。如果您希望完全删除您的账户和所有相关数据，请通过我们的 <a href="/contact" target="_blank" rel="noopener noreferrer" class="inline-link">联系页面</a> 向我们提出请求。',
        ],
      },
    ],
  },
  {
    id: 'changes',
    title: '7. 政策变更',
    content: [
      { type: 'p', text: '我们可能会不时更新本隐私政策。任何变更都将在此页面上发布。我们建议您定期查看本隐私政策以了解任何更新。' },
    ],
  },
]);

// --- 滚动侦测逻辑 ---
const handleScroll = () => {
  let currentSectionId = activeSectionId.value;
  const headerOffset = 120;

  const sectionElements = Object.values(sectionRefs.value).filter(el => el);
  for (const sectionEl of sectionElements) {
    const rect = sectionEl.getBoundingClientRect();
    if (rect.top <= headerOffset && rect.bottom > headerOffset) {
      currentSectionId = sectionEl.id;
      break;
    }
  }

  if (activeSectionId.value !== currentSectionId) {
    activeSectionId.value = currentSectionId;
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="privacy-page">
    <div class="container page-layout">
      <!-- 侧边栏导航 -->
      <aside class="page-sidebar">
        <div class="sidebar-sticky-content">
          <h3 class="sidebar-title">政策目录</h3>
          <nav class="page-nav" aria-label="隐私政策导航">
            <ul>
              <li v-for="section in privacyContent" :key="section.id">
                <a :href="`#${section.id}`" :class="{ 'is-active': activeSectionId === section.id }">
                  {{ section.title }}
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <header class="page-header">
          <h1>隐私政策</h1>
          <p class="last-updated">最后更新于：{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </header>
        <article>
          <section
            v-for="section in privacyContent"
            :key="section.id"
            :id="section.id"
            :ref="el => sectionRefs[section.id] = el"
            class="page-section"
            :class="{ 'disclaimer-section': section.id === 'disclaimer' }"
          >
            <h2 v-if="section.id !== 'disclaimer'" class="section-title">{{ section.title }}</h2>
            <div v-for="(item, index) in section.content" :key="index" class="content-block">
              <p v-if="item.type === 'p'" v-html="item.text"></p>
              <ol v-else-if="item.type === 'ol'">
                <li v-for="(li, i) in item.items" :key="i" v-html="li"></li>
              </ol>
              <ul v-else-if="item.type === 'ul'">
                <li v-for="(li, i) in item.items" :key="i" v-html="li"></li>
              </ul>
            </div>
          </section>
        </article>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.privacy-page {
  background-color: transparent;
  padding: 4rem 0;
  color: var(--color-text);
}

.page-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 4rem;
}

// 侧边栏
.page-sidebar {
  position: relative;
}
.sidebar-sticky-content {
  position: sticky;
  top: 100px;
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding-right: 1.5rem;
  border-right: 1px solid var(--color-border);
}
.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 1.5rem;
  padding-left: 1rem;
}
.page-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.page-nav a {
  display: block;
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
  color: var(--color-text-light);
  text-decoration: none;
  font-size: 0.95rem;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: var(--color-background-mute);
    color: var(--color-heading);
  }

  &.is-active {
    color: var(--color-primary);
    background-color: var(--color-primary-translucent);
    font-weight: 600;
  }
}

// 主内容区
.main-content {
  line-height: 1.8;
  font-size: 1.05rem;
}
.page-header {
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2rem;
  h1 {
    font-size: 3rem;
    font-weight: 800;
    color: var(--color-heading);
  }
  .last-updated {
    color: var(--color-text-light);
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
}

.page-section {
  margin-bottom: 3rem;

  &.disclaimer-section {
    background-color: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--border-radius-lg);
    padding: 1.5rem 2rem;
    font-size: 1rem;
    :deep(strong) {
      color: #f87171;
    }
  }
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 1.5rem;
}

.content-block {
  margin-bottom: 1rem;
  ol, ul {
    padding-left: 2rem;
    li {
        margin-bottom: 0.75rem;
    }
  }
  :deep(strong) {
    color: var(--color-heading);
    font-weight: 600;
  }
  :deep(.inline-link) {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
    &:hover {
        border-bottom-color: var(--color-primary);
    }
  }
}

// 响应式设计
@media (max-width: $breakpoint-lg) {
  .page-layout {
    grid-template-columns: 240px 1fr;
    gap: 2rem;
  }
  .page-header h1 { font-size: 2.5rem; }
  .section-title { font-size: 1.5rem; }
}

@media (max-width: $breakpoint-md) {
  .page-layout {
    grid-template-columns: 1fr;
  }
  .page-sidebar {
    position: static;
    margin-bottom: 3rem;
    .sidebar-sticky-content {
      position: static;
      height: auto;
      overflow-y: visible;
      padding-right: 0;
      border-right: none;
    }
  }
}
</style>