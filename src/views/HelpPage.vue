<!-- src/views/HelpPage.vue -->

<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';

// --- 状态管理 ---
const searchQuery = ref('');
const openQuestionId = ref(null);

// --- 核心方法：派发一个全局事件 ---
// 此函数将创建一个全局可监听的自定义事件，用于请求打开认证模态框。
// 这是在不修改其他组件（如App.vue或AuthModal.vue）的情况下，实现跨组件通信的一种解耦方式。
function requestOpenAuthModal() {
  const event = new CustomEvent('open-auth-modal', {
    bubbles: true, // 事件可以冒泡
    composed: true // 事件可以穿透 Shadow DOM
  });
  // 在 window 对象上派发事件
  window.dispatchEvent(event);
}

// --- 数据中心 (企业级内容与结构) ---
// 将FAQ内容结构化，特别是将“忘记密码”的交互部分分离出来，以便在模板中绑定Vue的@click事件。
const faqCategories = ref([
  {
    category: '账户与安全',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 7a3 3 0 11-6 0 3 3 0 016 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />`,
    questions: [
      {
        q: "支持哪些账户登录方式？",
        a: `我们提供多种灵活且安全的认证方案以适应不同用户偏好：
            <ul>
              <li><strong>邮箱/密码</strong>: 传统且可靠的注册登录方式。</li>
              <li><strong>GitHub OAuth</strong>: 如果您是开发者，可以通过一键授权您的 GitHub 账户快速登录，无需额外记密码。</li>
              <li><strong>OTP (一次性密码)</strong>: 输入邮箱，我们会发送一个临时登录码。这是一种高度安全、无需密码的现代登录方式。</li>
            </ul>
            您可以在导航栏的登录弹窗中自由选择。`
      },
      {
        q: "我的数据和上传的文件是如何保证安全的？",
        a: `我们视用户数据安全为最高优先级，并从架构层面构建了多层防御：
            <ul>
              <li><strong>行级安全 (RLS)</strong>: 这是我们安全策略的核心。在数据库层面，我们通过 PostgreSQL 的 RLS 策略，强制确保任何用户（无论通过何种API）都只能访问和修改严格属于自己的数据，彻底杜绝了数据越权风险。</li>
              <li><strong>云存储隔离</strong>: 所有用户上传的文件都存储在隔离的存储桶路径下，访问权限与您的用户身份绑定。</li>
              <li><strong>孤儿文件自动清理</strong>: 当您删除一个商品或文件保险库中的项目时，与之关联的云端存储文件会被后端逻辑自动、安全地删除，保证了数据一致性并节约存储成本。</li>
            </ul>`
      },
      {
        q: "如果忘记密码了，我应该怎么做？",
        // 将内容分为文本和动作，以便在模板中分别渲染
        a: `如果您忘记了密码，请在登录弹窗中点击“忘记密码？”链接。在弹出的表单中输入您的注册邮箱，系统会立即向您发送一封包含密码重置链接的邮件。`,
        action: { // 一个action对象，用于在模板中生成一个可交互的按钮
          text: '打开登录面板以重置密码',
          handler: requestOpenAuthModal // 绑定事件派发函数
        }
      }
    ]
  },
  {
    category: '功能使用',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.621.428 1.254 1.024 1.729 1.729 1.628 2.484 2.437 5.234 2.437 8.167v1.84c0 .822-.668 1.49-1.49 1.49H5.51c-.822 0-1.49-.668-1.49-1.49v-1.84c0-2.933.809-5.683 2.437-8.167C7.026 4.128 7.659 3.532 8.28 3.104z" />`,
    questions: [
      {
        q: "在线图片编辑器的强大之处体现在哪里？",
        a: `我们的图片编辑器旨在提供桌面级的操作体验：
            <ul>
              <li><strong>无损编辑</strong>: 所有的滤镜、缩放、平移操作都基于历史记录。您可以无限次地撤销 (<kbd>Ctrl/Cmd</kbd> + <kbd>Z</kbd>) 和重做 (<kbd>Ctrl/Cmd</kbd> + <kbd>Y</kbd>)，您的原始图片始终保持不变。</li>
              <li><strong>智能快捷键</strong>: 我们深度集成了全局快捷键，例如按住 <kbd>空格键</kbd> 可以在任意模式下临时切换到拖拽画布模式。同时，系统能智能识别您是否在输入框中，避免快捷键冲突。</li>
              <li><strong>前端性能优化</strong>: 图片在上传前会通过 <code>browser-image-compression</code> 在浏览器端进行高效压缩，这极大地加快了上传速度，节省了您的流量和我们的云存储成本。</li>
            </ul>`
      },
      {
        q: "文件保险库 (File Vault) 和商品图片有什么区别？",
        a: `它们是为不同目的设计的两个独立模块：
            <ul>
              <li><strong>商品图片</strong>: 专门用于与您的商品/作品关联，会展示在商店和详情页。它们通常是 <code>.jpg</code>, <code>.png</code>, <code>.webp</code> 等图片格式。</li>
              <li><strong>文件保险库</strong>: 是您的个人、通用的云存储空间。您可以上传几乎任何类型的文件（如 <code>.zip</code>, <code>.pdf</code>, <code>.psd</code>, <code>.exe</code>），用于备份、分享或管理个人资产。它提供了批量操作（如打包下载）功能，是一个功能更全面的文件管理器。</li>
            </ul>`
      },
      {
        q: "Shop页面的无限滚动是如何提升体验的？",
        a: `传统的的分页（Pagination）会打断用户的浏览心流。我们采用**无限滚动 (Infinite Scroll)** 技术，实现了：
            <ul>
              <li><strong>极速初始加载</strong>: 首次进入页面时，我们只加载第一屏需要的少量数据，页面几乎瞬时打开。</li>
              <li><strong>流畅浏览</strong>: 当您滚动到页面底部时，下一页的数据会自动在后台加载并无缝衔接到列表末尾，创造出一种内容“无限”的沉浸式浏览体验。</li>
              <li><strong>后端优化</strong>: 该功能由经过优化的分页API驱动，确保了即使在商品数量巨大的情况下，服务器和数据库的负载依然保持在低位。</li>
            </ul>`
      }
    ]
  }
]);

