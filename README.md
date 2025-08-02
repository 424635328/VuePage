# Vue 3 企业级作品集展示 (Enterprise-Grade Portfolio Showcase)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![VueJS](https://img.shields.io/badge/Vue.js-3.x-42b883) ![Vite](https://img.shields.io/badge/Vite-^5.0-646cff) ![Pinia](https://img.shields.io/badge/Pinia-^2.1-ffd859) ![License](https://img.shields.io/badge/license-MIT-blue)

本项目是一个基于 Vue 3 Composition API、Vite、Vue Router 和 Pinia 构建的、高度动态且具有丰富视觉效果的纯前端个人作品集。其核心目标不仅是展示项目成果，更是通过企业级的代码架构、现代化的工程实践和极致的用户体验，全面展示开发者的专业前端技能。

## ✨ 核心特性

- **惊艳的视觉效果**: 集成了一个由 React/TSX 精心移植而来的赛博朋克风格动态极光背景，包含了粒子、光球、视差、雨滴、闪电、霓虹灯等多种高级视觉特效。
- **现代化的技术栈**: 全面拥抱 Vue 3 Composition API，利用 Vite 提供极速的开发体验，并采用 Pinia 进行类型安全的状态管理。
- **企业级 SCSS 架构**: 遵循 Sass 官方最新指南，使用 `@use` 和 `@forward` 规则构建了模块化、无污染、易于维护的样式系统。
- **流畅的交互与动画**: 大量运用 `Intersection Observer API` 实现滚动触发动画，结合 `@vueuse/motion` 创造出优雅的交错入场效果、平滑的页面过渡和细腻的微交互。
- **完全响应式设计**: 从 4K 桌面端到移动端，所有组件和布局都经过精心适配，确保在任何设备上都有一致且卓越的视觉体验。
- **高内聚组件化开发**: 遵循“单一职责”原则，将 UI 彻底拆分为高内聚、低耦合的可复用组件，提升了代码的可维护性和可扩展性。

## 🚀 快速开始

