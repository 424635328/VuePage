<!-- src/views/TermsPage.vue -->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// --- 状态管理 ---
const activeSectionId = ref('disclaimer'); // 默认高亮第一部分
const sectionRefs = ref({}); // 存储每个section的DOM引用

// --- 内容中心 ---
// 所有条款内容都在此管理，结构清晰，易于维护
const termsContent = ref([
  {
    id: 'disclaimer',
    title: '重要免责声明',
    content: [
      { type: 'p', text: '<strong>请注意：</strong> MHStudio 是一个用于技术展示和个人学习的演示项目。以下“服务条款”仅为模拟真实世界企业级应用的标准实践而创建，内容仅供参考，<strong>不具备任何法律约束力</strong>。本平台并非商业运营实体，不提供任何商业服务。' },
    ],
  },
  {
    id: 'agreement',
    title: '1. 协议接受',
    content: [
      { type: 'p', text: '欢迎使用 MHStudio（下称“本服务”）。访问或使用本服务，即表示您确认已阅读、理解并同意受本服务条款（下称“本条款”）的约束。如果您不同意本条款的任何部分，请立即停止使用本服务。' },
    ],
  },
  {
    id: 'accounts',
    title: '2. 用户账户',
    content: [
      { type: 'p', text: '<strong>2.1 账户创建：</strong> 您可以通过提供邮箱地址或使用第三方授权（如 GitHub）来创建账户。您同意提供准确、完整和最新的注册信息。' },
      { type: 'p', text: '<strong>2.2 账户责任：</strong> 您对您账户下发生的所有活动负全部责任，并有责任妥善保管您的密码等凭证。任何未经授权使用您账户的情况，应立即通知我们。' },
      { type: 'p', text: '<strong>2.3 账户终止：</strong> 我们保留因任何原因（包括但不限于违反本条款）随时暂停或终止您账户的权利，恕不另行通知。' },
    ],
  },
  {
    id: 'user-content',
    title: '3. 用户生成内容 (UGC)',
    content: [
      { type: 'p', text: '<strong>3.1 定义：</strong> “用户内容”指您通过本服务上传、发布或传输的任何信息，包括但不限于商品描述、图片、在“文件保险库”中存储的文件等。' },
      { type: 'p', text: '<strong>3.2 所有权：</strong> 您保留您创建和上传的用户内容的完整所有权。我们不对您的用户内容主张任何所有权。' },
      { type: 'p', text: '<strong>3.3 许可授予：</strong> 为了使我们能够运营和提供本服务，当您上传用户内容时，您授予 MHStudio 一个全球性的、非独家的、免版税的许可，允许我们托管、存储、备份、复制和展示您的用户内容。此许可仅用于提供和改进本服务，并将在您删除用户内容或终止账户后终止。' },
      { type: 'p', text: '<strong>3.4 内容责任：</strong> 您对您的用户内容及其合法性、可靠性和适当性负全部责任。' },
    ],
  },
  {
    id: 'prohibited-conduct',
    title: '4. 禁止行为',
    content: [
      { type: 'p', text: '您同意在使用本服务时，不会从事以下任何行为：' },
      {
        type: 'ol',
        items: [
          '发布任何非法的、骚扰性的、诽谤性的、辱骂性的、暴力的、淫秽的或在其他方面令人反感的内容。',
          '侵犯任何第三方的知识产权，包括版权、商标、专利或商业秘密。',
          '从事任何可能损害、禁用、过载或损害本服务服务器或网络完整性的活动。',
          '试图未经授权访问本服务、其他用户账户或连接到本服务的计算机系统。',
          '将本服务用于任何商业目的（因为这只是一个演示项目）。',
        ],
      },
    ],
  },
  {
    id: 'platform-ip',
    title: '5. 平台知识产权',
    content: [
      { type: 'p', text: '本服务及其所有原始内容、特性和功能（不包括用户内容）是并且将继续是 MHStudio 及其所有者（GitHub 用户 <strong>424635328</strong>）的专有财产。本服务受版权、商标和其他法律的保护。' },
    ],
  },
  {
    id: 'disclaimer-warranty',
    title: '6. 免责声明',
    content: [
      { type: 'p', text: '本服务按“原样”和“现有”基础提供，不附带任何明示或暗示的保证。我们不保证本服务将不间断、安全或无错误，也不保证通过本服务获得的任何信息是准确或可靠的。' },
    ],
  },
  {
    id: 'liability',
    title: '7. 责任限制',
    content: [
      { type: 'p', text: '在任何情况下，MHStudio 及其创建者均不对因您访问或使用（或无法访问或使用）本服务而产生的任何间接的、偶然的、特殊的、后果性的或惩罚性的损害负责。' },
    ],
  },
  {
    id: 'changes',
    title: '8. 条款变更',
    content: [
      { type: 'p', text: '我们保留随时自行决定修改或替换本条款的权利。如果我们进行重大变更，我们将尽力提供合理的通知。' },
    ],
  },
  {
    id: 'contact',
    title: '9. 联系我们',
    content: [
      { type: 'p', text: '如果您对本条款有任何疑问，请通过我们的  <a href="/contact" target="_blank" rel="noopener noreferrer" class="inline-link">联系页面</a>与我们联系。' },
    ],
  },
]);

// --- 滚动侦测逻辑 ---
const handleScroll = () => {
  let currentSectionId = activeSectionId.value;
  const headerOffset = 120; // 视口顶部偏移量

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
  <div class="terms-page">
    <div class="container terms-layout">
      <!-- 侧边栏导航 -->
      <aside class="terms-sidebar">
        <div class="sidebar-sticky-content">
          <h3 class="sidebar-title">条款目录</h3>
          <nav class="terms-nav" aria-label="服务条款导航">
            <ul>
              <li v-for="section in termsContent" :key="section.id">
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
          <h1>服务条款</h1>
          <p class="last-updated">最后更新于：{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </header>
        <article>
          <section
            v-for="section in termsContent"
            :key="section.id"
            :id="section.id"
            :ref="el => sectionRefs[section.id] = el"
            class="terms-section"
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

.terms-page {
  background-color: transparent;
  padding: 4rem 0;
  color: var(--color-text);
}

.terms-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 4rem;
}

// 侧边栏
.terms-sidebar {
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
.terms-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.terms-nav a {
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

.terms-section {
  margin-bottom: 3rem;

  &.disclaimer-section {
    background-color: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.4);
    border-radius: var(--border-radius-lg);
    padding: 1.5rem 2rem;
    font-size: 1rem;
    :deep(strong) {
      color: #ffc107;
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
  .terms-layout {
    grid-template-columns: 240px 1fr;
    gap: 2rem;
  }
  .page-header h1 { font-size: 2.5rem; }
  .section-title { font-size: 1.5rem; }
}

@media (max-width: $breakpoint-md) {
  .terms-layout {
    grid-template-columns: 1fr;
  }
  .terms-sidebar {
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