// --- 计算属性 (核心交互逻辑) ---
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return faqCategories.value;
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase();

  return faqCategories.value
    .map(category => {
      const filteredQuestions = category.questions.filter(
        q => q.q.toLowerCase().includes(lowerCaseQuery) || q.a.toLowerCase().includes(lowerCaseQuery)
      );
      return { ...category, questions: filteredQuestions };
    })
    .filter(category => category.questions.length > 0);
});

// --- 方法 ---
const getQuestionId = (catIndex, qIndex) => `${catIndex}-${qIndex}`;

const toggleQuestion = (id) => {
  openQuestionId.value = openQuestionId.value === id ? null : id;
};

// --- JS驱动的平滑动画钩子 (用于折叠面板) ---
const onBeforeEnter = (el) => {
  el.style.opacity = 0;
  el.style.height = '0';
};

const onEnter = (el, done) => {
  requestAnimationFrame(() => {
    el.style.height = el.scrollHeight + 'px';
    el.style.opacity = 1;
    el.addEventListener('transitionend', done, { once: true });
  });
};

const onAfterEnter = (el) => {
  el.style.height = 'auto';
};

const onLeave = (el, done) => {
  el.style.height = el.scrollHeight + 'px';
  requestAnimationFrame(() => {
    el.style.height = '0';
    el.style.opacity = 0;
    el.addEventListener('transitionend', done, { once: true });
  });
};
</script>

<template>
  <main class="help-page">
    <div class="container">
      <div class="help-header">
        <h1>帮助与支持中心</h1>
        <p>我们在这里为您解答疑惑，助您充分利用平台功能。</p>
      </div>

      <div class="search-bar-wrapper">
        <label for="faq-search" class="sr-only">搜索问题</label>
        <div class="search-input-container">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="faq-search"
            type="search"
            v-model="searchQuery"
            placeholder="搜索关键词，例如：“安全”、“快捷键”..."
          />
        </div>
      </div>

      <div class="faq-content">
        <template v-if="filteredCategories.length > 0">
          <div v-for="(category, catIndex) in filteredCategories" :key="category.category" class="faq-category">
            <h2 class="category-title">
              <svg xmlns="http://www.w3.org/2000/svg" class="category-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" v-html="category.icon"></svg>
              {{ category.category }}
            </h2>
            <div class="faq-list">
              <div
                v-for="(item, qIndex) in category.questions"
                :key="getQuestionId(catIndex, qIndex)"
                class="faq-item"
                :class="{ 'is-open': openQuestionId === getQuestionId(catIndex, qIndex) }"
              >
                <button
                  class="question-header"
                  @click="toggleQuestion(getQuestionId(catIndex, qIndex))"
                  :aria-expanded="openQuestionId === getQuestionId(catIndex, qIndex)"
                  :aria-controls="`faq-answer-${getQuestionId(catIndex, qIndex)}`"
                >
                  <span class="question-text">{{ item.q }}</span>
                  <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
                <transition
                  name="smooth-expand"
                  @before-enter="onBeforeEnter"
                  @enter="onEnter"
                  @after-enter="onAfterEnter"
                  @leave="onLeave"
                >
                  <div
                    v-show="openQuestionId === getQuestionId(catIndex, qIndex)"
                    class="answer-panel"
                    :id="`faq-answer-${getQuestionId(catIndex, qIndex)}`"
                  >
                    <div class="answer-content">
                      <p v-html="item.a"></p>
                      <button v-if="item.action" @click="item.action.handler" class="btn-help-action">
                        <span>{{ item.action.text }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="no-results">
          <h3>未能找到相关结果</h3>
          <p>请尝试更换您的搜索关键词，或直接与我们联系。</p>
        </div>
      </div>

      <div class="contact-prompt">
        <h2>仍需帮助？</h2>
        <p>我们的团队随时准备为您提供一对一的支持。请通过联系页面向我们发送消息。</p>
        <RouterLink to="/contact" class="btn btn-primary">联系我们</RouterLink>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/index.scss' as *;

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.help-page {
  background-color: transparent;
  position: relative;
  z-index: 10;
  min-height: calc(100vh - var(--header-height, 80px) - var(--footer-height, 300px));
  padding: 5rem 0;
  color: var(--color-text);
}

.help-header {
  text-align: center;
  margin-bottom: 3rem;
  h1 {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 800;
    color: var(--color-heading);
    margin-bottom: 0.75rem;
  }
  p {
    font-size: 1.125rem;
    color: var(--color-text-light);
    max-width: 650px;
    margin: 0 auto;
  }
}

.search-bar-wrapper {
  max-width: 800px;
  margin: 0 auto 4rem;
  .search-input-container {
    position: relative;
    display: flex;
    align-items: center;
    svg {
      position: absolute;
      left: 1.25rem;
      width: 1.5rem;
      height: 1.5rem;
      color: var(--color-text-light);
      transition: color 0.3s ease;
    }
    input[type="search"] {
      width: 100%;
      padding: 1rem 1.25rem 1rem 4rem;
      font-size: 1rem;
      color: var(--color-text);
      background-color: var(--color-background-soft-translucent);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-full);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      -webkit-appearance: none;

      &::placeholder {
        color: var(--color-text-light);
      }
      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-translucent);
        & + svg,
        ~ svg {
          color: var(--color-primary);
        }
      }
    }
  }
}