在开始之前，请确保您的本地环境已安装 [Node.js](https://nodejs.org/) (推荐 LTS 版本) 和 `npm` 或 `yarn`。

1.  **克隆仓库**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```

2.  **进入项目目录**

    ```bash
    cd your-repo-name
    ```

3.  **安装依赖**

    ```bash
    npm install
    ```

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    项目将在本地启动，通常地址为 `http://localhost:5173`。

## 📁 项目架构与文件解析

本项目的 `src` 目录结构经过精心设计，遵循了关注点分离和高内聚的原则。

```
src
├── 📁 assets
│   ├── 🖼️ LOGO.png
│   ├── 📄 projects.json
│   └── 📁 styles
│       ├── 📄 _variables.scss
│       ├── 📄 index.scss
│       └── 📄 main.scss
├── 📁 components
│   ├── 📄 AppFooter.vue
│   ├── 📄 AppHeader.vue
│   ├── 📄 AuroraBackground.vue
│   ├── 📄 FeatureCard.vue
│   └── 📄 ProjectCard.vue
├── 📁 router
│   └── 📄 index.js
├── 📁 store & stores
│   ├── 📄 ui.js
│   └── 📄 counter.js
├── 📁 views
│   ├── 📄 ContactPage.vue
│   ├── 📄 HomePage.vue
│   └── 📄 ProjectsPage.vue
├── 📄 App.vue
└── 📄 main.js
```

---

### **`📁 assets`** - 静态资源中心

该目录存放所有非代码的静态资源，是项目视觉和数据的基石。

- **`🖼️ LOGO.png`**
  - **作用**: 网站的品牌 Logo 标识。
  - **关联**:
    - 被 `components/AppHeader.vue` 引用，显示在页面顶部导航栏。
    - 被 `components/AppFooter.vue` 引用，显示在页面底部信息区。

- **`📄 projects.json`**
  - **作用**: 静态项目数据库。它以 JSON 格式存储了所有作品集信息（标题、描述、技术栈、图片URL等），用于模拟一个后端 API 的数据返回。
  - **技术细节**: 这种方式让前端可以在没有后端服务的情况下独立开发和展示动态内容。
  - **关联**:
    - 在 `views/ProjectsPage.vue` 中，通过 `import('@/assets/projects.json')` 的方式被**异步动态导入**。这是一种代码分割技术，意味着该 JSON 文件只会在用户访问项目页面时才被加载，优化了首页的加载性能。

- **`📁 styles`**: 项目的样式系统核心，采用现代 Sass 模块化架构。
  - **`📄 _variables.scss`**:
    - **作用**: **设计规范（Design Tokens）的源文件**。它定义了整个项目的所有基础设计变量，是样式的“单一数据源 (Single Source of Truth)”。
    - **内容**:
      1.  **CSS 自定义属性 (Variables)**: 在 `:root` 中定义，如 `--color-background`, `--color-primary` 等。这些变量可以在运行时被 JavaScript 访问，并能在整个应用中被任何 CSS 使用。
      2.  **SCSS 变量**: 如 `$container-width`, `$header-height` 等。这些是编译时变量，用于 SCSS 的逻辑运算，如布局计算。
    - **关联**:
      - 被 `styles/index.scss` 使用 `@forward` 转发。
      - 被 `styles/main.scss` 使用 `@use` 导入。

  - **`📄 index.scss`**:
    - **作用**: **组件级 SCSS 模块的统一出口**。它的唯一职责是使用 `@forward` 规则，将 `_variables.scss` 中定义的变量和工具“转发”出去。
    - **技术细节**: 这是解决 Sass `@import` 弃用警告并遵循现代模块化规范的关键。它允许其他组件通过 `@use '@/assets/styles/index.scss' as *;` 一次性导入所有共享变量，而不会造成全局污染或重复编译。
    - **关联**: 在所有需要使用 SCSS 变量的 `.vue` 组件中 (如 `AppHeader.vue`, `FeatureCard.vue` 等) 被 `@use`。

  - **`📄 main.scss`**:
    - **作用**: **全局样式规则的定义文件**。它负责设置整个应用的基础样式。
    - **内容**: CSS Reset、`body` 的字体和背景、通用的 `.container` 布局类、全局链接 `<a>` 样式等。
    - **关联**:
      - 在 `main.js` 中被**唯一一次**导入，确保这些全局样式被应用到整个应用。
      - 使用 `@use 'variables';` 来访问 SCSS 变量。

### **`📁 components`** - 可复用 UI 构建块

存放构成页面的独立、可复用的 UI 组件。

- **`📄 AppFooter.vue` & `📄 AppHeader.vue`**
  - **作用**: 定义了应用的全局页眉和页脚，是构成网站一致性布局的“外壳”部分。`AppHeader` 还实现了滚动变色和响应式汉堡菜单等复杂逻辑。
  - **关联**: 在 `App.vue` 中被直接使用，包裹着 `<router-view>`。

- **`📄 AuroraBackground.vue`**
  - **作用**: **项目的视觉核心**。一个从 React/TSX + Framer Motion + Styled Components 技术栈精心移植过来的、功能极其复杂的动态背景组件。
  - **技术细节**: 它内部集成了多种动画技术：CSS Keyframes（雨滴、闪电）、Vue Motion（极光光球、玻璃碎片）以及 `@vueuse/core` 的 `useMouse`（视差效果），是高级前端动画技术的集中体现。
  - **关联**: 在 `App.vue` 中被用作最底层的背景。

- **`📄 FeatureCard.vue` & `📄 ProjectCard.vue`**
  - **作用**: **原子化的信息展示组件**。`FeatureCard` 用于展示单项特性（图标+标题+描述），`ProjectCard` 用于展示更复杂的项目信息（图片+标题+描述+标签+链接）。
  - **最佳实践**: 它们是组件化思想的最佳体现。通过 `props` 接收数据，通过 `slots` 接收图标等复杂内容，实现了内容与表现的分离。
  - **关联**:
    - `FeatureCard.vue` 在 `views/HomePage.vue` 中被循环使用。
    - `ProjectCard.vue` 在 `views/ProjectsPage.vue` 中被循环使用。

### **`📁 router`** - 路由配置中心

- **`📄 index.js`**
  - **作用**: **应用的导航地图**。使用 `vue-router` 定义了所有页面的路由规则。
  - **技术细节**:
    - **路径映射**: 将 URL 路径（如 `/`）与对应的视图组件（如 `HomePage.vue`）进行绑定。
    - **路由懒加载**: 通过 `component: () => import('../views/HomePage.vue')` 的语法实现。这意味着每个页面的代码只在该页面被访问时才会被网络加载，极大地优化了应用的初始加载速度和体积。
  - **关联**: 在 `main.js` 中被导入并注册。

### **`📁 store` & `📁 stores`** - 状态管理 (需要清理)

- **作用**: 这两个文件夹的存在表明项目初始化时使用了 Pinia，但随着开发的演进，其内部文件可能已过时。
- **`store/ui.js` & `stores/counter.js`**:
  - **现状分析**: `counter.js` 是 Vue 官方模板的默认示例。`ui.js` 最初可能用于管理汉堡菜单的开关状态。但在最新的 `AppHeader.vue` 中，该状态已通过组件内部的 `ref` 来高效管理（状态本地化），因此 `ui.js` 也不再被需要。
  - **建议操作**: **这两个文件夹及其内部文件都应被视为冗余代码，建议在后续版本中安全删除**，以保持项目仓库的整洁。

### **`📁 views`** - 页面级视图组件

存放与特定路由直接绑定的页面级组件。它们通常负责组织和布局多个基础组件。

- **`📄 HomePage.vue`, `📄 ProjectsPage.vue`, `📄 ContactPage.vue`**:
  - **作用**: 分别代表网站的三个主要页面：首页、项目作品集页和联系我们页。
  - **技术细节**:
    - 它们负责各自页面的宏观布局，并组织 `components` 目录下的组件来填充内容。
    - 通常包含页面的核心业务逻辑，例如在 `ProjectsPage.vue` 中发起数据请求，在 `HomePage.vue` 中设置页面入场动画。
  - **关联**: 在 `router/index.js` 中被定义为路由的目标组件。

### **根目录核心文件**

- **`📄 App.vue`**
  - **作用**: **应用的根组件或应用外壳 (App Shell)**。它是所有内容的最终容器。
  - **职责**:
    1.  **定义宏观布局**: 渲染全局、持久化的组件，如 `AppHeader`, `AppFooter`, `AuroraBackground`。
    2.  **提供内容挂载点**: 包含一个 `<router-view>` 组件，作为所有页面视图 (`views` 目录下的组件) 的渲染出口。
    3.  **设置全局过渡**: 包裹 `<router-view>` 的 `<transition>` 标签定义了页面切换时的淡入淡出动画。
  - **关联**: 在 `main.js` 中被导入并作为应用的根进行挂载。

- **`📄 main.js`**
  - **作用**: **整个 Vue 应用的启动入口 (Bootstrap Script)**。
  - **职责**:
    1.  **创建应用实例**: `createApp(App)`。
    2.  **注册插件**: `app.use(createPinia())` 和 `app.use(router)`。
    3.  **导入全局资源**: `import './assets/styles/main.scss'`。
    4.  **挂载应用**: `app.mount('#app')`，将整个 Vue 应用与 `public/index.html` 中的 `<div id="app"></div>` 关联起来。
  - **关联**: 整个项目的起点。