.faq-content {
  max-width: 800px;
  margin: 0 auto;
}

.faq-category {
  margin-bottom: 3.5rem;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border-hover);
  .category-icon {
    width: 2rem;
    height: 2rem;
    stroke: var(--color-primary);
  }
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background-color: var(--color-background-soft-translucent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: border-color 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: var(--color-border-hover);
  }
  &.is-open {
    border-color: var(--color-primary-translucent-heavy);
  }
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1.25rem 1.5rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;

  .question-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
    transition: color 0.3s ease;
    padding-right: 1rem;
  }

  &:hover .question-text {
    color: var(--color-primary);
  }

  .chevron-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: var(--color-text-light);
    flex-shrink: 0;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.faq-item.is-open .chevron-icon {
  transform: rotate(180deg);
}

.answer-panel {
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease-in-out;
}

.answer-content {
  padding: 0 1.5rem 1.5rem;
  color: var(--color-text);
  line-height: 1.8;

  p {
    margin-bottom: 1rem;
  }
  
  // v-html 渲染内容的样式
  :deep(ul) {
    padding-left: 20px;
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  :deep(li::marker) {
    color: var(--color-primary);
  }
  :deep(strong) {
    color: var(--color-heading);
  }
  :deep(code), :deep(kbd) {
    background-color: var(--color-background-mute);
    padding: 0.2em 0.4em;
    margin: 0 0.1em;
    font-size: 90%;
    border-radius: var(--border-radius-sm);
    font-family: var(--font-family-mono);
    border: 1px solid var(--color-border);
  }
  :deep(kbd) {
    font-weight: 600;
    color: var(--color-text-light);
  }
}

.btn-help-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.65rem 1.25rem;
  background-color: var(--color-primary-translucent);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-md);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9em;
  transition: all 0.3s ease;

  svg {
    width: 1.1rem;
    height: 1.1rem;
    transition: transform 0.3s ease;
  }

  &:hover {
    background-color: var(--color-primary);
    color: var(--color-background);
    transform: translateY(-3px);
    box-shadow: 0 4px 15px var(--color-primary-translucent-heavy);

    svg {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--color-primary-translucent-heavy);
  }
}

.no-results {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--color-background-soft-translucent);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  h3 {
    font-size: 1.5rem;
    color: var(--color-heading);
  }
  p {
    color: var(--color-text-light);
  }
}

.contact-prompt {
  text-align: center;
  margin-top: 5rem;
  padding: 3rem 2rem;
  background-color: var(--color-background-soft);
  border-radius: var(--border-radius-xl);
  border: 1px solid var(--color-border);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  h2 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
    color: var(--color-heading);
  }
  p {
    margin-bottom: 2rem;
    color: var(--color-text-light);
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
}

@media (max-width: $breakpoint-md) {
  .help-page {
    padding: 3rem 0;
  }
  .search-bar-wrapper {
    margin-bottom: 3rem;
  }
  .category-title {
    font-size: 1.5rem;
  }
}
</style>
